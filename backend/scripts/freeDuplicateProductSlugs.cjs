/**
 * Free the clean slugs held by legacy duplicate products.
 *
 * Five product names exist twice: an older, INACTIVE record owns the clean slug
 * (e.g. "disco-dome") while the live record carries a "-2" suffix, so those
 * pages render at "...-2". This renames the inactive duplicates to
 * "<slug>-old" (nothing is deleted) so the active products can take the clean
 * slug, and keeps every previously-working URL alive through slugAliases.
 *
 * Usage (run from the backend directory):
 *   node scripts/freeDuplicateProductSlugs.cjs            # dry-run, prints plan
 *   node scripts/freeDuplicateProductSlugs.cjs --apply    # writes the changes
 */
const path = require("path");
const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "";
const DB_NAME = process.env.MONGO_DB_NAME || "YMA";
const APPLY = process.argv.includes("--apply");

function normalizeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function run() {
  if (!MONGO_URI) {
    console.error("MONGO_URI is not set");
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const coll = db.collection("products");

  const products = await coll.find({}).toArray();
  const usedSlugs = new Set(products.map((p) => p.slug).filter(Boolean));

  const groups = new Map();
  for (const p of products) {
    const key = String(p.name || "").trim().toLowerCase();
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }

  const plans = [];
  for (const [, group] of groups) {
    if (group.length < 2) continue;
    const base = normalizeSlug(group[0].name);
    if (!base) continue;

    // Primary = the active record (newest first); the rest are duplicates.
    const sorted = [...group].sort((a, b) => {
      const diff = (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0);
      if (diff !== 0) return diff;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    const primary = sorted[0];
    const duplicates = sorted.slice(1);

    // 1. Move duplicates off the clean slug first (frees "base").
    let stamp = 1;
    for (const dup of duplicates) {
      let target = `${base}-old`;
      while (usedSlugs.has(target)) target = `${base}-old-${++stamp}`;
      usedSlugs.delete(dup.slug);
      usedSlugs.add(target);
      const aliases = Array.from(
        new Set([
          ...(Array.isArray(dup.slugAliases) ? dup.slugAliases : []),
          dup.slug,
        ].map(normalizeSlug).filter(Boolean)),
      ).filter((s) => s !== target && s !== base);
      plans.push({ id: dup._id, name: dup.name, from: dup.slug, to: target, aliases });
    }

    // 2. Let the active record take the clean slug.
    const oldSlug = primary.slug;
    if (oldSlug !== base) {
      usedSlugs.delete(oldSlug);
      usedSlugs.add(base);
      const aliases = Array.from(
        new Set([
          ...(Array.isArray(primary.slugAliases) ? primary.slugAliases : []),
          oldSlug,
        ].map(normalizeSlug).filter(Boolean)),
      ).filter((s) => s !== base);
      plans.push({
        id: primary._id,
        name: primary.name,
        from: oldSlug,
        to: base,
        aliases,
        primary: true,
      });
    }
  }

  if (!plans.length) {
    console.log("Nothing to do — no duplicate names holding a clean slug.");
    await client.close();
    return;
  }

  for (const p of plans) {
    console.log(`${APPLY ? "[apply]  " : "[dry-run]"} ${p.name}${p.primary ? "  (primary)" : ""}`);
    console.log(`    ${p.from}  ->  ${p.to}   aliases=[${p.aliases.join(", ")}]`);
    if (APPLY) {
      await coll.updateOne(
        { _id: p.id },
        { $set: { slug: p.to, slugAliases: p.aliases } },
      );
    }
  }
  console.log(
    `\nTotal: ${plans.length} change(s)${APPLY ? "" : " (dry-run — pass --apply to write)"}`,
  );
  await client.close();
}

run().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
