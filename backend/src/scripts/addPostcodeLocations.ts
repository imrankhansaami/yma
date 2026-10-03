import mongoose from "mongoose";
import connectDB from "../app/config/db";
import { LocationModel } from "../app/modules/Location/location.model";

/**
 * Add the RM/CM postcode districts as location records.
 *
 * `name` and the postcode field are both set to the district, so the admin
 * postcode picker shows the code. Regions are set for reference only - the
 * product filter skips the regional fallback for postcode-shaped names, so
 * selecting a postcode matches products tagged with that postcode exactly.
 *
 * Usage:
 *   npx ts-node src/scripts/addPostcodeLocations.ts            # dry run
 *   npx ts-node src/scripts/addPostcodeLocations.ts --apply
 */

// ROMFORD (RM) districts are Greater London up to RM14; RM15-RM20 fall in
// Thurrock/Brentwood, Essex. CM17-CM20 are Harlow, Essex. RM1-RM3 were
// abolished in the 2001 reorganisation and no longer exist.
const POSTCODES: { code: string; state: string }[] = [
  { code: "CM17", state: "Essex" },
  { code: "CM18", state: "Essex" },
  { code: "CM19", state: "Essex" },
  { code: "CM20", state: "Essex" },
  { code: "RM4", state: "Greater London" },
  { code: "RM5", state: "Greater London" },
  { code: "RM10", state: "Greater London" },
  { code: "RM11", state: "Greater London" },
  { code: "RM12", state: "Greater London" },
  { code: "RM13", state: "Greater London" },
  { code: "RM14", state: "Greater London" },
  { code: "RM15", state: "Essex" },
  { code: "RM16", state: "Essex" },
  { code: "RM17", state: "Essex" },
  { code: "RM18", state: "Essex" },
  { code: "RM19", state: "Essex" },
  { code: "RM20", state: "Essex" },
];

async function run() {
  const apply = process.argv.includes("--apply");
  await connectDB();

  console.log(`[add-postcodes] mode=${apply ? "APPLY" : "DRY RUN"} wanted=${POSTCODES.length}`);

  let added = 0;
  let existed = 0;

  for (const { code, state } of POSTCODES) {
    // Match on either the name or the postcode field, in any case.
    const exists = await LocationModel.findOne({
      $or: [
        { name: { $regex: `^${code}$`, $options: "i" } },
        { city: { $regex: `^${code}$`, $options: "i" } },
      ],
    }).lean();

    if (exists) {
      existed++;
      console.log(`  ok       ${code}  already present as "${(exists as any).name}"`);
      continue;
    }

    console.log(`  ${apply ? "adding" : "would add"}   ${code}  (state=${state})`);

    if (apply) {
      await LocationModel.create({
        name: code,
        city: code,
        state,
        country: "United Kingdom",
        type: "postcode",
        isActive: true,
        slugAliases: [],
        deliveryAreas: [],
      });
    }
    added++;
  }

  const total = await LocationModel.countDocuments();
  console.log(
    `\n[add-postcodes] ${apply ? "added" : "would add"}=${added} alreadyPresent=${existed} totalLocations=${total}`,
  );
  if (!apply) console.log("[add-postcodes] dry run - re-run with --apply");
}

run()
  .catch((e) => {
    console.error("[add-postcodes] failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch {
      /* ignore */
    }
  });
