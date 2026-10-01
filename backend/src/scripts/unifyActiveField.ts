/**
 * One-time migration script to sync the `active` field to `isActive`.
 * The codebase previously had two separate boolean fields that were never synced.
 * Going forward, only `isActive` is used.
 *
 * Run: npx ts-node src/scripts/unifyActiveField.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI || "";

async function migrate() {
  if (!MONGO_URI) {
    console.error("MONGO_URI is not set");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, { dbName: "YMA" });
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  if (!db) {
    console.error("Database connection not established");
    process.exit(1);
  }

  const collection = db.collection("products");

  // Find products where active and isActive differ
  const mismatchedProducts = await collection
    .find({
      $expr: { $ne: ["$active", "$isActive"] },
    })
    .toArray();

  console.log(`Found ${mismatchedProducts.length} products with mismatched active/isActive fields`);

  if (mismatchedProducts.length > 0) {
    // Set isActive = active for all mismatched products (active was the original field)
    for (const product of mismatchedProducts) {
      await collection.updateOne(
        { _id: product._id },
        { $set: { isActive: product.active ?? true } }
      );
      console.log(`Updated product "${product.name}" (${product._id}): isActive = ${product.active ?? true}`);
    }
  }

  // Also handle products that might not have isActive field at all
  const missingIsActive = await collection.updateMany(
    { isActive: { $exists: false } },
    [{ $set: { isActive: { $ifNull: ["$active", true] } } }]
  );
  console.log(`Set isActive for ${missingIsActive.modifiedCount} products missing the field`);

  console.log("Migration complete");
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
