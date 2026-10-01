"use client";

export enum PromoStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  EXPIRED = "expired",
}

export type PromoCodeRow = {
  id: string;
  code: string;
  discount: string;
  minOrder: string;
  maxDiscount: string;
  usage: string;
  validity: string;
  status: PromoStatus;
  totalUsage?: number;
  totalUsageLimit?: number;
  totalDiscount?: number;
  avgDiscountPerOrder?: number;
  totalRevenue?: number;
  discountType?: string;
  discountPercentage?: number;
  maxDiscountValue?: number;
  minimumOrderValue?: number;
  usageLimitPerCustomer?: number;
  validityPeriod?: {
    from?: string;
    to?: string;
  };
  createdOn?: string;
  createdAt?: string;
};

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
