import Category, { ICategoryModel } from "./category.model";
import ApiError from "../../utils/apiError";
import { CreateCategoryData, UpdateCategoryData } from "./category.interface";
import { normalizeSlug, normalizeSlugList } from "../../utils/slug";

const toSlug = (value: string) =>
  normalizeSlug(value, "category");

const buildUniqueSlug = async (name: string, excludeId?: string) => {
  const base = toSlug(name) || "category";
  let candidate = base;
  let suffix = 2;

  while (true) {
    const exists = await Category.findOne({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).lean();

    if (!exists) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
};

/**
 * Create category (raw OR hardcoded)
 * Name must be unique (case-insensitive)
 */
export const createCategory = async (
  data: CreateCategoryData,
): Promise<ICategoryModel> => {
  const exists = await Category.findOne({
    name: { $regex: new RegExp(`^${data.name}$`, "i") },
  });

  if (exists) {
    throw new ApiError(`Category with name "${data.name}" already exists`, 400);
  }

  const slug = await buildUniqueSlug(data.name);
  const slugAliases = normalizeSlugList(data.slugAliases || []).filter(
    (item) => item !== slug,
  );
  return await Category.create({ ...data, slug, slugAliases });
};

/**
 * Get all active categories
 */
export const getAllCategories = async (): Promise<ICategoryModel[]> => {
  return Category.find({ isActive: true }).sort({ name: 1 });
};

/**
 * Get category by ID
 */
export const getCategoryById = async (id: string): Promise<ICategoryModel> => {
  const category = await Category.findById(id);

  if (!category) {
    throw new ApiError("Category not found", 404);
  }

  return category;
};

/**
 * Update category
 */
export const updateCategory = async (
  id: string,
  updateData: UpdateCategoryData,
): Promise<ICategoryModel> => {
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError("Category not found", 404);
  }

  if (updateData.name) {
    const exists = await Category.findOne({
      name: { $regex: new RegExp(`^${updateData.name}$`, "i") },
      _id: { $ne: id },
    });

    if (exists) {
      throw new ApiError(
        `Category with name "${updateData.name}" already exists`,
        400,
      );
    }

    const normalizedName = updateData.name.trim();
    if (normalizedName && normalizedName !== category.name) {
      const previousSlug = String(category.slug || "").trim();
      category.slug = await buildUniqueSlug(normalizedName, id);
      category.slugAliases = normalizeSlugList([
        ...(category.slugAliases || []),
        previousSlug,
      ]).filter((item) => item !== category.slug);
    }
    category.name = normalizedName;
  }

  if (typeof updateData.slug === "string") {
    const normalized = normalizeSlug(updateData.slug);
    if (!normalized) {
      throw new ApiError("Invalid slug format", 400);
    }
    const previousSlug = String(category.slug || "").trim();
    category.slug = await buildUniqueSlug(normalized, id);
    category.slugAliases = normalizeSlugList([
      ...(category.slugAliases || []),
      previousSlug,
    ]).filter((item) => item !== category.slug);
  }

  if (updateData.description !== undefined) {
    category.description = updateData.description;
  }

  if (updateData.image !== undefined) {
    category.image = updateData.image;
  }

  if (updateData.isActive !== undefined) {
    category.isActive = Boolean(updateData.isActive);
  }

  await category.save();
  return category;
};

/**
 * Delete category
 */
export const deleteCategory = async (id: string): Promise<void> => {
  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    throw new ApiError("Category not found", 404);
  }
};

/**
 * Seed hardcoded categories (SAFE – no duplicates)
 */
export const seedCategories = async (): Promise<ICategoryModel[]> => {
  const hardcoded = [
    { name: "Garden Games", description: "Outdoor games", isActive: true },
    { name: "Soft Play", description: "Soft play equipment", isActive: true },
    {
      name: "Bouncy Castle",
      description: "Inflatable castles",
      isActive: true,
    },
    { name: "Fun Food", description: "Food & catering", isActive: true },
    { name: "Tower Castle", description: "Large castles", isActive: true },
  ];

  const results: ICategoryModel[] = [];

  for (const item of hardcoded) {
    let category = await Category.findOne({
      name: { $regex: new RegExp(`^${item.name}$`, "i") },
    });

    if (!category) {
      category = await Category.create(item);
    }

    results.push(category);
  }

  return results;
};

/**
 * Get only hardcoded categories
 */
export const getHardcodedCategories = async (): Promise<ICategoryModel[]> => {
  return Category.find({
    name: {
      $in: [
        "Garden Games",
        "Soft Play",
        "Bouncy Castle",
        "Fun Food",
        "Tower Castle",
      ],
    },
  }).sort({ name: 1 });
};
