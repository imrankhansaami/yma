export type TOrderedProduct = {
  _id: string;
  name: string;
  price: number;
  imageCover: string | string[];
};

export type TOrderItem = {
  product: TOrderedProduct;
  productId?: string;
  quantity: number;
  price: number;
  name: string;
  imageCover?: string | string[];
  startDate: string;
  endDate: string;
  hireOccasion: string;
  keepOvernight: boolean;
  sensitiveDetails?: boolean;
};

export type TOrder = {
  id: string;
  _id: string;
  orderNumber: string; // Changed from orderId
  customerName?: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  items: TOrderItem[]; // Changed from products
  subtotalAmount: number;
  deliveryFee: number;
  overnightFee: number;
  placementFee?: number;
  discountAmount: number;
  totalAmount: number; // Changed from total
  paymentMethod: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  shippingAddress: any; // Using any for complex address object for now, or define a type if needed
  termsAccepted: boolean;
  invoiceType: string;
  bankDetails?: string;
  promoCode?: string;
  promoDiscount?: number;
  estimatedDeliveryDate: string; // Changed from deliveryDate
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
};

export interface DashboardStats {
  todayRevenue: number;
  pendingConfirmations: number;
  todayBookings: number;
  todayDeliveries: number;
}

export interface DashboardStatsResponse {
  status: number;
  message: string;
  data: DashboardStats;
}

export type RevenueOverTime = {
  date: string;
  revenue: number;
  orders: number;
};

export type RevenueOverTimeResponse = {
  status: number;
  message: string;
  data: RevenueOverTime[];
};
