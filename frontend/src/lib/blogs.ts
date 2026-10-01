import type { ApiBlog } from "@/services/blog.service";

export type BlogStatusLabel = "Published" | "Draft";

export const getBlogStatusLabel = (blog: ApiBlog): BlogStatusLabel => {
  if (typeof blog.isPublished === "boolean") {
    return blog.isPublished ? "Published" : "Draft";
  }

  const normalized = (blog.status ?? "").toLowerCase();
  return normalized === "published" ? "Published" : "Draft";
};

export const getBlogIdLabel = (blog: ApiBlog): string => {
  return blog._id ?? blog.id ?? blog.slug ?? "";
};

export const getBlogHeroImage = (blog: ApiBlog): string | undefined => {
  if (Array.isArray(blog.images) && blog.images.length > 0) {
    return blog.images[0] ?? undefined;
  }
  return undefined;
};

export const formatBlogDate = (iso?: string): string => {
  if (!iso) return "-";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
