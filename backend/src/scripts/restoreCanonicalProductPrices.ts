import mongoose from "mongoose";
import connectDB from "../app/config/db";
import Product from "../app/modules/Product/product.model";

/**
 * Put a product's price back to the value its canonical 2026-03-07 copy holds.
 *
 * During the de-duplication the surviving row took the higher of the two
 * prices where the copies disagreed, which left Party Bouncer (Adult) at the
 * retired row's £150. Every other field on the survivors already comes from
 * the 2026-03-07 copy; this aligns the one exception.
 *
 * Usage:
 *   ts-node src/scripts/restoreCanonicalProductPrices.ts            # dry run
 *   ts-node src/scripts/restoreCanonicalProductPrices.ts --apply
 */

const ALIGNMENTS: { slug: string; price: number; note: string }[] = [
  {
    slug: "party-bouncer-adult",
    price: 130,
    note: "price stated by the 2026-03-07 copy and its own description",
  },
];

async function run() {
  const apply = process.argv.includes("--apply");
  console.log(`[price] mode=${apply ? "APPLY" : "DRY RUN"}\n`);

  await connectDB();

  let changed = 0;
  for (const { slug, price, note } of ALIGNMENTS) {
    const product: any = await Product.findOne({ slug }).select("name slug price").lean();
    if (!product) {
      console.log(`  SKIP  ${slug} - not found`);
      continue;
    }
    if (Number(product.price) === price) {
      console.log(`  SKIP  ${product.name} - already £${price}`);
      continue;
    }

    console.log(`  ${product.name}`);
    console.log(`     price ${Number(product.price)} -> ${price}   (${note})`);

    if (apply) {
      await Product.updateOne({ _id: product._id }, { $set: { price } });
      const check: any = await Product.findOne({ _id: product._id }).select("price").lean();
      console.log(`     applied - now £${check.price}`);
    }
    changed++;
  }

  console.log(`\n[price] ${apply ? "updated" : "would update"}: ${changed} product(s)`);
  if (!apply && changed) console.log("[price] dry run - re-run with --apply to write");
}

run()
  .catch((e) => {
    console.error("[price] failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch {
      /* ignore */
    }
  });