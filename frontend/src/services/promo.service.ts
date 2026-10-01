import api from "@/api/api";

export interface ApplyPromoCodeRequest {
  promo: string;
  orderAmount: number;
}

export interface ApplyPromoCodeResponse {
  success: boolean;
  discount: number;
  finalAmount: number;
  message: string;
}

export const applyPromoCode = async (
  data: ApplyPromoCodeRequest,
): Promise<ApplyPromoCodeResponse> => {
  const response = await api.post<ApplyPromoCodeResponse>(
    "/promos/apply",
    data,
  );
  return response.data;
};
