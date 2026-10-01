// import api from "@/api/api";
//
// export type Category = {
//   id: string | number;
//   name: string;
//   createdAt?: string;
//   description?: string;
//   isActive?: boolean;
//   slug?: string;
//   image?: string;
// };
//
// export async function fetchCategories(): Promise<Category[]> {
//   const res = await api.get("/categories");
//   const payload = res?.data?.data;
//   let arr: any[] = [];
//   if (Array.isArray(payload)) arr = payload;
//   else if (Array.isArray(payload?.categories)) arr = payload.categories;
//
//   return arr.map((c: any, idx: number) =>
//     typeof c === "string"
//       ? { id: idx, name: c }
//       : {
//           id: c.id ?? c._id ?? idx,
//           name: c.name ?? c.title ?? String(c),
//           createdAt: c.createdAt ?? c.updatedAt,
//           description: c.description,
//           isActive: c.isActive,
//           slug: c.slug,
//           image: c.image,
//         }
//   );
// }
//
// export async function createCategory(name: string): Promise<Category> {
//   const res = await api.post("/categories", { name });
//   const payload = res?.data?.data ?? res?.data;
//   const category = payload?.category ?? payload;
//
//   return {
//     id: category?.id ?? category?._id ?? name,
//     name: category?.name ?? name,
//     createdAt: category?.createdAt ?? category?.updatedAt,
//     description: category?.description,
//     isActive: category?.isActive,
//     slug: category?.slug,
//     image: category?.image,
//   };
// }
//
// export async function deleteCategory(categoryId: string): Promise<void> {
//   await api.delete(`/categories/${categoryId}`);
// }

/***************Nahid */
import api from "@/api/api";

export type Category = {
  _id: string; // Changed to match your DB raw data
  id: string; // UI-friendly alias for _id
  name: string;
  createdAt?: string;
  description?: string;
  isActive?: boolean;
  slug?: string;
  image?: string;
};

export async function fetchCategories(): Promise<Category[]> {
  const res = await api.get("/categories");
  // Logic to handle different backend wrapper styles
  const payload = res?.data?.data;
  let arr: any[] = [];

  if (Array.isArray(payload)) {
    arr = payload;
  } else if (Array.isArray(payload?.categories)) {
    arr = payload.categories;
  }

  return arr.map((c: any, idx: number) => {
    // If backend sends a simple string array
    if (typeof c === "string") {
      const id = String(idx);
      return { _id: id, id, name: c };
    }

    // Ensure we capture the real MongoDB _id to send back to the backend later
    const id = String(c._id || c.id || idx);
    return {
      _id: id,
      id,
      name: c.name ?? c.title ?? "Unnamed Category",
      createdAt: c.createdAt ?? c.updatedAt,
      description: c.description,
      isActive: c.isActive,
      slug: c.slug,
      image: c.image,
    };
  });
}

export async function createCategory(name: string): Promise<Category> {
  const res = await api.post("/categories", { name });
  const payload = res?.data?.data ?? res?.data;
  const category = payload?.category ?? payload;

  return {
    _id: String(category?._id ?? category?.id ?? ""),
    id: String(category?._id ?? category?.id ?? ""),
    name: category?.name ?? name,
    createdAt: category?.createdAt ?? category?.updatedAt,
    description: category?.description,
    isActive: category?.isActive,
    slug: category?.slug,
    image: category?.image,
  };
}

export async function deleteCategory(categoryId: string): Promise<void> {
  // Use the ObjectId passed from the UI
  await api.delete(`/categories/${categoryId}`);
}

export async function updateCategory(
  categoryId: string,
  payload: { name: string; description?: string; isActive?: boolean },
): Promise<Category> {
  const res = await api.patch(`/categories/${categoryId}`, payload);
  const data = res?.data?.data?.category ?? res?.data?.data ?? res?.data;
  const id = String(data?._id ?? data?.id ?? categoryId);

  return {
    _id: id,
    id,
    name: data?.name ?? payload.name,
    createdAt: data?.createdAt ?? data?.updatedAt,
    description: data?.description,
    isActive: data?.isActive,
    slug: data?.slug,
    image: data?.image,
  };
}
/***************Nahid */
