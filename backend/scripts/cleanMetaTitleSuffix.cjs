/**
 * One-time cleanup for meta titles mutated by the old sanitizer.
 *
 * The previous `sanitizeSeoMetaTitle()` appended a fixed " | YMA" suffix to every
 * saved meta title (and stripped the brand from what was typed). Meta titles are
 * now authored verbatim, so exposing that legacy suffix would be wrong. This
 * removes ONLY a trailing " | YMA" (case-insensitive) and leaves everything else
 * untouched.
 *
 * Usage (run from the backend directory):
 *   node scripts/cleanMetaTitleSuffix.cjs            # dry-run, prints changes
 *   node scripts/cleanMetaTitleSuffix.cjs --apply    # writes the changes
 */
const path = require("path");
const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "";
const DB_NAME = process.env.MONGO_DB_NAME || "YMA";
const APPLY = process.argv.includes("--apply");

// A trailing brand segment the old sanitizer appended: " | YMA".
const TRAILING_SUFFIX = /(?:\s*\|\s*YMA\s*)$/i;

const TARGETS = [
  { collection: "products", fields: ["metaTitle"] },
  { collection: "blogs", fields: ["metaTitle", "seoTitle"] },
  {
    collection: "seosettings",
    fields: ["defaultMetaTitle", "defaultOpenGraphTitle"],
  },
];

function clean(value) {
  if (typeof value !== "string") return null;
  const next = value.replace(/\s+/g, " ").trim().replace(TRAILING_SUFFIX, "").trim();
  return next && next !== value ? next : null;
}

async function run() {
  if (!MONGO_URI) {
    console.error("MONGO_URI is not set");
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  console.log(`Connected to ${DB_NAME}${APPLY ? " (APPLY)" : " (dry-run)"}`);

  let total = 0;
  for (const { collection, fields } of TARGETS) {
    const coll = db.collection(collection);
    let count = 0;
    for (const field of fields) {
      const docs = await coll
        .find({ [field]: { $regex: /\|\s*YMA\s*$/i } })
        .toArray();
      for (const doc of docs) {
        const next = clean(doc[field]);
        if (next == null) continue;
        count++;
        if (count <= 5) {
          console.log(`  ${collection}.${field}: "${doc[field]}" -> "${next}"`);
        }
        if (APPLY) {
          await coll.updateOne({ _id: doc._id }, { $set: { [field]: next } });
        }
      }
    }
    console.log(`${collection}: ${count} value(s) ${APPLY ? "updated" : "to update"}`);
    total += count;
  }

  console.log(`Total: ${total}${APPLY ? "" : " (dry-run — pass --apply to write)"}`);
  await client.close();
}

run().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
