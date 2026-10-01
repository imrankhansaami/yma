import api from "@/api/api";
import { TOrder, DashboardStatsResponse } from "@/types/order";

export const orderServices = {
  getOrders: async (params: {
    page: number;
    limit: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const { page, limit, status, startDate, endDate } = params;
    let url = `/orders/admin/all?page=${page}&limit=${limit}`;
    if (status && status !== "all") {
      url += `&status=${status}`;
    }
    if (startDate) {
      url += `&startDate=${encodeURIComponent(startDate)}`;
    }
    if (endDate) {
      url += `&endDate=${encodeURIComponent(endDate)}`;
    }
    const { data } = await api.get<{
      status: string;
      message: string;
      data: {
        orders?: TOrder[];
        data?: TOrder[];
        total: number;
        page: number;
        limit: number;
      };
    }>(url);

    const orders = data?.data?.orders || data?.data?.data || [];
    const total = data?.data?.total || 0;

    return { orders, total, page, limit };
  },
  getMyOrders: async <TOrderItem = unknown>(params: {
    page: number;
    limit: number;
  }) => {
    const { page, limit } = params;
    const { data } = await api.get<{
      status: number | string;
      message: string;
      data: {
        orders?: TOrderItem[];
        total?: number;
        pages?: number;
      };
    }>(`/orders/my-orders?page=${page}&limit=${limit}`);

    return {
      orders: (data?.data?.orders || []) as TOrderItem[],
      total: data?.data?.total || 0,
      pages: data?.data?.pages || 1,
    };
  },

  searchOrders: async (query: string) => {
    const { data } = await api.get<{
      status: number | string;
      message: string;
      data: {
        orders?: TOrder[];
        total?: number;
        pages?: number;
      };
    }>(`/orders/admin/search?q=${encodeURIComponent(query)}`);

    return {
      orders: data?.data?.orders || [],
      total: data?.data?.total || data?.data?.orders?.length || 0,
    };
  },

  updateOrderStatus: async (
    orderId: string,
    status: string,
    adminNotes?: string
  ) => {
    const { data } = await api.patch<{
      status: number;
      message: string;
      data: any;
    }>(`/orders/admin/${orderId}/status`, { status, adminNotes });
    return data;
  },

  updateOrder: async (orderId: string, data: Partial<TOrder> | any) => {
    const response = await api.patch<{
      status: string;
      message: string;
      data: TOrder;
    }>(`/orders/${orderId}`, data);
    return response.data;
  },
};

export const fetchDashboardStats = async () => {
  const { data } = await api.get<DashboardStatsResponse>(
    "/orders/admin/dashboard-stats"
  );
  return data?.data;
};

export const fetchRevenueOverTime = async (params: {
  status?: string;
  startDate: string;
  endDate: string;
}) => {
  const { status = "confirmed", startDate, endDate } = params;
  const url = `/orders/admin/revenue/over-time?status=${status}&startDate=${startDate}&endDate=${endDate}`;
  const { data } = await api.get<{
    status: number;
    message: string;
    data: { date: string; revenue: number; orders: number }[];
  }>(url);
  return data?.data || [];
};
