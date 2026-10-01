import api from "@/api/api";
import { AxiosRequestConfig } from "axios";

export type ApiBlogAuthor = {
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string | null;
};

export type ApiBlog = {
  _id?: string;
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  images?: string[];
  author?: ApiBlogAuthor | null;
  authorName?: string | null;
  authorImage?: string | null;
  category?: string | null;
  tags?: string[];
  status?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  metaTitle?: string;
  metaDescription?: string;
  imageAltText?: string;
  canonicalUrl?: string;
  customJsonLd?: string;
  views?: number;
  readTime?: number;
  createdAt?: string;
  updatedAt?: string;
  slug?: string;
  slugAliases?: string[];
  publishedAt?: string;
};

export type FetchBlogsParams = {
  page?: number;
  limit?: number;
  status?: string | null;
  search?: string | null;
  name?: string | null;
  isPublished?: boolean | null;
  isFeatured?: boolean | null;
  publishedOnly?: boolean | null;
  signal?: AbortSignal;
};

export type FetchBlogsResponse = {
  items: ApiBlog[];
  total: number;
  pages: number;
  page: number;
  limit: number;
};

export type CreateBlogInput = FormData;

export async function createBlog(payload: CreateBlogInput): Promise<ApiBlog> {
  const { data } = await api.post("/blogs", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data?.blog ?? data?.data ?? data;
}

export async function deleteBlog(id: string): Promise<void> {
  if (!id) return;
  await api.delete(`/blogs/${id}`);
}

export async function updateBlog(
  id: string,
  payload: FormData
): Promise<ApiBlog> {
  const { data } = await api.patch(`/blogs/${id}`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data?.blog ?? data?.data ?? data;
}

export async function fetchBlogBySlug(
  slug: string,
  signal?: AbortSignal
): Promise<ApiBlog | null> {
  if (!slug) return null;

  if (typeof window === "undefined") {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
    if (!baseUrl) return null;
    try {
      const res = await fetch(`${baseUrl}/api/v1/blogs/slug/${slug}`, { signal });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.data?.blog ?? null;
    } catch {
      return null;
    }
  }

  const config: AxiosRequestConfig = { signal };
  const { data } = await api.get(`/blogs/slug/${slug}`, config);
  return data?.data?.blog ?? null;
}

export async function fetchBlogById(
  id: string,
  signal?: AbortSignal
): Promise<ApiBlog | null> {
  if (!id) return null;

  // Metadata/layout runs on the server where relative axios base URLs can fail.
  if (typeof window === "undefined") {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
    if (!baseUrl) return null;
    try {
      const res = await fetch(`${baseUrl}/api/v1/blogs/${id}`, { signal });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.data?.blog ?? null;
    } catch {
      return null;
    }
  }

  const config: AxiosRequestConfig = { signal };
  const { data } = await api.get(`/blogs/${id}`, config);
  return data?.data?.blog ?? null;
}

export async function fetchBlogs({
  page = 1,
  limit = 12,
  status = null,
  search = null,
  name = null,
  isPublished = null,
  isFeatured = null,
  publishedOnly = null,
  signal,
}: FetchBlogsParams = {}): Promise<FetchBlogsResponse> {
  const params: Record<string, any> = { page, limit };
  if (status) params.status = status;
  const resolvedName = name ?? search;
  if (resolvedName) params.name = resolvedName;
  if (typeof isPublished === "boolean") params.isPublished = isPublished;
  if (typeof isFeatured === "boolean") params.isFeatured = isFeatured;
  if (typeof publishedOnly === "boolean") {
    params.publishedOnly = publishedOnly;
  }

  const config: AxiosRequestConfig = {
    params,
    signal,
  };

  const { data } = await api.get("/blogs", config);
  const payload = data?.data ?? {};
  const blogs: ApiBlog[] = Array.isArray(payload.blogs) ? payload.blogs : [];
  const pagination = payload.pagination ?? {};

  const total = typeof pagination.total === "number" ? pagination.total : 0;
  const pages = typeof pagination.pages === "number" ? pagination.pages : 1;
  const currentPage =
    typeof pagination.page === "number" ? pagination.page : page;
  const pageLimit =
    typeof pagination.limit === "number" ? pagination.limit : limit;

  return {
    items: blogs,
    total,
    pages,
    page: currentPage,
    limit: pageLimit,
  };
}
