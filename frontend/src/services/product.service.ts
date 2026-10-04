import api from "@/api/api";
import { AxiosRequestConfig } from "axios";

export interface ApiLocation {
  coordinates?: { lat: number; lng: number };
  name?: string;
  type?: string;
  country?: string;
  state?: string;
  city?: string;
  /** Postcode districts this product covers, e.g. ["RM9", "RM10"]. */
  postcodes?: string[];
  fullAddress?: string;
  description?: string | null;
  id?: string;
}

export interface ApiCategoryRef {
  id?: string;
  _id?: string;
  name?: string;
  description?: string;
}

export interface ApiDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
}

/** A selectable add-on offered when booking a product. */
export interface ApiExtraOption {
  key: string;
  label: string;
  price: number;
  pricingType: "total" | "per_day" | "per_quantity";
  max: number;
  enabled: boolean;
}

export interface ApiProduct {
  id: string;
  _id?: string;
  slug?: string;
  slugAliases?: string[];
  name: string;
  description?: string;
  summary?: string;
  metaTitle?: string;
  metaDescription?: string;
  imageAltText?: string;
  imageCoverAltText?: string;
  imageAltTexts?: string[];
  price: number;
  perDayPrice?: number | null;
  perWeekPrice?: number | null;
  rentalPrice?: number | null;
  priceDiscount?: number | null;
  discountPrice?: number | null;
  discount?: number | null;
  images?: string[];
  imageCover?: string;
  certificates?: string[];
  categories?: Array<string | ApiCategoryRef>;
  duration?: number | string;
  maxGroupSize?: number;
  difficulty?: string;
  size?: string;
  dimensions?: ApiDimensions;
  location?: ApiLocation;
  deliveryAndCollection?: string | null;
  deliveryTime?: string | null;
  collectionTime?: string | null;
  deliveryTimeOptions?: string[];
  collectionTimeOptions?: string[];
  defaultDeliveryTime?: string | null;
  defaultCollectionTime?: string | null;
  deliveryTimeFee?: number | null;
  collectionTimeFee?: number | null;
  extraOptions?: ApiExtraOption[];
  sensitiveDetails?: string | null;
  ageRange?:
  | string
  | {
    min?: number;
    max?: number;
    unit?: string;
  }
  | null;
  material?: string;
  design?: string;
  vendor?: string;
  sku?: string;
  warehouse?: string;
  stock?: number;
  quantity?: number;
  isActive?: boolean;
  active?: boolean;
  availableFrom?: string;
  availableUntil?: string;
  bookedDates?: Array<{
    date?: string;
    bookingId?: string;
    bookingNumber?: string;
    status?: string;
    quantity?: number;
  }>;
  availability?: {
    bookedCount?: number;
    totalStock?: number;
    availableStock?: number;
    isAvailable?: boolean;
  };
  ratingsAverage?: number;
  ratingsQuantity?: number;
  canonicalUrl?: string;
  customJsonLd?: string;
  updatedAt?: string;
}

export type FetchProductsParams = {
  page?: number;
  limit?: number;
  sort?: string;
  /** "asc" | "desc" — pairs with `sort` for the backend's sortBy/sortOrder. */
  sortOrder?: "asc" | "desc";
  /** Internal size band: xs | s | m | l | xl */
  sizeBand?: string | null;

  // backend filters
  categoryId?: string | null;
  locationId?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  difficulty?: string | null;
  showAll?: boolean | null;
  search?: string | null;
  availableFrom?: string | null;
  availableUntil?: string | null;
  availableOn?: string | null;
  city?: string;
  signal?: AbortSignal;
  includeCertificates?: boolean | null;
};

export type FetchProductsResponse = {
  items: ApiProduct[];
  total: number;
  results?: number;
  page: number;
  limit: number;
};

const hasStock = (product: Partial<ApiProduct> | null | undefined): boolean => {
  if (!product) return false;
  const stockValue =
    product.stock ??
    product.quantity ??
    product.availability?.availableStock ??
    0;
  const stock = Number(stockValue);
  return Number.isFinite(stock) && stock > 0;
};

export async function fetchTopPicks(): Promise<ApiProduct[]> {
  const { data } = await api.get("/products/top-picks");
  const payload = data?.data;
  if (Array.isArray(payload)) return (payload as ApiProduct[]).filter(hasStock);
  if (Array.isArray(payload?.topPicks))
    return (payload.topPicks as ApiProduct[]).filter(hasStock);
  return [];
}

export async function fetchTopSelling(): Promise<ApiProduct[]> {
  const { data } = await api.get("/products/top-selling?limit=5");
  const payload = data?.data;
  if (Array.isArray(payload?.products))
    return (payload.products as ApiProduct[]).filter(hasStock);
  if (Array.isArray(payload)) return (payload as ApiProduct[]).filter(hasStock);
  return [];
}

export async function fetchProduct(
  productId: string,
  signal?: AbortSignal,
): Promise<ApiProduct | null> {
  if (!productId) return null;

  const config: AxiosRequestConfig = { signal };

  try {
    const res = await api.get<{
      status: string;
      data: { product: ApiProduct };
    }>(`/products/${productId}`, config);

    return res.data?.data?.product ?? null;
  } catch {
    // Gracefully handle 404/Network errors and let caller decide how to render
    return null;
  }
}

export async function fetchProductBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<ApiProduct | null> {
  if (!slug) return null;

  if (typeof window === "undefined") {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
    if (!baseUrl) return null;
    try {
      const res = await fetch(`${baseUrl}/api/v1/products/slug/${slug}`, { signal });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.data?.product ?? null;
    } catch {
      return null;
    }
  }

  const config: AxiosRequestConfig = { signal };
  try {
    const res = await api.get<{
      status: string;
      data: { product: ApiProduct };
    }>(`/products/slug/${slug}`, config);
    return res.data?.data?.product ?? null;
  } catch {
    return null;
  }
}

// export async function fetchProducts({
//   page = 1,
//   limit = 12,
//   sort = "-createdAt",
//   categoryId = null,
//   locationId = null,
//   minPrice = null,
//   maxPrice = null,
//   difficulty = null,
//   search = null,
//   availableFrom = null,
//   availableUntil = null,
//   availableOn = null,
//   signal,
// }: FetchProductsParams): Promise<FetchProductsResponse> {
//   const params: Record<string, any> = {
//     page,
//     limit,
//     sortBy: sort,
//   };
//
//   if (categoryId) params.category = categoryId;
//   if (locationId) params.location = locationId;
//   if (minPrice != null) params.minPrice = minPrice;
//   if (maxPrice != null) params.maxPrice = maxPrice;
//   if (difficulty) params.difficulty = difficulty;
//   if (search) {
//     params.search = search;
//     params.name = search;
//   }
//   if (availableFrom) params.availableFrom = availableFrom;
//   if (availableUntil) params.availableUntil = availableUntil;
//   if (availableOn) params.availableOn = availableOn;
//
//   const cfg: AxiosRequestConfig = { params, signal };
//
//   const { data } = await api.get("/products", cfg);
//
//   const payload = data?.data;
//   const products: ApiProduct[] = payload?.products ?? [];
//   const pagination = payload?.pagination;
//   const totalFromPagination =
//     typeof pagination?.total === "number" ? pagination.total : null;
//   const total: number =
//     typeof totalFromPagination === "number"
//       ? totalFromPagination
//       : typeof data?.total === "number"
//         ? data.total
//         : typeof data?.results === "number"
//           ? data.results
//           : products.length;
//
//   return {
//     items: products,
//     total,
//     results: data?.results ?? total,
//     page,
//     limit,
//   };
// }

/*************Nahid */

export async function fetchProducts({
  page = 1,
  limit = 12,
  sort = "-createdAt",
  sortOrder,
  categoryId = null,
  locationId = null,
  minPrice = null,
  maxPrice = null,
  difficulty = null,
  showAll = false,
  search = null,
  availableFrom = null,
  availableUntil = null,
  availableOn = null,
  city,
  sizeBand = null,
  signal,
  includeCertificates = false,
}: FetchProductsParams): Promise<FetchProductsResponse> {
  const params: Record<string, any> = {
    page,
    limit,
    sortBy: sort,
  };

  // The backend treats sortBy and sortOrder as separate inputs; without this a
  // "-price" style value silently falls back to sorting by createdAt.
  if (sortOrder) params.sortOrder = sortOrder;

  if (categoryId) params.category = categoryId;
  if (locationId) params.location = locationId;
  if (minPrice != null) params.minPrice = minPrice;
  if (maxPrice != null) params.maxPrice = maxPrice;
  if (difficulty) params.difficulty = difficulty;
  if (showAll) {
    params.showAll = showAll;
  }
  if (search) {
    params.search = search;
    params.name = search;
  }
  if (availableFrom) params.startDate = availableFrom;
  if (availableUntil) params.endDate = availableUntil;
  if (availableOn) params.availableOn = availableOn;
  if (sizeBand) params.sizeBand = sizeBand;
  if (city) {
    // Single term: the backend matches it against the product's location.city
    // OR location.state. (Previously this also set `state`, which the backend
    // ANDed with `city`, so no product could ever satisfy both.)
    params.city = city;
  }

  // List payloads omit the large `certificates` field by default; only the
  // admin inventory needs it inline.
  if (includeCertificates) params.includeCertificates = true;

  const cfg: AxiosRequestConfig = { params, signal };

  const { data } = await api.get("/products", cfg);

  const payload = data?.data ?? data;
  const products: ApiProduct[] =
    payload?.products ?? payload?.items ?? payload ?? [];

  // Robustly extract pagination/meta data
  const pagination = data?.meta ?? payload?.meta ?? data?.pagination ?? payload?.pagination;
  const totalFromPagination = typeof pagination?.total === "number" ? pagination.total : null;

  const total: number =
    totalFromPagination !== null
      ? totalFromPagination
      : typeof data?.total === "number"
        ? data.total
        : typeof payload?.total === "number"
          ? payload.total
          : typeof data?.results === "number"
            ? data.results
            : products.length;

  return {
    items: products,
    total,
    results: data?.results ?? total,
    page,
    limit,
  };
}
/*************Nahid */
export interface FrequentlyBoughtItem {
  productId: string;
  productName: string;
  price: number;
  perDayPrice?: number;
  perWeekPrice?: number;
  imageCover?: string;
  images?: string[];
  discount?: number;
  discountPrice?: number;
}

export interface FrequentlyBoughtRelationship {
  productId: string;
  productName: string;
  productInfo: ApiProduct;
  frequentlyBought: FrequentlyBoughtItem[];
}

export interface FrequentlyBoughtResponse {
  status: string;
  message: string;
  data: {
    relationships: FrequentlyBoughtRelationship[];
    count: number;
    totalConnections: number;
  };
}

export async function fetchFrequentlyBoughtProducts(): Promise<
  FrequentlyBoughtRelationship[]
> {
  try {
    const { data } = await api.get<FrequentlyBoughtResponse>(
      "/products/frequently-bought/all",
    );
    const relationships = data?.data?.relationships ?? [];
    return relationships
      .map((rel) => ({
        ...rel,
        frequentlyBought: (rel.frequentlyBought ?? []).filter((item) =>
          hasStock({
            stock: (item as any)?.stock,
            quantity: (item as any)?.quantity,
            availability: (item as any)?.availability,
          }),
        ),
      }))
      .filter((rel) => hasStock(rel.productInfo) && rel.frequentlyBought.length > 0);
  } catch (error) {
    console.error("Failed to fetch frequently bought products:", error);
    return [];
  }
}

export async function createProduct(data: FormData): Promise<ApiProduct> {
  const res = await api.post("/products", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data?.product ?? res.data?.data?.product ?? res.data?.data;
}

export async function deleteProduct(productId: string): Promise<void> {
  await api.delete(`/products/${productId}`);
}

export async function updateProduct(productId: string, data: FormData): Promise<ApiProduct> {
  const res = await api.patch(`/products/${productId}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data?.product ?? res.data?.data?.product ?? res.data?.data;
}
