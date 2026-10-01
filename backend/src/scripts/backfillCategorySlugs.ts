import mongoose from "mongoose";
import connectDB from "../app/config/db";
import Category from "../app/modules/Category/category.model";
import { normalizeSlug, normalizeSlugList } from "../app/utils/slug";

async function createUniqueSlug(base: string, excludeId?: string) {
  const root = normalizeSlug(base, "category");
  if (!root) return "";

  let attempt = root;
  let suffix = 2;

  while (true) {
    const query: Record<string, any> = { slug: attempt };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await Category.exists(query);
    if (!exists) return attempt;
    attempt = `${root}-${suffix++}`;
  }
}

async function run() {
  await connectDB();

  const cursor = Category.find({}).select("_id name slug slugAliases").cursor();
  let scanned = 0;
  let updated = 0;
  let skipped = 0;

  for await (const category of cursor) {
    scanned += 1;
    const name = String((category as any).name || "").trim();
    const currentSlug = String((category as any).slug || "").trim();
    if (!name) {
      skipped += 1;
      continue;
    }

    const nextSlug = await createUniqueSlug(name, String((category as any)._id));
    if (!nextSlug) {
      skipped += 1;
      continue;
    }

    const aliases = normalizeSlugList([
      ...(Array.isArray((category as any).slugAliases)
        ? (category as any).slugAliases
        : []),
      currentSlug,
    ]).filter((item) => item !== nextSlug);

    if (nextSlug === currentSlug && aliases.length === ((category as any).slugAliases || []).length) {
      skipped += 1;
      continue;
    }

    await Category.updateOne(
      { _id: (category as any)._id },
      { $set: { slug: nextSlug, slugAliases: aliases } },
    );
    updated += 1;
  }

  console.log(
    `[backfill-category-slugs] scanned=${scanned} updated=${updated} skipped=${skipped}`,
  );
}

run()
  .catch((error) => {
    console.error("[backfill-category-slugs] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch {
      // ignore close errors
    }
  });
