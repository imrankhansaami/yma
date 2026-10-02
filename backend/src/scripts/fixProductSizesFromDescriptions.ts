import mongoose from "mongoose";
import connectDB from "../app/config/db";
import Product from "../app/modules/Product/product.model";
import { formatSize } from "../app/utils/productSize";

/**
 * Correct product sizes from the wording of each product's own description.
 *
 * The 2026-03-07 copies that survived the de-duplication carry SEO copy that
 * states the real dimensions, but a few rows had those dimensions entered
 * wrongly - length/width swapped, or the width stored as the height. This
 * re-reads each description (falling back to the SEO title, which also states
 * sizes) and rewrites `dimensions`, the internal `size` string and
 * `sizeFootprint` so all three agree.
 *
 * Products whose copy never states a size are reported, not guessed at.
 *
 * Usage:
 *   ts-node src/scripts/fixProductSizesFromDescriptions.ts            # dry run
 *   ts-node src/scripts/fixProductSizesFromDescriptions.ts --apply
 */

const stripHtml = (html: string) =>
  String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#8217;|&rsquo;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

// "12ft (Length)", "12 ft (Width)", "8ft(W)", "12ft L"
const LABEL_AFTER = /(\d+(?:\.\d+)?)\s*(?:ft|foot|feet)?\s*\(?\s*(length|width|height|l|w|h)\b\s*\)?/gi;
// "Length: 12 ft", "Dimensions: Width: 10 ft"
const LABEL_BEFORE = /\b(length|width|height)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:ft|foot|feet)?/gi;
// "12ft x 15ft", "12 ft x 15 ft x 10 ft"
const PLAIN = /(\d+(?:\.\d+)?)\s*(?:ft|foot|feet)\s*(?:x|by)\s*(\d+(?:\.\d+)?)\s*(?:ft|foot|feet)(?:\s*(?:x|by)\s*(\d+(?:\.\d+)?)\s*(?:ft|foot|feet))?/i;

type Parsed = { length: number; width: number; height?: number };

/** Labelled values only ("12ft (Length)", "Width: 10 ft"). */
function parseLabelled(raw: string): { l?: number; w?: number; h?: number } | null {
  const text = stripHtml(raw);
  if (!text) return null;
  const slots: { l?: number; w?: number; h?: number } = {};
  const put = (label: string, value: string) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return;
    const key = /^(l|length)/i.test(label) ? "l" : /^(w|width)/i.test(label) ? "w" : "h";
    if (slots[key] === undefined) slots[key] = n;
  };
  for (const m of text.matchAll(LABEL_AFTER)) put(m[2], m[1]);
  for (const m of text.matchAll(LABEL_BEFORE)) put(m[1], m[2]);
  return slots.l && slots.w ? slots : null;
}

/** Unlabelled "12ft x 15ft x 10ft". */
function parsePlain(raw: string): Parsed | null {
  const text = stripHtml(raw);
  const plain = text.match(PLAIN);
  if (!plain) return null;
  return {
    length: Number(plain[1]),
    width: Number(plain[2]),
    height: plain[3] ? Number(plain[3]) : undefined,
  };
}

/**
 * Prefer explicitly labelled dimensions wherever they appear (the SEO title
 * often labels them even when the body does not). Only fall back to an
 * unlabelled figure when nothing is labelled.
 */
function parseSize(product: { description?: string; metaTitle?: string }): { parsed: Parsed; source: string } | null {
  const labelledDesc = parseLabelled(product.description || "");
  if (labelledDesc) return { parsed: { length: labelledDesc.l!, width: labelledDesc.w!, height: labelledDesc.h }, source: "description (labelled)" };

  const labelledTitle = parseLabelled(product.metaTitle || "");
  if (labelledTitle) return { parsed: { length: labelledTitle.l!, width: labelledTitle.w!, height: labelledTitle.h }, source: "seo title (labelled)" };

  const plainDesc = parsePlain(product.description || "");
  if (plainDesc) return { parsed: plainDesc, source: "description" };

  const plainTitle = parsePlain(product.metaTitle || "");
  if (plainTitle) return { parsed: plainTitle, source: "seo title" };

  return null;
}

const same = (a: any, b: any) => Number(a) === Number(b);

async function run() {
  const apply = process.argv.includes("--apply");
  console.log(`[sizes] mode=${apply ? "APPLY" : "DRY RUN"}\n`);

  await connectDB();

  const products: any[] = await Product.find().select("name slug description metaTitle dimensions size sizeFootprint createdAt").lean();

  let changed = 0;
  const unresolved: any[] = [];

  for (const p of products) {
    const current = {
      length: Number(p.dimensions?.length) || undefined,
      width: Number(p.dimensions?.width) || undefined,
      height: Number(p.dimensions?.height) || undefined,
    };

    const found = parseSize(p);
    if (!found) {
      unresolved.push(p);
      continue;
    }
    const parsed = found.parsed;
    const source = found.source;

    // Height: use the description's if given. Otherwise keep what is stored,
    // unless the stored height is really the width/length misread as one.
    let height = parsed.height ?? current.height;
    if (parsed.height == null && height != null && (same(height, parsed.length) || same(height, parsed.width))) {
      height = 10;
    }

    const unchanged =
      same(current.length, parsed.length) &&
      same(current.width, parsed.width) &&
      (height == null || same(current.height, height));

    if (unchanged) continue;

    const size = formatSize(parsed.length, parsed.width, height);
    const footprint = parsed.length * parsed.width;

    console.log(`${p.name}`);
    console.log(`   source     : ${source}`);
    console.log(`   dimensions : ${current.length ?? "-"}x${current.width ?? "-"}x${current.height ?? "-"}  ->  ${parsed.length}x${parsed.width}x${height ?? "-"}`);
    console.log(`   size       : "${p.size || ""}"  ->  "${size}"`);
    console.log(`   footprint  : ${p.sizeFootprint ?? 0}  ->  ${footprint}`);

    if (apply) {
      await Product.updateOne(
        { _id: p._id },
        {
          $set: {
            dimensions: { length: parsed.length, width: parsed.width, height },
            size,
            sizeFootprint: footprint,
          },
        },
      );
      console.log(`   applied`);
    }
    changed++;
  }

  console.log("\n" + "=".repeat(88));
  console.log(`[sizes] ${apply ? "updated" : "would update"}: ${changed} product(s)`);

  if (unresolved.length) {
    console.log(`\n[sizes] ${unresolved.length} product(s) state no size at all - left untouched:`);
    for (const p of unresolved) {
      const d = p.dimensions?.length ? `${p.dimensions.length}x${p.dimensions.width}x${p.dimensions.height}` : "-";
      console.log(`   ${String(p.name).slice(0, 46).padEnd(48)} dims=${d.padEnd(12)} size="${p.size || ""}"`);
    }
  }

  if (!apply) console.log("\n[sizes] dry run - re-run with --apply to write");
}

run()
  .catch((e) => {
    console.error("[sizes] failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch {
      /* ignore */
    }
  });