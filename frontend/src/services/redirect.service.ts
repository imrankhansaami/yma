import api from "@/api/api";

export interface Redirect {
  _id: string;
  fromPath: string;
  toPath: string;
  statusCode: 301 | 302;
  isActive: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getAllRedirects(): Promise<Redirect[]> {
  const { data } = await api.get("/redirects");
  // API returns { data: { redirects: [...] } }; tolerate a bare array too.
  const payload = data?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.redirects)) return payload.redirects;
  return [];
}

export async function createRedirect(
  payload: Omit<Redirect, "_id" | "createdAt" | "updatedAt">
): Promise<Redirect> {
  const { data } = await api.post("/redirects", payload);
  return data?.data;
}

export async function updateRedirect(
  id: string,
  payload: Partial<Redirect>
): Promise<Redirect> {
  const { data } = await api.put(`/redirects/${id}`, payload);
  return data?.data;
}

export async function deleteRedirect(id: string): Promise<void> {
  await api.delete(`/redirects/${id}`);
}
