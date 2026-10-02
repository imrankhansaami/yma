import fs from "fs";
import mongoose from "mongoose";
import connectDB from "../app/config/db";
import Blog from "../app/modules/Blog/blog.model";
import { uploadToCloudinary } from "../app/utils/cloudinary.util";

/**
 * Import blog posts from a WordPress (WXR) export.
 *
 * Two jobs:
 *  1. Create the posts that are not on the site yet, downloading their
 *     images from the old WordPress host and re-uploading them to Cloudinary.
 *  2. Rewrite any inline <img> in existing posts that still points at
 *     ymabouncycastles.uk so the pictures survive that site going away.
 *
 * Usage:
 *   npx ts-node src/scripts/importWordpressBlogs.ts <export.xml>            # dry run
 *   npx ts-node src/scripts/importWordpressBlogs.ts <export.xml> --apply
 */

const OLD_HOST = "ymabouncycastles.uk";
const FOLDER = "uploads/blog";

// ---------------------------------------------------------------- WXR parsing

type WxrPost = {
  title: string;
  slug: string;
  status: string;
  date: string;
  content: string;
  thumbId: string;
  category: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
};
type WxrAttachment = { id: string; slug: string; url: string; alt: string };

const cdata = (block: string, tag: string) => {
  const m = block.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`));
  if (m) return m[1];
  // Some fields (wp:post_id) are written as plain text rather than CDATA.
  const plain = block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return plain ? plain[1].trim() : "";
};
const metaValue = (block: string, key: string) => {
  const m = block.match(
    new RegExp(`<wp:meta_key><!\\[CDATA\\[${key}\\]\\]></wp:meta_key>\\s*<wp:meta_value><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></wp:meta_value>`),
  );
  return m ? m[1] : "";
};

function parseWxr(xml: string) {
  const chunks = xml.split("<item>").slice(1).map((s) => s.split("</item>")[0]);
  const posts: WxrPost[] = [];
  const attachments: WxrAttachment[] = [];

  for (const raw of chunks) {
    const type = cdata(raw, "wp:post_type");
    if (type === "post") {
      posts.push({
        title: cdata(raw, "title"),
        slug: cdata(raw, "wp:post_name"),
        status: cdata(raw, "wp:status"),
        date: cdata(raw, "wp:post_date"),
        content: cdata(raw, "content:encoded"),
        thumbId: metaValue(raw, "_thumbnail_id"),
        category: (raw.match(/<category domain="category"[^>]*><!\[CDATA\[(.*?)\]\]>/) || [])[1] || "",
        tags: [...raw.matchAll(/<category domain="post_tag"[^>]*><!\[CDATA\[(.*?)\]\]>/g)].map((m) => m[1]),
        metaTitle: metaValue(raw, "_yoast_wpseo_title"),
        metaDescription: metaValue(raw, "_yoast_wpseo_metadesc"),
      });
    } else if (type === "attachment") {
      attachments.push({
        id: cdata(raw, "wp:post_id"),
        slug: cdata(raw, "wp:post_name"),
        url: cdata(raw, "wp:attachment_url"),
        alt: metaValue(raw, "_wp_attachment_image_alt") || cdata(raw, "title"),
      });
    }
  }
  return { posts, attachments };
}

// -------------------------------------------------------------- content tidy

/** Strip WordPress/Elementor/Notion artefacts and normalise the markup. */
function cleanContent(html: string) {
  return html
    .replace(/<!--\s*\/?wp:[\s\S]*?-->/g, "")
    .replace(/<!--\s*notionvc:[\s\S]*?-->/g, "")
    // FAQ anchors written as <a href="" onclick="return false;">Q</a> -> headings
    .replace(/<a href="" onclick="return false;">([\s\S]*?)<\/a>/g, "<h3>$1</h3>")
    .replace(/\s*data-preserver-spaces="[^"]*"/g, "")
    .replace(/\s*class="wp-block-[^"]*"/g, "")
    .replace(/\s*class="wp-image-\d+"/g, "")
    .replace(/<p>\s*<\/p>/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/** Point every old-host image at its Cloudinary replacement. */
function rewriteImages(html: string, map: Map<string, string>) {
  let out = html;
  for (const [oldUrl, newUrl] of map) {
    // Match the URL with or without a WordPress -WxH size suffix.
    const base = oldUrl.replace(/\.(\w+)$/, "");
    const re = new RegExp(base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?:-\\d+x\\d+)?\\.\\w+", "g");
    out = out.replace(re, newUrl);
  }
  return out;
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; YMA-import/1.0)" },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

// ---------------------------------------------------------------------- main

async function run() {
  const xmlPath = process.argv[2];
  const apply = process.argv.includes("--apply");
  if (!xmlPath || !fs.existsSync(xmlPath)) {
    console.error("Usage: ts-node importWordpressBlogs.ts <export.xml> [--apply]");
    process.exitCode = 1;
    return;
  }

  await connectDB();
  const { posts, attachments } = parseWxr(fs.readFileSync(xmlPath, "utf8"));
  const attById = new Map(attachments.map((a) => [a.id, a]));

  // Only published posts are imported; the single draft is a duplicate.
  const wanted = posts.filter((p) => p.status === "publish" && p.slug);
  const existing = await Blog.find().select("slug title description images slugAliases").lean();
  const existingBySlug = new Map(existing.map((b: any) => [b.slug, b]));

  // Some posts are already on the site under a longer, title-derived slug
  // (bouncy-castle-hire-for-school-events vs
  //  bouncy-castle-hire-for-school-events-fun-safe-options-for-your-pupils).
  // Match on a normalised title prefix so those are not duplicated; the export's
  // canonical slug is then added as an alias so both URLs keep working.
  const normaliseTitle = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const findExisting = (p: WxrPost) => {
    if (existingBySlug.has(p.slug)) return existingBySlug.get(p.slug) as any;
    const want = normaliseTitle(p.title);
    if (want.length < 12) return undefined;
    return (existing as any[]).find((b) => {
      const have = normaliseTitle(b.title);
      return have && (have.startsWith(want) || want.startsWith(have));
    });
  };

  const toCreate: WxrPost[] = [];
  const duplicates: { post: WxrPost; match: any }[] = [];
  for (const p of wanted) {
    const match = findExisting(p);
    if (match) duplicates.push({ post: p, match });
    else toCreate.push(p);
  }

  console.log(`[import] mode=${apply ? "APPLY" : "DRY RUN"}`);
  console.log(`[import] export posts=${wanted.length} already on site=${duplicates.length}`);
  console.log(`[import] to create: ${toCreate.map((p) => p.slug).join(", ") || "(none)"}`);
  if (duplicates.length) {
    console.log("[import] already present (will alias, not duplicate):");
    duplicates.forEach((d) => console.log(`  - ${d.post.slug}  ->  existing "${d.match.slug}"`));
  }

  // ---- collect every image we need -----------------------------------------
  const needed = new Map<string, string>(); // url -> alt
  for (const p of toCreate) {
    const thumb = attById.get(p.thumbId);
    if (thumb) needed.set(thumb.url, thumb.alt);
    for (const m of p.content.matchAll(/<img[^>]*src="([^"]+)"/g)) {
      if (m[1].includes(OLD_HOST)) {
        // Normalise a sized variant back to the original upload.
        needed.set(m[1].replace(/-\d+x\d+(?=\.\w+$)/, ""), p.title);
      }
    }
  }
  // Images still referenced by posts that already exist.
  for (const b of existing as any[]) {
    for (const m of String(b.description || "").matchAll(/<img[^>]*src="([^"]+)"/g)) {
      if (m[1].includes(OLD_HOST)) needed.set(m[1].replace(/-\d+x\d+(?=\.\w+$)/, ""), b.slug);
    }
  }

  console.log(`\n[import] images to migrate: ${needed.size}`);
  [...needed.keys()].forEach((u) => console.log(`  - ${u}`));

  if (!apply) {
    console.log("\n[import] dry run - re-run with --apply to download, upload and write");
    return;
  }

  // ---- download + upload ----------------------------------------------------
  const urlMap = new Map<string, string>();
  for (const [url] of needed) {
    try {
      const buf = await download(url);
      const newUrl = await uploadToCloudinary(buf, FOLDER);
      urlMap.set(url, newUrl);
      console.log(`  uploaded ${url.split("/").pop()} -> ${newUrl}`);
    } catch (e: any) {
      console.error(`  FAILED ${url}: ${e.message}`);
    }
  }

  // ---- create the missing posts --------------------------------------------
  for (const p of toCreate) {
    const thumb = attById.get(p.thumbId);
    const thumbUrl = thumb ? urlMap.get(thumb.url) || "" : "";
    const content = rewriteImages(cleanContent(p.content), urlMap);

    const images = [thumbUrl, ...[...content.matchAll(/<img[^>]*src="([^"]+)"/g)].map((m) => m[1])]
      .filter((u, i, arr) => u && arr.indexOf(u) === i);

    const created = await Blog.create({
      title: p.title.trim(),
      description: content,
      subtitle: p.metaDescription.slice(0, 180),
      authorName: p.category === "Blog Category 1" ? "Shourav Raj" : "Kabir Ahmed Ridoy",
      authorImage: "",
      images,
      imageAltText: thumb?.alt || p.title,
      category: p.category,
      tags: p.tags,
      status: "published",
      publishedAt: p.date ? new Date(p.date) : new Date(),
      metaTitle: p.metaTitle && !p.metaTitle.includes("%%") ? p.metaTitle : p.title,
      metaDescription: p.metaDescription,
    } as any);

    console.log(`  created "${created.title}" (slug=${(created as any).slug}) images=${images.length}`);
  }

  // ---- alias the canonical slugs of posts that were already imported -------
  for (const { post, match } of duplicates) {
    const aliases = Array.isArray(match.slugAliases) ? match.slugAliases : [];
    if (aliases.includes(post.slug)) continue;
    await Blog.updateOne(
      { _id: match._id },
      { $set: { slugAliases: [...aliases, post.slug].filter(Boolean) } },
    );
    console.log(`  aliased ${post.slug} -> ${match.slug}`);
  }

  // ---- repoint old images in existing posts --------------------------------
  if (urlMap.size) {
    for (const b of existing as any[]) {
      const before = String(b.description || "");
      if (!before.includes(OLD_HOST)) continue;
      const after = rewriteImages(before, urlMap);
      if (after !== before) {
        await Blog.updateOne({ _id: b._id }, { $set: { description: after } });
        console.log(`  repointed old images in ${b.slug}`);
      }
    }
  }

  console.log("\n[import] done");
}

run()
  .catch((e) => {
    console.error("[import] failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch {
      /* ignore */
    }
  });