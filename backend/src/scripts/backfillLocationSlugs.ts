import mongoose from "mongoose";
import connectDB from "../app/config/db";
import { LocationModel } from "../app/modules/Location/location.model";
import { normalizeSlug, normalizeSlugList } from "../app/utils/slug";

async function createUniqueSlug(base: string, excludeId?: string) {
  const root = normalizeSlug(base, "location");
  if (!root) return "";

  let attempt = root;
  let suffix = 2;

  while (true) {
    const query: Record<string, any> = { slug: attempt };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await LocationModel.exists(query);
    if (!exists) return attempt;
    attempt = `${root}-${suffix++}`;
  }
}

async function run() {
  await connectDB();

  const cursor = LocationModel.find({})
    .select("_id name slug slugAliases")
    .cursor();
  let scanned = 0;
  let updated = 0;
  let skipped = 0;

  for await (const location of cursor) {
    scanned += 1;
    const name = String((location as any).name || "").trim();
    const currentSlug = String((location as any).slug || "").trim();
    if (!name) {
      skipped += 1;
      continue;
    }

    const nextSlug = await createUniqueSlug(name, String((location as any)._id));
    if (!nextSlug) {
      skipped += 1;
      continue;
    }

    const aliases = normalizeSlugList([
      ...(Array.isArray((location as any).slugAliases)
        ? (location as any).slugAliases
        : []),
      currentSlug,
    ]).filter((item) => item !== nextSlug);

    if (nextSlug === currentSlug && aliases.length === ((location as any).slugAliases || []).length) {
      skipped += 1;
      continue;
    }

    await LocationModel.updateOne(
      { _id: (location as any)._id },
      { $set: { slug: nextSlug, slugAliases: aliases } },
    );
    updated += 1;
  }

  console.log(
    `[backfill-location-slugs] scanned=${scanned} updated=${updated} skipped=${skipped}`,
  );
}

run()
  .catch((error) => {
    console.error("[backfill-location-slugs] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch {
      // ignore close errors
    }
  });
