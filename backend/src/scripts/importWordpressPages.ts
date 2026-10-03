import fs from "fs";
import mongoose from "mongoose";
import connectDB from "../app/config/db";
import PageContent from "../app/modules/PageContent/pageContent.model";
import { uploadToCloudinary } from "../app/utils/cloudinary.util";
import { normalizeSlug } from "../app/utils/slug";

/**
 * Import pages from a WordPress (WXR) export into PageContent records.
 *
 * The old site was built on a page-builder theme, so the stored content is a
 * mix of real copy and template chrome (hero headers, breadcrumbs, the old
 * catalogue carousel, the theme's promo footer). This script keeps the copy,
 * drops the chrome, migrates the images to Cloudinary and writes one
 * `core` PageContent record per page so the site can serve them from /[slug].
 *
 * Pages that already exist on the new site (contact, faqs, terms, ...) are
 * written under their current page key. Anything whose old copy is theme demo
 * data is imported but left inactive so it never reaches the storefront.
 *
 * Usage:
 *   ts-node src/scripts/importWordpressPages.ts <export.xml>                 # dry run
 *   ts-node src/scripts/importWordpressPages.ts <export.xml> --apply
 *   ts-node src/scripts/importWordpressPages.ts <export.xml> --preview about
 */

const OLD_HOST = "ymabouncycastles.uk";

// ------------------------------------------------------------------ WXR parse

type WxrPage = {
  id: string;
  title: string;
  slug: string;
  status: string;
  date: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  canonical: string;
};

const cdata = (block: string, tag: string) => {
  const m = block.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`));
  if (m) return m[1];
  const plain = block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return plain ? plain[1].trim() : "";
};

const metaValue = (block: string, key: string) => {
  const m = block.match(
    new RegExp(
      `<wp:meta_key><!\\[CDATA\\[${key}\\]\\]></wp:meta_key>\\s*<wp:meta_value><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></wp:meta_value>`,
    ),
  );
  return m ? m[1] : "";
};

function parseWxr(xml: string): WxrPage[] {
  const chunks = xml.split("<item>").slice(1).map((s) => s.split("</item>")[0]);
  const pages: WxrPage[] = [];
  for (const raw of chunks) {
    if (cdata(raw, "wp:post_type") !== "page") continue;
    pages.push({
      id: cdata(raw, "wp:post_id"),
      title: cdata(raw, "title"),
      slug: cdata(raw, "wp:post_name"),
      status: cdata(raw, "wp:status"),
      date: cdata(raw, "wp:post_date"),
      content: cdata(raw, "content:encoded"),
      metaTitle: metaValue(raw, "_yoast_wpseo_title"),
      metaDescription: metaValue(raw, "_yoast_wpseo_metadesc"),
      focusKeyword: metaValue(raw, "_yoast_wpseo_focuskw"),
      canonical: metaValue(raw, "_yoast_wpseo_canonical"),
    });
  }
  return pages;
}

// -------------------------------------------------------------- content tidy

const VOID_TAGS = new Set(["img", "br", "hr", "input", "meta", "link", "source", "path"]);
const INLINE_TAGS = new Set([
  "a", "strong", "b", "em", "i", "u", "span", "small", "code", "sub", "sup", "br", "s", "mark",
]);
/** Block tags whose content is prose and must not be re-wrapped. */
const TEXT_CONTAINERS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "td", "th"]);

/**
 * Text sitting directly inside a <div> loses all spacing once the theme's
 * classes are gone, so collect each run of loose inline content and wrap it in
 * a paragraph. Runs are only broken by block-level tags, so text split across
 * inline markup stays in one paragraph.
 */
function wrapLooseText(html: string) {
  const tokens = html.match(/<[^>]+>|[^<]+/g) || [];
  const blocks: string[] = [];
  let out = "";
  let buffer = "";

  const currentContainer = () => blocks[blocks.length - 1];

  const flush = () => {
    const content = buffer;
    buffer = "";
    if (!content.trim()) return;
    out += TEXT_CONTAINERS.has(currentContainer()) ? content : `<p>${content.trim()}</p>`;
  };

  for (const token of tokens) {
    if (!token.startsWith("<")) {
      buffer += token;
      continue;
    }
    const name = (token.match(/^<\/?([a-zA-Z0-9]+)/) || [])[1]?.toLowerCase() || "";
    const isClose = /^<\//.test(token);

    if (INLINE_TAGS.has(name)) {
      // Inline markup joins whatever run is being collected.
      buffer += token;
      continue;
    }

    // A block-level tag ends the current run.
    flush();
    out += token;
    if (isClose) {
      const at = blocks.lastIndexOf(name);
      if (at > -1) blocks.splice(at, 1);
    } else if (name && !VOID_TAGS.has(name) && !/\/>$/.test(token)) {
      blocks.push(name);
    }
  }
  flush();
  return out;
}

/** Theme links that should point at the new site instead of the old one. */
function rewriteHref(href: string) {
  if (!href) return "";
  const rules: [RegExp, (m: RegExpMatchArray) => string][] = [
    [/^https?:\/\/(?:www\.)?ymabouncycastles\.(?:uk|co\.uk)\/catalog\/([^/?#"]*)\/?$/, (m) => `/product/${m[1]}`],
    [/^\/catalog\/([^/?#"]*)\/?$/, (m) => `/product/${m[1]}`],
    [/vehicle_type\/bouncy[-_]?castle/, () => "/bouncy-castle-hire"],
    [/vehicle_type\/soft[-_]?play/, () => "/soft-play-hire"],
    [/vehicle_type\/garden[-_]?games/, () => "/garden-games-hire"],
    [/vehicle_type\/fun[-_]?food/, () => "/fun-food-hire"],
    [/vehicle_type\//, () => "/booking-catalog"],
    [/^https?:\/\/(?:www\.)?ymabouncycastles\.(?:uk|co\.uk)\/([^/?#"]*)\/?$/, (m) => `/${m[1]}`],
  ];
  for (const [re, fn] of rules) {
    const m = href.match(re);
    if (m) return fn(m);
  }
  // External links and anchors keep working.
  if (/^(https?:|mailto:|tel:|#)/.test(href) && !href.includes("ymabouncycastles")) {
    return href;
  }
  return "";
}

function cleanContent(raw: string) {
  let h = raw;

  h = h.replace(/<!--[\s\S]*?-->/g, "");

  // Template chrome.
  for (const tag of ["header", "footer", "nav", "svg", "iframe", "form", "button", "select", "script", "style", "noscript"]) {
    h = h.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"), "");
  }
  h = h.replace(/<input\b[^>]*\/?>/gi, "");
  h = h.replace(/<option\b[^>]*>[\s\S]*?<\/option>/gi, "");
  // WordPress shortcodes (contact form etc).
  h = h.replace(/\[(contact-form-7|wpforms|gravityforms?|ninja_forms|vc_[a-z_]+|et_pb_[a-z_]+)[^\]]*\]/gi, "");

  // Everything from here on is the old catalogue carousel / theme promo block.
  const MARKERS = [
    "Get Your Rentals In Easy Steps",
    "WELCOME TO",
    "Total Rental Price",
    "View Details",
    "We Help To Utilize The Best Equipment Work Better",
    "Bringing Fun to New Heights",
    "Get Quick Support",
    "GET STARTED",
  ];
  let cut = -1;
  for (const marker of MARKERS) {
    const i = h.indexOf(marker);
    if (i >= 0 && (cut < 0 || i < cut)) cut = i;
  }
  if (cut >= 0) {
    const blockStart = h.lastIndexOf("<", cut);
    h = h.slice(0, blockStart > 0 ? blockStart : cut);
  }

  // FAQ accordions were written as dead anchors; a heading reads better.
  h = h.replace(/<a\b[^>]*onclick="return false;"[^>]*>([\s\S]*?)<\/a>/gi, "<h3>$1</h3>");

  // Links.
  h = h.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_full, attrs: string, inner: string) => {
    const href = (attrs.match(/href="([^"]*)"/) || [, ""])[1];
    const target = rewriteHref(href);
    const text = inner.replace(/<[^>]+>/g, "").trim();
    if (!target || !text) return inner;
    return `<a href="${target}">${inner}</a>`;
  });

  // Attributes: keep only what the site needs.
  h = h.replace(/<(?!a\b|img\b)([a-zA-Z0-9]+)\b[^>]*>/g, (_m, tag: string) => `<${tag.toLowerCase()}>`);
  h = h.replace(/<a\b[^>]*>/gi, (tag) => {
    const href = (tag.match(/href="([^"]*)"/) || [, ""])[1];
    return href ? `<a href="${href}">` : "<a>";
  });
  h = h.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = (tag.match(/src="([^"]*)"/) || [, ""])[1];
    const alt = (tag.match(/alt="([^"]*)"/) || [, ""])[1];
    return src ? `<img src="${src}" alt="${alt}">` : "";
  });

  h = wrapLooseText(h);

  // Tidy.
  h = h.replace(/<p>\s*<\/p>/gi, "");
  h = h.replace(/<ul>\s*<\/ul>/gi, "");
  h = h.replace(/<li>\s*<\/li>/gi, "");
  h = h.replace(/<\/?bdi>/gi, "");
  h = h.replace(/<i>\s*<\/i>/gi, "");
  h = h.replace(/<b>\s*<\/b>/gi, "");
  h = h.replace(/<strong>\s*<\/strong>/gi, "");
  h = h.replace(/<br\s*\/?>\s*(<\/p>)/gi, "$1");
  h = h.replace(/[ \t\r\n]+/g, " ");
  h = h.replace(/>\s+</g, "><");
  h = h.replace(/\s+(<\/(?:p|h1|h2|h3|h4|ul|ol|li|blockquote)>)/gi, "$1");
  return h.trim();
}

/** Split the cleaned body into CMS sections on <h2> boundaries. */
function toSections(html: string, fallbackTitle: string) {
  const sections: { sectionKey: string; title: string; content: string; order: number }[] = [];
  const re = /<h2>([\s\S]*?)<\/h2>/gi;
  const chunks: { title: string; body: string }[] = [];
  let last = 0;
  let current = "";
  let m: RegExpExecArray | null;

  while ((m = re.exec(html))) {
    const before = html.slice(last, m.index).trim();
    if (before || current) chunks.push({ title: current, body: before });
    current = m[1].replace(/<[^>]+>/g, "").trim();
    last = m.index + m[0].length;
  }
  const tail = html.slice(last).trim();
  if (tail || current) chunks.push({ title: current, body: tail });

  const used = new Set<string>();
  chunks
    .filter((c) => c.body || c.title)
    .forEach((chunk, index) => {
      let key = normalizeSlug(chunk.title) || normalizeSlug(`${fallbackTitle}-${index + 1}`) || `section-${index + 1}`;
      while (used.has(key)) key = `${key}-${index + 1}`;
      used.add(key);
      sections.push({
        sectionKey: key,
        title: chunk.title,
        content: chunk.body,
        order: index,
      });
    });

  return sections;
}

// ------------------------------------------------------------- what to import

type Plan = {
  /** key on the new site (defaults to the WordPress slug) */
  key?: string;
  title?: string;
  /** false = imported but hidden from the storefront */
  active?: boolean;
  note?: string;
};

const SKIP: Record<string, string> = {
  home: "homepage stays as built",
  news: "the site already has /blog",
  shop: "the site has /booking-catalog",
  cart: "the site has its own cart",
  checkout: "the site has its own checkout",
  "my-account": "the site has /profile",
  payment: "empty in the export",
  "thank-you": "the site has /checkout/success",
  "rental-categories-1": "empty theme template",
  "rental-categories-2": "empty theme template",
};

const PLAN: Record<string, Plan> = {
  contact: { key: "contact", note: "head office address and opening hours appended to /contact" },
  "our-locations": {
    key: "locations",
    active: false,
    note: "/locations already carries this list in a richer layout with links",
  },
  faq: { key: "faqs", active: false, note: "live /faqs already carries these exact Q&As" },
  "terms-and-conditions": { key: "terms", active: false, note: "live /terms is the newer version" },
  "privacy-policy": { key: "privacy-policy", active: false, note: "export holds the WordPress demo policy" },
  "refund_returns-2": { key: "refund-and-returns-policy", active: false, note: "WooCommerce sample with {email address} placeholders" },
  "our-team": { key: "our-team", active: false, note: "theme demo staff (William Mason, Amelia Grace)" },
  about: { title: "About Us" },
  "christmas-bouncy-castle-hire": { title: "Christmas Bouncy Castle Hire" },
};

/**
 * A couple of pages read better with hand-written sections than with the
 * export's heading soup. The values still come straight from the WordPress
 * page.
 */
const HAND_WRITTEN: Record<string, { title: string; content: string }[]> = {
  contact: [
    {
      title: "Visit or call us",
      content:
        "<p><strong>Head office</strong><br>28 Roding Road, Loughton, IG10 3ED, United Kingdom</p>" +
        "<p><strong>Rental support</strong><br><a href=\"tel:07951431111\">07951 431111</a></p>" +
        "<p><strong>Office hours</strong><br>7 days a week, 8am to 7pm</p>" +
        "<p><strong>Email</strong><br><a href=\"mailto:info@ymabouncycastles.uk\">info@ymabouncycastles.uk</a></p>",
    },
  ],
};

// ------------------------------------------------------------------- helpers

/** Yoast canonicals on a few pages still point at the old domain. */
function sanitizeCanonical(value: string) {
  const raw = (value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("/")) return raw;
  try {
    const url = new URL(raw);
    if (/ymabouncycastles\.(uk|co\.uk)$/i.test(url.hostname)) return url.pathname;
  } catch {
    /* ignore */
  }
  return "";
}

async function download(url: string): Promise<Buffer> {  const res = await fetch(url, {
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
  const previewIdx = process.argv.indexOf("--preview");
  const previewSlug = previewIdx > -1 ? process.argv[previewIdx + 1] : "";

  if (!xmlPath || !fs.existsSync(xmlPath)) {
    console.error("Usage: ts-node importWordpressPages.ts <export.xml> [--apply] [--preview <slug>]");
    process.exitCode = 1;
    return;
  }

  const pages = parseWxr(fs.readFileSync(xmlPath, "utf8"));

  if (previewSlug) {
    const page = pages.find((p) => p.slug === previewSlug);
    if (!page) {
      console.error(`no page with slug "${previewSlug}"`);
      process.exitCode = 1;
      return;
    }
    const cleaned = cleanContent(page.content);
    const plan = PLAN[page.slug] || {};
    const key = normalizeSlug(plan.key || page.slug);
    const handWritten = HAND_WRITTEN[key];
    console.log(`=== ${page.slug} (${handWritten ? "hand-written section" : `${cleaned.length} chars`}) ===\n`);
    if (!handWritten) console.log(cleaned);
    console.log(`\n=== sections ===`);
    const previewSections = handWritten
      ? handWritten.map((s) => ({ sectionKey: "-", title: s.title, content: s.content, order: 0 }))
      : toSections(cleaned, page.slug);
    previewSections.forEach((s) =>
      console.log(`  ${s.order + 1}. [${s.sectionKey}] "${s.title}" (${s.content.length} chars)`),
    );
    return;
  }

  await connectDB();

  const skipped: { slug: string; why: string }[] = [];
  const job: { page: WxrPage; key: string; title: string; active: boolean; note?: string }[] = [];

  for (const page of pages) {
    if (page.status !== "publish" || !page.slug) {
      skipped.push({ slug: page.slug || page.title, why: `status=${page.status}` });
      continue;
    }
    if (SKIP[page.slug]) {
      skipped.push({ slug: page.slug, why: SKIP[page.slug] });
      continue;
    }
    const plan = PLAN[page.slug] || {};
    job.push({
      page,
      key: normalizeSlug(plan.key || page.slug),
      title: plan.title || page.title.trim(),
      active: plan.active !== false,
      note: plan.note,
    });
  }

  console.log(`[pages] export pages: ${pages.length}`);
  console.log(`[pages] skipped: ${skipped.length}`);
  skipped.forEach((s) => console.log(`  - ${s.slug}  (${s.why})`));
  console.log(`\n[pages] to import: ${job.length}`);
  job.forEach((j) => console.log(`  ${j.active ? "LIVE " : "HIDDEN"}  /${j.key.padEnd(42)} "${j.title}"`));

  // ---- clean everything and collect the images -----------------------------
  const cleaned = new Map<string, { sections: ReturnType<typeof toSections>; body: string }>();
  const needed = new Map<string, string>();
  for (const j of job) {
    const handWritten = HAND_WRITTEN[j.key];
    const body = handWritten
      ? handWritten.map((s) => s.content).join("")
      : cleanContent(j.page.content);
    const withoutSizes = body.replace(/(https:\/\/ymabouncycastles\.uk\/[^"']*?)-\d+x\d+(\.\w+)/g, "$1$2");
    const sections = handWritten
      ? handWritten.map((s, i) => ({ sectionKey: `section-${i + 1}`, title: s.title, content: s.content, order: i }))
      : toSections(withoutSizes, j.key);
    cleaned.set(j.key, { sections, body: withoutSizes });
    for (const tag of withoutSizes.matchAll(/<img[^>]*src="([^"]+)"/g)) {
      if (tag[1].includes(OLD_HOST)) needed.set(tag[1], j.title);
    }
  }

  console.log(`\n[pages] images to migrate: ${needed.size}`);
  [...needed.keys()].forEach((u) => console.log(`  - ${u.split("/").pop()}`));

  if (!apply) {
    console.log("\n[pages] dry run - re-run with --apply to download, upload and write");
    return;
  }

  // ---- download + upload ---------------------------------------------------
  const urlMap = new Map<string, string>();
  for (const [url] of needed) {
    try {
      const buffer = await download(url);
      const newUrl = await uploadToCloudinary(buffer, "uploads/pages");
      urlMap.set(url, newUrl);
      console.log(`  uploaded ${url.split("/").pop()} -> ${newUrl}`);
    } catch (e: any) {
      console.error(`  FAILED ${url}: ${e.message}`);
    }
  }

  const rewrite = (html: string) => {
    let out = html;
    for (const [oldUrl, newUrl] of urlMap) out = out.split(oldUrl).join(newUrl);
    // Anything that could not be migrated is dropped rather than left pointing
    // at a host that is going away.
    out = out.replace(/<img[^>]*src="https?:\/\/[^"]*ymabouncycastles[^"]*"[^>]*>/gi, "");
    return out;
  };

  // ---- write ---------------------------------------------------------------
  let created = 0;
  let updated = 0;
  for (const j of job) {
    const stored = cleaned.get(j.key)!;
    const sections = stored.sections.map((section) => ({
      ...section,
      content: rewrite(section.content),
    }));

    const payload = {
      pageType: "core" as const,
      pageKey: j.key,
      title: j.title,
      sections,
      metaTitle: /%%/.test(j.page.metaTitle) ? j.title : j.page.metaTitle || j.title,
      metaDescription: j.page.metaDescription || "",
      metaKeywords: j.page.focusKeyword || "",
      canonicalUrl: sanitizeCanonical(j.page.canonical),
      isActive: j.active,
    };

    const existing = await PageContent.findOne({ pageType: "core", pageKey: j.key });
    if (existing) {
      await PageContent.updateOne({ _id: existing._id }, { $set: payload });
      updated++;
    } else {
      await PageContent.create(payload);
      created++;
    }
    console.log(
      `  ${existing ? "updated" : "created"}  /${j.key}  sections=${sections.length}  ${j.active ? "" : "(hidden)"}`,
    );
  }

  console.log(`\n[pages] created ${created}, updated ${updated}`);

  const live = await PageContent.countDocuments({ pageType: "core", isActive: true });
  const hidden = await PageContent.countDocuments({ pageType: "core", isActive: false });
  console.log(`[pages] core pages now: ${live} live, ${hidden} hidden`);
}

run()
  .catch((e) => {
    console.error("[pages] failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch {
      /* ignore */
    }
  });
