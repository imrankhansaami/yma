import fs from "fs";
import mongoose from "mongoose";
import { Types } from "mongoose";
import connectDB from "../app/config/db";
import Product from "../app/modules/Product/product.model";
import Category from "../app/modules/Category/category.model";
import { uploadToCloudinary } from "../app/utils/cloudinary.util";
import { normalizeSlug } from "../app/utils/slug";

/**
 * Import WooCommerce products from a WordPress (WXR) export.
 *
 * WordPress drafts and the hidden "Booking" helper products are reported but
 * never created. For each real published product the export's pictures are
 * downloaded from the old WordPress host, re-uploaded to Cloudinary and wired
 * into the product (cover + gallery).
 *
 * Usage:
 *   ts-node src/scripts/importWordpressProducts.ts <export.xml>            # dry run
 *   ts-node src/scripts/importWordpressProducts.ts <export.xml> --apply
 */

const OLD_HOST = "ymabouncycastles.uk";
const COVER_FOLDER = "products/covers";
const GALLERY_FOLDER = "products";

// Defaults mirrored from the products already on the site, so an imported row
// behaves exactly like its neighbours.
const DEFAULTS = {
  vendor: "YMA",
  warehouse: "yma",
  difficulty: "easy",
  location: { country: "England", state: "London" },
  availableFrom: new Date("2026-03-07T00:00:00.000Z"),
  availableUntil: new Date("2031-01-07T00:00:00.000Z"),
  stock: 1,
};

// WordPress product categories -> the categories the site actually uses.
const CATEGORY_MAP: Record<string, string[]> = {
  "bouncy castle and softplay": ["Bouncy Castle", "Soft Play"],
  "bouncy castles": ["Bouncy Castle"],
  "bouncy castle": ["Bouncy Castle"],
  "soft play": ["Soft Play"],
  "garden games": ["Garden Games"],
  "fun food": ["Fun Food"],
  "obstacle course": ["Obstacle Course/Slides"],
  "obstacle courses": ["Obstacle Course/Slides"],
};

// ---------------------------------------------------------------- WXR parsing

type WxrProduct = {
  id: string;
  title: string;
  slug: string;
  status: string;
  date: string;
  price: string;
  sale: string;
  thumbId: string;
  galleryIds: string[];
  categories: string[];
  visibility: string[];
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
};
type WxrAttachment = { id: string; url: string; alt: string; title: string };

const cdata = (block: string, tag: string) => {
  const m = block.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`));
  if (m) return m[1];
  const plain = block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return plain ? plain[1].trim() : "";
};

const metaValue = (block: string, key: string) => {
  const m = block.match(
    new RegExp(
      `<wp:meta_key><!\\[CDATA\\[${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]\\]></wp:meta_key>\\s*<wp:meta_value><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></wp:meta_value>`,
    ),
  );
  return m ? m[1].trim() : "";
};

function parseWxr(xml: string) {
  const chunks = xml.split("<item>").slice(1).map((s) => s.split("</item>")[0]);
  const products: WxrProduct[] = [];
  const attachments = new Map<string, WxrAttachment>();

  for (const raw of chunks) {
    const type = cdata(raw, "wp:post_type");
    if (type === "product") {
      products.push({
        id: cdata(raw, "wp:post_id"),
        title: cdata(raw, "title"),
        slug: cdata(raw, "wp:post_name"),
        status: cdata(raw, "wp:status"),
        date: cdata(raw, "wp:post_date"),
        price: metaValue(raw, "_regular_price"),
        sale: metaValue(raw, "_sale_price"),
        thumbId: metaValue(raw, "_thumbnail_id"),
        galleryIds: metaValue(raw, "_product_image_gallery")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        categories: [...raw.matchAll(/<category domain="product_cat"[^>]*><!\[CDATA\[(.*?)\]\]><\/category>/g)].map((m) => m[1]),
        visibility: [...raw.matchAll(/<category domain="product_visibility"[^>]*><!\[CDATA\[(.*?)\]\]><\/category>/g)].map((m) => m[1]),
        content: cdata(raw, "content:encoded"),
        excerpt: cdata(raw, "excerpt:encoded"),
        metaTitle: metaValue(raw, "_yoast_wpseo_title"),
        metaDescription: metaValue(raw, "_yoast_wpseo_metadesc"),
      });
    } else if (type === "attachment") {
      attachments.set(cdata(raw, "wp:post_id"), {
        id: cdata(raw, "wp:post_id"),
        url: cdata(raw, "wp:attachment_url"),
        alt: metaValue(raw, "_wp_attachment_image_alt"),
        title: cdata(raw, "title"),
      });
    }
  }
  return { products, attachments };
}

// ------------------------------------------------------------- helpers

/** Remove editor artefacts and wrap any bare leading text in a paragraph. */
function cleanContent(html: string) {
  let out = html
    .replace(/\s*data-start="[^"]*"/g, "")
    .replace(/\s*data-end="[^"]*"/g, "")
    .replace(/\s*data-preserver-spaces="[^"]*"/g, "")
    .replace(/\s*class="[^"]*"/g, "")
    .replace(/<p>\s*<\/p>/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();

  if (out && !out.startsWith("<")) {
    const idx = out.indexOf("<");
    if (idx > 0) out = `<p>${out.slice(0, idx).trim()}</p>` + out.slice(idx);
  }
  return out;
}

/** Alt text is capped at 255 chars by the model. */
function trimAlt(text: string, max = 250) {
  const t = String(text || "").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim();
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; YMA-import/1.0)" },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

const normalise = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

// ---------------------------------------------------------------------- main

async function run() {
  const xmlPath = process.argv[2];
  const apply = process.argv.includes("--apply");
  if (!xmlPath || !fs.existsSync(xmlPath)) {
    console.error("Usage: ts-node importWordpressProducts.ts <export.xml> [--apply]");
    process.exitCode = 1;
    return;
  }

  await connectDB();
  const { products, attachments } = parseWxr(fs.readFileSync(xmlPath, "utf8"));
  const existing = await Product.find().select("name slug price").lean();
  const categories = await Category.find().lean();
  const catByName = new Map(categories.map((c: any) => [String(c.name).toLowerCase(), c]));

  const findExisting = (p: WxrProduct) => {
    const bySlug = (existing as any[]).find((e) => normalizeSlug(e.slug) === normalizeSlug(p.slug));
    if (bySlug) return bySlug;
    const want = normalise(p.title);
    if (want.length < 8) return undefined;
    return (existing as any[]).find((e) => {
      const have = normalise(e.name);
      if (!have || have.length < 8) return false;
      return have.startsWith(want) || want.startsWith(have);
    });
  };

  type Row = { product: WxrProduct; kind: "create" | "present" | "draft" | "hidden"; match?: any };
  const rows: Row[] = products.map((p) => {
    if (p.status !== "publish") return { product: p, kind: "draft" };
    if (p.visibility.includes("exclude-from-catalog")) return { product: p, kind: "hidden" };
    const match = findExisting(p);
    return match ? { product: p, kind: "present", match } : { product: p, kind: "create" };
  });

  console.log(`[products] mode=${apply ? "APPLY" : "DRY RUN"}  export rows=${products.length}\n`);
  for (const r of rows) {
    const p = r.product;
    const price = p.sale ? `${p.sale} (was ${p.price})` : p.price;
    const label =
      r.kind === "create" ? "TO ADD   " : r.kind === "present" ? "on site  " : r.kind === "draft" ? "draft    " : "hidden   ";
    console.log(`${label} ${p.title}`);
    console.log(`           id=${p.id} slug=${p.slug} price=${price} cats=${JSON.stringify(p.categories)}`);
    if (r.kind === "present") console.log(`           -> matches "${r.match.name}" (${r.match.slug})`);
    if (r.kind === "hidden") console.log(`           -> WooCommerce helper product (excluded from catalog), not a rental`);
    if (r.kind === "draft") console.log(`           -> WordPress draft, not published`);
  }

  const toCreate = rows.filter((r) => r.kind === "create").map((r) => r.product);
  console.log(`\n[products] to add: ${toCreate.map((p) => p.title).join(" | ") || "(none)"}`);

  if (!toCreate.length) {
    console.log("[products] nothing to do");
    return;
  }

  // ---- images needed ---------------------------------------------------------
  const needed = new Map<string, WxrAttachment>();
  for (const p of toCreate) {
    const cover = attachments.get(p.thumbId);
    if (cover) needed.set(cover.url, cover);
    for (const id of p.galleryIds) {
      const a = attachments.get(id);
      if (a && a.url.includes(OLD_HOST)) needed.set(a.url, a);
    }
  }
  console.log(`\n[products] images to migrate: ${needed.size}`);
  [...needed.keys()].forEach((u) => console.log(`  - ${u.split("/").pop()}`));

  if (!apply) {
    console.log("\n[products] dry run - re-run with --apply to download, upload and create");
    return;
  }

  // ---- download + upload -----------------------------------------------------
  const urlMap = new Map<string, string>();
  for (const [url, att] of needed) {
    try {
      const buf = await download(url);
      const isCover = [...toCreate].some((p) => (attachments.get(p.thumbId) || {}).url === url);
      const newUrl = await uploadToCloudinary(buf, isCover ? COVER_FOLDER : GALLERY_FOLDER);
      urlMap.set(url, newUrl);
      console.log(`  uploaded ${url.split("/").pop()} -> ${newUrl}`);
    } catch (e: any) {
      console.error(`  FAILED ${url}: ${e.message}`);
    }
  }

  // ---- create ----------------------------------------------------------------
  for (const p of toCreate) {
    const cover = attachments.get(p.thumbId);
    const coverUrl = cover ? urlMap.get(cover.url) || "" : "";

    const gallery: string[] = [];
    for (const id of p.galleryIds) {
      const a = attachments.get(id);
      if (!a) continue;
      const url = urlMap.get(a.url);
      if (url && url !== coverUrl && !gallery.includes(url)) gallery.push(url);
    }

    const catIds: Types.ObjectId[] = [];
    for (const wpCat of p.categories) {
      const mapped = CATEGORY_MAP[wpCat.toLowerCase()] || [];
      for (const siteName of mapped) {
        const cat: any = catByName.get(siteName.toLowerCase());
        if (cat && !catIds.some((id) => id.equals(cat._id))) catIds.push(cat._id);
      }
    }

    const price = Number(p.sale || p.price) || 0;
    const created = await Product.create({
      name: p.title,
      description: cleanContent(p.content),
      summary: p.excerpt.slice(0, 500),
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      price,
      stock: DEFAULTS.stock,
      isActive: true,
      active: true,
      vendor: DEFAULTS.vendor,
      warehouse: DEFAULTS.warehouse,
      difficulty: DEFAULTS.difficulty,
      categories: catIds,
      images: gallery,
      imageCover: coverUrl,
      imageCoverAltText: trimAlt(cover?.alt || ""),
      location: { ...DEFAULTS.location },
      availableFrom: DEFAULTS.availableFrom,
      availableUntil: DEFAULTS.availableUntil,
    } as any);

    // The model always derives a slug from the name on create. Prefer the
    // export's canonical slug and keep the derived one as an alias.
    const canonical = normalizeSlug(p.slug);
    if (canonical && canonical !== created.slug) {
      await Product.updateOne(
        { _id: created._id },
        {
          $set: {
            slug: canonical,
            slugAliases: [created.slug, ...(created.slugAliases || [])].filter(
              (s, i, arr) => s && s !== canonical && arr.indexOf(s) === i,
            ),
          },
        },
      );
    }

    console.log(
      `  created "${created.name}" slug=${canonical || created.slug} price=${price} cats=${catIds.length} cover=${coverUrl ? "yes" : "no"} gallery=${gallery.length}`,
    );
  }

  const total = await Product.countDocuments();
  console.log(`\n[products] done - ${total} products in the catalogue`);
}

run()
  .catch((e) => {
    console.error("[products] failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch {
      /* ignore */
    }
  });