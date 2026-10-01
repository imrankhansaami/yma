import api from "@/api/api";

export type CustomerOrderItem = {
  imageCover?: string;
  name?: string;
};

export type CustomerOrder = {
  _id?: string;
  orderNumber?: string;
  items?: CustomerOrderItem[];
  createdAt?: string;
};

export type CustomerRow = {
  _id: string;
  customerId?: string;
  email?: string;
  phone?: string;
  name?: string;
  orders?: CustomerOrder[];
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
};

export type CustomersResponse = {
  success?: boolean;
  data: CustomerRow[];
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

export type FetchCustomersParams = {
  page?: number;
  limit?: number;
  search?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  signal?: AbortSignal;
};

export async function fetchCustomers({
  page = 1,
  limit = 10,
  search = null,
  fromDate = null,
  toDate = null,
  signal,
}: FetchCustomersParams = {}): Promise<CustomersResponse> {
  const params: Record<string, any> = { page, limit };
  if (fromDate) params.rentalFrom = fromDate;
  if (toDate) params.rentalTo = toDate;
  if (search) params.q = search;

  const endpoint = search ? "/orders/admin/search" : "/orders/admin/all";

  const { data } = await api.get(endpoint, {
    params,
    signal,
  });

  const payload = data?.data ?? {};
  const orders: any[] = Array.isArray(payload.orders) ? payload.orders : [];

  const rows: CustomerRow[] = orders.map((order) => {
    const shipping = order?.shippingAddress ?? {};
    const customerName =
      order?.customerName ||
      order?.user?.name ||
      [shipping.firstName, shipping.lastName].filter(Boolean).join(" ");
    const orderItems = Array.isArray(order?.items) ? order.items : [];
    const isUnknownName = (name?: string) =>
      (name || "").trim().toLowerCase() === "unknown item";
    const namedItems = orderItems.filter(
      (item: any) => !!item?.name && !isUnknownName(item?.name),
    );
    const itemWithNameAndImage =
      namedItems.find((item: any) => !!item?.imageCover || !!item?.product?.imageCover) ??
      orderItems.find(
        (item: any) =>
          (!!item?.imageCover || !!item?.product?.imageCover) && !!item?.name,
      );
    const primaryItem = itemWithNameAndImage ?? namedItems[0] ?? orderItems[0];

    return {
      _id: order?._id ?? "",
      customerId: order?.user?._id ?? "",
      email: order?.user?.email ?? shipping.email,
      phone: shipping.phone,
      name: customerName || "—",
      orders: [
        {
          _id: order?._id,
          orderNumber: order?.orderNumber,
          createdAt: order?.createdAt,
          items: [
            {
              imageCover:
                primaryItem?.imageCover || primaryItem?.product?.imageCover,
              name:
                primaryItem?.name || primaryItem?.product?.name || "Unknown Item",
            },
            ...(orderItems.length > 1
              ? orderItems.slice(1).map((it: any) => ({
                  imageCover: it?.imageCover || it?.product?.imageCover,
                  name: it?.name || it?.product?.name,
                }))
              : []),
          ],
        },
      ],
      totalOrders: 1,
      totalSpent: order?.totalAmount,
      lastOrderDate: order?.createdAt,
    };
  });

  return {
    success: true,
    data: rows,
    pagination: {
      total: payload?.total ?? rows.length,
      page: payload?.currentPage ?? page,
      limit: payload?.limit ?? limit,
      totalPages: payload?.pages ?? 1,
    },
  };
}
