import api from "@/api/api";

export type CartItemAddInput = {
  productId: string;
  quantity: number;
  startDate: string;
  endDate: string;
};

export type CartItemUpdateInput = {
  productId: string;
  quantity: number;
  startDate: string;
  endDate: string;
};

export interface ApiCartProduct {
  id?: string;
  _id?: string;
  name?: string;
  price?: number;
  priceDiscount?: number | null;
  imageCover?: string;
  images?: string[];
}

export interface ApiCartItem {
  product: ApiCartProduct | string;
  quantity: number;
  price?: number;
  startDate?: string;
  endDate?: string;
  _id?: string;
}

export interface ApiCart {
  _id?: string;
  cartId?: string;
  user?: string;
  items?: ApiCartItem[];
  totalPrice?: number;
  totalItems?: number;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface CartResponse {
  status?: string;
  data?: { cart?: ApiCart };
}

export async function getCart(): Promise<ApiCart> {
  const { data } = await api.get<CartResponse>("/cart");
  return data?.data?.cart ?? { items: [] };
}

export async function addToCart(input: CartItemAddInput): Promise<ApiCart> {
  const { data } = await api.post<CartResponse>("/cart", input);
  return data?.data?.cart ?? { items: [] };
}

export async function updateCart(payload: {
  items: Array<{
    productId: string;
    quantity: number;
    startDate: string;
    endDate: string;
  }>;
}): Promise<ApiCart> {
  const { data } = await api.put<CartResponse>("/cart", payload);
  return data?.data?.cart ?? { items: [] };
}

export async function updateCartItemSingle(payload: {
  productId: string;
  quantity: number;
  startDate: string;
  endDate: string;
  rentalType: string;
}): Promise<ApiCart> {
  const { data } = await api.put<CartResponse>("/cart", payload);
  return data?.data?.cart ?? { items: [] };
}

export async function removeCartItem(productId: string): Promise<ApiCart> {
  const { data } = await api.delete<CartResponse>(`/cart/${productId}`);
  return data?.data?.cart ?? { items: [] };
}

export async function clearCart(): Promise<void> {
  await api.delete<CartResponse>("/cart");
}
