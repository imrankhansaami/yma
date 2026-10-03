import mongoose from "mongoose";
import connectDB from "../app/config/db";
import { LocationModel as Location } from "../app/modules/Location/location.model";
import { normalizeSlug, normalizeSlugList } from "../app/utils/slug";

/**
 * Reduce every location to its postcode district.
 *
 * The list grew into a mix of names and codes: some rows are already the
 * district ("RM9"), some keep the area in `name` with the district parked in
 * `city` ("Dagenham East" / RM6), and a few are area names with no district at
 * all ("Romford", "London").
 *
 * - Rows that have a district anywhere get `name` and `slug` set to it, with
 *   the old slug kept as an alias so existing links keep working.
 * - Rows with no district at all are deactivated (not deleted) - they can no
 *   longer be picked, but nothing is lost and it can be undone in one line.
 *
 * Usage:
 *   ts-node src/scripts/normalizeLocationNamesToPostcodes.ts            # dry run
 *   ts-node src/scripts/normalizeLocationNamesToPostcodes.ts --apply
 */

/** A UK postcode district, e.g. RM9, E10, IG10, CM17, N13. */
const isPostcodeDistrict = (value?: string | null) =>
  /^[A-Z]{1,2}\d{1,2}[A-Z]?$/i.test(String(value || "").trim());

const clean = (v: unknown) => String(v ?? "").trim();

async function run() {
  const apply = process.argv.includes("--apply");
  console.log(`[locations] mode=${apply ? "APPLY" : "DRY RUN"}\n`);

  await connectDB();

  const locations: any[] = await Location.find().lean();
  console.log(`locations: ${locations.length}\n`);

  const renames: { id: string; from: string; to: string }[] = [];
  const deactivates: { id: string; name: string }[] = [];
  const already: string[] = [];

  for (const l of locations) {
    // Look for the district in name, then city, then area / postcode.
    const candidates = [clean(l.name), clean(l.city), clean(l.area), clean(l.postcode)];
    const district = candidates.find((c) => isPostcodeDistrict(c));

    if (!district) {
      if (l.isActive === false) {
        already.push(`${l.name} (already inactive)`);
      } else {
        deactivates.push({ id: String(l._id), name: clean(l.name) });
      }
      continue;
    }

    if (clean(l.name).toUpperCase() === district.toUpperCase()) {
      already.push(`${l.name} (already a code)`);
      continue;
    }

    renames.push({ id: String(l._id), from: clean(l.name), to: district.toUpperCase() });
  }

  console.log(`=== rename to the postcode district (${renames.length}) ===`);
  for (const r of renames) console.log(`  "${r.from}"  ->  "${r.to}"`);

  console.log(`\n=== no district found - deactivate (${deactivates.length}) ===`);
  for (const d of deactivates) console.log(`  ${d.name}`);

  console.log(`\n=== already fine (${already.length}) ===`);
  already.forEach((a) => console.log(`  ${a}`));

  if (!apply) {
    console.log("\n[locations] dry run - re-run with --apply to write");
    return;
  }

  // ---- apply ----------------------------------------------------------------
  let renamed = 0;
  for (const r of renames) {
    const current: any = await Location.findById(r.id).select("slug slugAliases");
    if (!current) continue;

    const nextSlug = normalizeSlug(r.to);
    const aliases = normalizeSlugList([
      ...(Array.isArray(current.slugAliases) ? current.slugAliases : []),
      current.slug,
    ]).filter((s) => s && s !== nextSlug);

    await Location.updateOne(
      { _id: r.id },
      { $set: { name: r.to, slug: nextSlug, slugAliases: aliases } },
    );
    renamed++;
  }

  let hidden = 0;
  for (const d of deactivates) {
    await Location.updateOne({ _id: d.id }, { $set: { isActive: false } });
    hidden++;
  }

  console.log(`\n[locations] renamed ${renamed}, deactivated ${hidden}`);

  const remaining: any[] = await Location.find({ isActive: { $ne: false } })
    .select("name slug")
    .sort({ name: 1 })
    .lean();
  console.log(`active locations now (${remaining.length}): ${remaining.map((l) => l.name).join(", ")}`);
}

run()
  .catch((e) => {
    console.error("[locations] failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch {
      /* ignore */
    }
  });