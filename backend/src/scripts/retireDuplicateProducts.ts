import mongoose from "mongoose";
import connectDB from "../app/config/db";
import Product from "../app/modules/Product/product.model";
import { normalizeSlugList } from "../app/utils/slug";

/**
 * Retire one copy of each duplicated product.
 *
 * The surviving rows are the 2026-03-07 copies (richer copy, longer
 * availability). The older rows are deactivated rather than deleted, so their
 * order history and inbound links stay intact.
 *
 * For each pair the survivor also:
 *   - takes the higher of the two prices
 *   - inherits the curated top-pick slot (top picks only list active products,
 *     so leaving the flag on a retired row would silently drop it from the home page)
 *   - gains the retired row's slug as an alias, so old/canonical URLs still resolve
 *
 * Usage:
 *   ts-node src/scripts/retireDuplicateProducts.ts            # dry run
 *   ts-node src/scripts/retireDuplicateProducts.ts --apply
 */

type Pair = { retire: string; keep: string };

const PAIRS: Pair[] = [
  { retire: "disco-dome", keep: "disco-dome-2" },
  { retire: "celebration-castle-bounce-house", keep: "celebration-castle-bounce-house-2" },
  { retire: "rainbow-soft-play-castle-activity-zone", keep: "rainbow-soft-play-castle-activity-zone-2" },
  { retire: "white-and-grey-bouncy-castle-and-softplay", keep: "white-and-grey-bouncy-castle-and-softplay-2" },
  { retire: "unicorn-bounce-and-slide", keep: "unicorn-bounce-and-slide-2" },
  { retire: "princess-15ft-x-12ft", keep: "princess-bouncy-castle" },
  { retire: "paw-patrol-12ft-x-12ft", keep: "paw-patrol" },
  { retire: "disco-themed-12ft-x-15ft", keep: "disco-themed-bouncy-castle" },
  { retire: "jungle-medium-15ft-x-12ft", keep: "jungle-medium" },
  { retire: "party-bouncer-adult-15ft-x-15ft", keep: "party-bouncer-adult" },
  { retire: "party-bouncer-small-8ft-x-10ft", keep: "party-bouncer-small" },
  { retire: "pink-purple-bouncer-10ft-x-12ft", keep: "pink-purple-bouncer" },
];

const money = (n: any) => (typeof n === "number" ? `£${n}` : "(none)");

async function run() {
  const apply = process.argv.includes("--apply");
  console.log(`[retire] mode=${apply ? "APPLY" : "DRY RUN"}  pairs=${PAIRS.length}\n`);

  await connectDB();

  let changed = 0;
  let skipped = 0;

  for (const { retire, keep } of PAIRS) {
    const retireDoc: any = await Product.findOne({ slug: retire }).lean();
    const keepDoc: any = await Product.findOne({ slug: keep }).lean();

    console.log("=".repeat(96));
    if (!retireDoc || !keepDoc) {
      console.log(`SKIP  ${retire} / ${keep}  - ${!retireDoc ? "retire row missing" : "keep row missing"}`);
      skipped++;
      continue;
    }

    // ---- what the survivor needs ------------------------------------------
    const keepPrice = Math.max(Number(keepDoc.price) || 0, Number(retireDoc.price) || 0);
    const keepPick = Boolean(keepDoc.isTopPick || retireDoc.isTopPick);
    const keepPickRank = keepDoc.topPickRank ?? retireDoc.topPickRank;
    const keepAliases = normalizeSlugList([...(keepDoc.slugAliases || []), retireDoc.slug]).filter(
      (s) => s && s !== keepDoc.slug,
    );

    const keepSet: Record<string, any> = {};
    if (keepDoc.isActive !== true) keepSet.isActive = true;
    if (keepDoc.active !== true) keepSet.active = true;
    if (Number(keepDoc.price) !== keepPrice) keepSet.price = keepPrice;
    if (keepPick && !keepDoc.isTopPick) keepSet.isTopPick = true;
    if (keepPickRank != null && keepDoc.topPickRank !== keepPickRank) keepSet.topPickRank = keepPickRank;
    const aliasDiff = JSON.stringify(keepAliases) !== JSON.stringify(keepDoc.slugAliases || []);
    if (aliasDiff) keepSet.slugAliases = keepAliases;

    const retireSet: Record<string, any> = {};
    if (retireDoc.isActive !== false) retireSet.isActive = false;
    if (retireDoc.active !== false) retireSet.active = false;
    if (retireDoc.isTopPick) retireSet.isTopPick = false;

    console.log(`KEEP    ${keepDoc.slug}  "${keepDoc.name}"`);
    console.log(`          price ${money(keepDoc.price)}${keepSet.price !== undefined ? ` -> ${money(keepPrice)}` : ""} | active ${keepDoc.isActive}${keepSet.isActive ? " -> true" : ""} | topPick ${keepDoc.isTopPick}${keepSet.isTopPick ? " -> true" : ""}`);
    if (keepSet.slugAliases) console.log(`          aliases + ${keepSet.slugAliases.filter((a: string) => !(keepDoc.slugAliases || []).includes(a)).join(", ")}`);
    console.log(`RETIRE  ${retireDoc.slug}  "${retireDoc.name}"`);
    console.log(`          active ${retireDoc.isActive} -> false${retireSet.isTopPick ? ` | topPick ${retireDoc.isTopPick} -> false` : ""} | orders kept (row not deleted)`);

    const noop = !Object.keys(keepSet).length && !Object.keys(retireSet).length;
    if (noop) {
      console.log(`  (already in the target state - nothing to change)`);
      skipped++;
      continue;
    }

    if (apply) {
      if (Object.keys(keepSet).length) await Product.updateOne({ _id: keepDoc._id }, { $set: keepSet });
      if (Object.keys(retireSet).length) await Product.updateOne({ _id: retireDoc._id }, { $set: retireSet });
      console.log(`  applied`);
    }
    changed++;
  }

  console.log("\n" + "=".repeat(96));
  if (apply) {
    const total = await Product.countDocuments();
    const active = await Product.countDocuments({ isActive: true });
    const picks = await Product.countDocuments({ isTopPick: true });
    console.log(`[retire] done - ${changed} pair(s) updated, ${skipped} skipped`);
    console.log(`         catalogue: ${total} products, ${active} active, ${picks} top picks`);
  } else {
    console.log(`[retire] dry run - ${changed} pair(s) would change, ${skipped} skipped`);
    console.log("[retire] re-run with --apply to write");
  }
}

run()
  .catch((e) => {
    console.error("[retire] failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch {
      /* ignore */
    }
  });