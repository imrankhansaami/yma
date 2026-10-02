import mongoose from "mongoose";
import connectDB from "../app/config/db";
import Product from "../app/modules/Product/product.model";
import {
  bandForFootprint,
  footprintFor,
  formatSize,
} from "../app/utils/productSize";

/**
 * Give every product a consistent internal size.
 *
 * `size` was previously free text and ended up contradictory - the same 15x12
 * castle was labelled "Medium" on one product and "Large" on another, 31 of 59
 * products had no size at all, and a 5x5 garden games package was "Medium".
 * The storefront needs a reliable number to alternate large/small products and
 * to power the Size filter.
 *
 * This rewrites `size` in the admin's L/W/H format derived from the structured
 * `dimensions` (which are complete for every product) and stores the numeric
 * `sizeFootprint` used by queries.
 *
 * Usage:
 *   npx ts-node src/scripts/backfillProductSizes.ts            # dry run
 *   npx ts-node src/scripts/backfillProductSizes.ts --apply    # write changes
 */

async function run() {
  const apply = process.argv.includes("--apply");
  await connectDB();

  const products = await Product.find()
    .select("name slug size dimensions sizeFootprint")
    .lean();

  console.log(`[backfill-sizes] mode=${apply ? "APPLY" : "DRY RUN"} products=${products.length}\n`);

  let changed = 0;
  let alreadyOk = 0;
  let noDimensions = 0;

  for (const product of products) {
    const formatted = formatSize(
      product?.dimensions?.length,
      product?.dimensions?.width,
      product?.dimensions?.height,
    );

    if (!formatted) {
      noDimensions++;
      console.log(`  SKIP     ${product.slug}  (no usable dimensions)`);
      continue;
    }

    const currentSize = String(product.size || "").trim();
    const footprint = footprintFor(product);
    const band = bandForFootprint(footprint);
    const footprintChanged = Number(product.sizeFootprint) !== footprint;

    if (currentSize === formatted && !footprintChanged) {
      alreadyOk++;
      continue;
    }

    console.log(
      `  change   ${product.slug}\n             size: "${currentSize || "<empty>"}"  ->  "${formatted}"\n             footprint=${footprint} band=${band ?? "-"}`,
    );

    if (apply) {
      await Product.updateOne(
        { _id: product._id },
        { $set: { size: formatted, sizeFootprint: footprint } },
      );
    }
    changed++;
  }

  console.log(
    `\n[backfill-sizes] ${apply ? "applied" : "would change"}=${changed} alreadyOk=${alreadyOk} skipped=${noDimensions}`,
  );
  if (!apply) {
    console.log("[backfill-sizes] dry run - re-run with --apply to write changes");
  }
}

run()
  .catch((error) => {
    console.error("[backfill-sizes] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch {
      // ignore close errors
    }
  });
