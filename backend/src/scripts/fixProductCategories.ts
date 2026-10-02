import mongoose from "mongoose";
import connectDB from "../app/config/db";
import Product from "../app/modules/Product/product.model";
import Category from "../app/modules/Category/category.model";

/**
 * Move products that are clearly bouncy castles out of the category they were
 * filed under by mistake.
 *
 * An audit of the live catalogue found ten products named "Bouncy Castle" /
 * "Bouncer" / "Dome" sitting in Soft Play, Garden Games, Fun Food or Obstacle
 * Course/Slides. That understated the Bouncy Castle category (25 instead of 35)
 * and showed items under categories they do not belong to.
 *
 * Usage:
 *   npx ts-node src/scripts/fixProductCategories.ts            # dry run
 *   npx ts-node src/scripts/fixProductCategories.ts --apply    # write changes
 *
 * Idempotent: products already in the target category are skipped.
 */

const TARGET_CATEGORY_NAME = "Bouncy Castle";

const PRODUCT_SLUGS = [
  "medieval-castle-bouncer-15ft-x-15ft",
  "football-stadium-bouncy-castle",
  "pirate-ship-bouncy-castle",
  "superhero-bouncy-castle-12ft-x-15ft",
  "monster-truck-bouncy-castle",
  "party-bouncer-adult-15ft-x-15ft",
  "party-bouncer-small-8ft-x-10ft",
  "party-themed-bouncy-castle-red-and-blue-15ft-x-12ft",
  "disco-dome",
  "3d-dino-bounce-and-slide-12ft-x-15ft",
];

async function run() {
  const apply = process.argv.includes("--apply");
  await connectDB();

  const target = await Category.findOne({ name: TARGET_CATEGORY_NAME })
    .select("_id name")
    .lean();

  if (!target) {
    console.error(`[fix-categories] category "${TARGET_CATEGORY_NAME}" not found`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `[fix-categories] mode=${apply ? "APPLY" : "DRY RUN"} target="${target.name}" (${target._id})`,
  );

  const allCategories = await Category.find().select("_id name").lean();
  const nameById = new Map(allCategories.map((c) => [String(c._id), c.name]));

  let changed = 0;
  let skipped = 0;
  let missing = 0;

  for (const slug of PRODUCT_SLUGS) {
    const product = await Product.findOne({ slug }).select("name slug categories").lean();

    if (!product) {
      missing++;
      console.log(`  MISSING  ${slug}`);
      continue;
    }

    const currentIds = (product.categories || []).map((c: any) => String(c));
    const currentNames = currentIds.map((id) => nameById.get(id) ?? id);

    if (currentIds.length === 1 && currentIds[0] === String(target._id)) {
      skipped++;
      console.log(`  ok       ${slug}  already "${TARGET_CATEGORY_NAME}"`);
      continue;
    }

    console.log(
      `  change   ${slug}\n             "${product.name}"\n             ${currentNames.join(", ") || "<none>"}  ->  ${TARGET_CATEGORY_NAME}`,
    );

    if (apply) {
      await Product.updateOne(
        { _id: product._id },
        { $set: { categories: [target._id] } },
      );
    }
    changed++;
  }

  console.log(
    `\n[fix-categories] ${apply ? "applied" : "would change"}=${changed} skipped=${skipped} missing=${missing}`,
  );
  if (!apply) {
    console.log("[fix-categories] dry run - re-run with --apply to write changes");
  }
}

run()
  .catch((error) => {
    console.error("[fix-categories] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch {
      // ignore close errors
    }
  });
