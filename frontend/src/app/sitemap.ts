import { MetadataRoute } from "next";
import { CATEGORY_PAGES } from "@/lib/category-pages";
import { SITE_URL } from "@/lib/site-url";

const BASE_URL = SITE_URL;

// async function getProducts(): Promise<{ id: string; updatedAt?: string }[]> {
//   try {
//     const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
//     if (!baseUrl) return [];
//
//     const res = await fetch(`${baseUrl}/api/v1/products?limit=1000`, {
//       next: { revalidate: 3600 },
//     });
//
//     if (!res.ok) return [];
//
//     const data = await res.json();
//     const products = data?.data?.products ?? [];
//     return products.map((p: { id?: string; _id?: string; updatedAt?: string }) => ({
//       id: p.id || p._id,
//       updatedAt: p.updatedAt,
//     }));
//   } catch {
//     return [];
//   }
// }
/***********Nahuid */
async function getProducts(): Promise<{ slug: string; updatedAt?: string }[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
    if (!baseUrl) {
      console.warn("NEXT_PUBLIC_SERVER_URI is not defined");
      return [];
    }

    // Using your specific API endpoint structure
    const res = await fetch(`${baseUrl}/api/v1/products?limit=1000`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const result = await res.json();

    // The API returns `data` as a plain array; older responses nested it under
    // `data.products`. Accept both shapes.
    const payload = result?.data;
    const products = Array.isArray(payload)
      ? payload
      : (payload?.products ?? []);

    return products
      .map((p: any) => ({
        slug: String(p?.slug || "").trim(),
        updatedAt: p.updatedAt,
      }))
      .filter((p: any) => Boolean(p.slug));
  } catch (error) {
    console.error("Error fetching products for sitemap/metadata:", error);
    return [];
  }
}

async function getBlogs(): Promise<{ slug: string; updatedAt?: string }[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
    if (!baseUrl) return [];

    const res = await fetch(
      `${baseUrl}/api/v1/blogs?page=1&limit=1000&status=published&publishedOnly=true`,
      {
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return [];

    const result = await res.json();
    const blogs = result?.data?.blogs ?? [];
    return blogs
      .map((b: any) => ({
        slug: String(b?.slug || "").trim(),
        updatedAt: b?.updatedAt || b?.publishedAt,
      }))
      .filter((b: any) => Boolean(b.slug));
  } catch {
    return [];
  }
}

async function getLocations(): Promise<{ slug: string }[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
    if (!baseUrl) return [];

    const res = await fetch(`${baseUrl}/api/v1/locations?limit=1000`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const result = await res.json();
    const payload = result?.data;
    const locations = Array.isArray(payload)
      ? payload
      : (payload?.locations ?? []);
    return locations
      .map((loc: any) => ({
        slug: String(loc?.slug || "").trim(),
      }))
      .filter((loc: any) => Boolean(loc.slug));
  } catch {
    return [];
  }
}
/***********Nahuid */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, blogs, locations] = await Promise.all([
    getProducts(),
    getBlogs(),
    getLocations(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/booking-catalog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/locations`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/faqs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/product/${product.slug}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: `${BASE_URL}/blog/${blog.slug}`,
    lastModified: blog.updatedAt ? new Date(blog.updatedAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  const locationPages: MetadataRoute.Sitemap = locations.map((location) => ({
    url: `${BASE_URL}/locations/${location.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }));

  const categoryPages: MetadataRoute.Sitemap = CATEGORY_PAGES.map((category) => ({
    url: `${BASE_URL}/booking-catalog/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.82,
  }));

  return [
    ...staticPages,
    ...categoryPages,
    ...productPages,
    ...blogPages,
    ...locationPages,
  ];
}
