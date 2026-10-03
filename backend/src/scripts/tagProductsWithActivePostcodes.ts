import mongoose from "mongoose";
import connectDB from "../app/config/db";
import { LocationModel } from "../app/modules/Location/location.model";
import Product from "../app/modules/Product/product.model";

/**
 * Tag every active product with the postcode districts it is delivered to.
 *
 * Why this exists
 * ---------------
 * Locations are postcode districts now (CM17, RM9, E1 ...), and the catalogue
 * filter matches the selected district against `location.postcodes`,
 * `location.city` and `location.state`. Only 2 of 48 active products had a
 * populated `postcodes` array; the rest still carried free-text area names
 * ("Romford", "Rush Green") and regions ("London"). The filter deliberately
 * skips the regional fallback when the term looks like a postcode, so 27 of
 * the 29 districts returned an empty grid.
 *
 * A bouncy castle is delivered by van, not manufactured per-district, and this
 * business covers all of its districts, so every active product genuinely is
 * available in every active district. We therefore record that coverage
 * explicitly rather than leaving it to a region guess.
 *
 * What it changes per active product
 * ----------------------------------
 *   location.postcodes  -> every active district code   (the real coverage)
 *   location.city       -> ""   (dropped the stale area names)
 *   location.state      -> "England"
 *   location.country    -> "United Kingdom"
 *
 * Retired products (isActive:false) are left untouched.
 *
 * Usage:
 *   npx ts-node src/scripts/tagProductsWithActivePostcodes.ts            # dry run
 *   npx ts-node src/scripts/tagProductsWithActivePostcodes.ts --apply
 *
 * Idempotent: re-running reports 0 changed.
 */

const DRY = "DRY RUN";

function sameCodes(a: unknown, b: string[]): boolean {
  if (!Array.isArray(a)) return false;
  const list = a.map((c) => String(c).trim().toUpperCase()).sort();
  const want = [...b].sort();
  return list.length === want.length && list.every((v, i) => v === want[i]);
}

async function run() {
  const apply = process.argv.includes("--apply");
  await connectDB();

  const locations = (await LocationModel.find({ isActive: { $ne: false } })
    .select("name")
    .lean()) as any[];

  const codes = [
    ...new Set(
      locations
        .map((l) => String(l.name || "").trim())
        .filter((n) => /^[A-Z]{1,2}\d{1,2}[A-Z]?$/i.test(n))
        .map((n) => n.toUpperCase()),
    ),
  ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const skipped = locations.length - codes.length;

  console.log(`[tag-postcodes] mode=${apply ? "APPLY" : DRY}`);
  console.log(
    `[tag-postcodes] activeLocations=${locations.length} postcodeDistricts=${codes.length}` +
      (skipped ? ` nonPostcodeSkipped=${skipped}` : ""),
  );
  console.log(`[tag-postcodes] districts: ${codes.join(" ")}`);

  if (!codes.length) {
    console.log("[tag-postcodes] no active postcode districts found - aborting");
    return;
  }

  const products = (await Product.find({ isActive: { $ne: false } })
    .select("name location")
    .lean()) as any[];

  let changed = 0;
  let unchanged = 0;

  for (const p of products) {
    const before = (p.location || {}) as any;
    const alreadyTagged =
      sameCodes(before.postcodes, codes) &&
      !String(before.city || "").trim() &&
      before.state === "England" &&
      before.country === "United Kingdom";

    if (alreadyTagged) {
      unchanged++;
      continue;
    }

    const after = {
      country: "United Kingdom",
      state: "England",
      city: "",
      postcodes: codes,
    };

    changed++;
    console.log(
      `  ${apply ? "tag" : "would tag"}  ${String(p.name || p._id).slice(0, 46).padEnd(48)}` +
        ` city="${before.city || ""}" state="${before.state || ""}" country="${before.country || ""}"` +
        ` postcodes[${Array.isArray(before.postcodes) ? before.postcodes.length : 0}]` +
        ` -> postcodes[${codes.length}]`,
    );

    if (apply) {
      await Product.updateOne({ _id: p._id }, { $set: { location: after } });
    }
  }

  console.log(
    `\n[tag-postcodes] ${apply ? "tagged" : "would tag"}=${changed} alreadyCorrect=${unchanged} totalActiveProducts=${products.length}`,
  );
  if (!apply) console.log("[tag-postcodes] dry run - re-run with --apply");
}

run()
  .catch((e) => {
    console.error("[tag-postcodes] failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch {
      /* ignore */
    }
  });