"use client";

import SampleImage from "@/assets/images/bg1.png";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAdminToast } from "@/components/ui/admin-toast";
import { cn } from "@/lib/utils";
import api from "@/api/api";
import { orderServices } from "@/services/order.service";
import { TOrder } from "@/types/order";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateInvoice } from "@/lib/invoice-generator";
import { format, isValid, startOfToday } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Download,
  Edit3,
  Loader2,
  PackageCheck,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import * as yup from "yup";
import type { DateRange } from "react-day-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CustomerHistoryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string;
  orderDbId?: string;
};

const HISTORY_ORDER = {
  id: "1AD56890",
  createdAt: new Date("2023-12-15"),
  reservationDate: new Date("2023-12-21"),
  status: "Completed",
  overnight: false,
  isCorporate: false,
  corporateNotes: "",
  customer: {
    name: "Khanzat Chimaev",
    firstName: "Khanzat",
    lastName: "Chimaev",
    email: "hellokhamzat@yma.com",
    phone: "+44 20 3996 3391",
    location: "Aiden Murphy",
    street1: "Long tail street address will be like this",
    street2: "Bristol, BS16 4QA",
    zip: "BS16 4QA",
    deliveryTime: "10:00 AM",
    collectionTime: "6:30 PM",
    companyName: "Murphy & Co.",
    accessibility: "Side gate access, 1.2m width",
    placedIn: "Back garden (grass surface)",
    usedBy: "12 children (ages 5–9)",
    occasion: "Birthday party",
    notes:
      "Please place the bouncy castle on the grass area in our backyard. We prefer delivery between 10–11 AM if possible. Thank you!",
  },
  shipping: {
    location: "Aiden Murphy",
    street1: "Long tail street address will be like this",
    street2: "Bristol, BS16 4QA",
    city: "Stockport",
    county: "Greater Manchester",
    zip: "BS16 4QA",
  },
  items: [
    {
      id: 1,
      name: "Long tail bouncy castle name will be will be like this",
      price: "$130",
      qty: 1,
      total: "$130",
      badge: "For 1 Day",
      secondary: "",
      image: (SampleImage as unknown as { src: string }).src,
    },
    {
      id: 2,
      name: "Long tail bouncy castle name will be will be like this",
      price: "$130",
      qty: 2,
      total: "$260",
      badge: "For 1 Day",
      secondary: "Sensitive Product +20% (Refundable)",
      image: (SampleImage as unknown as { src: string }).src,
    },
  ],
  summary: {
    shippingCharge: "$0",
    overnightCharge: "$0",
    coupon: "#BLACKFRIDAY",
    couponAmount: "-$10",
    total: "$420.00",
  },
};

type OrderItem = {
  id: string;
  name: string;
  price: string;
  qty: number;
  total: string;
  badge: string;
  secondary: string;
  image: string | string[];
};

type OrderState = {
  id: string;
  createdAt: Date;
  reservationDate: Date;
  status: string;
  overnight: boolean;
  isCorporate: boolean;
  corporateNotes: string;
  customer: {
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    street1: string;
    street2: string;
    zip: string;
    deliveryTime: string;
    collectionTime: string;
    companyName: string;
    accessibility: string;
    placedIn: string;
    usedBy: string;
    occasion: string;
    notes: string;
  };
  shipping: {
    location: string;
    street1: string;
    street2: string;
    city: string;
    county: string;
    zip: string;
  };
  items: OrderItem[];
  summary: {
    shippingCharge: string;
    overnightCharge: string;
    coupon: string;
    couponAmount: string;
    total: string;
  };
};

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

const statusOptions: { value: OrderStatus; label: string; color: string }[] = [
  { value: "pending", label: "Pending", color: "bg-amber-500" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-500" },
  { value: "shipped", label: "Shipped", color: "bg-purple-500" },
  { value: "delivered", label: "Delivered", color: "bg-emerald-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
];

const deliveryTimeOptions = [
  "Standard delivery 8AM to 12PM (Free)",
  "9:00 AM (+£10)",
  "9:30 AM (+£10)",
  "10:00 AM (+£10)",
  "10:30 AM (+£10)",
  "11:00 AM (+£10)",
  "11:30 AM (+£10)",
  "12:00 PM (+£10)",
  "12:30 PM (+£10)",
  "1:00 PM (+£10)",
  "1:30 PM (+£10)",
  "2:00 PM (+£10)",
  "2:30 PM (+£10)",
  "3:00 PM (+£10)",
  "3:30 PM (+£10)",
  "4:00 PM (+£10)",
  "4:30 PM (+£10)",
  "5:00 PM (+£10)",
  "5:30 PM (+£10)",
  "6:00 PM (+£10)",
  "6:30 PM (+£10)",
  "7:00 PM (+£10)",
];

const collectionTimeOptions = [
  "Standard collection time after 5PM (Free)",
  "12:00 PM (+£10)",
  "12:30 PM (+£10)",
  "1:00 PM (+£10)",
  "1:30 PM (+£10)",
  "2:00 PM (+£10)",
  "2:30 PM (+£10)",
  "3:00 PM (+£10)",
  "3:30 PM (+£10)",
  "4:00 PM (+£10)",
  "4:30 PM (+£10)",
  "5:00 PM (+£10)",
  "5:30 PM (+£10)",
  "6:00 PM (+£10)",
  "6:30 PM (+£10)",
  "7:00 PM (+£10)",
  "7:30 PM (+£10)",
  "8:00 PM (+£10)",
  "8:30 PM (+£20)",
];

const accessibilityOptions = ["Accessible from street", "Through a building"];
const placementOptions = [
  "Outdoor Grass",
  "Hard Floor (indoor)",
  "Hard Floor (outdoor)",
];
const userOptions = ["Children", "Adults", "Both"];
const occasionOptions = [
  "Christmas Event",
  "Eid",
  "Birthday Party - Child",
  "Birthday Party - Adult",
  "Community Event / Fayre",
  "School Fete",
  "Wedding",
  "Christening",
  "Corporate Funday",
];

const toMoney = (value?: number | null) =>
  typeof value === "number" ? `£${value.toFixed(2)}` : "£0.00";

const mapOrderToState = (order: TOrder): OrderState => {
  const address = order.shippingAddress || {};
  const firstNameFromAddress = address.firstName || "";
  const lastNameFromAddress = address.lastName || "";
  const customerName =
    `${firstNameFromAddress} ${lastNameFromAddress}`.trim() ||
    order.customerName ||
    order.user?.name ||
    "Guest";

  return {
    id: order.orderNumber || order._id || "—",
    createdAt: new Date(order.createdAt),
    reservationDate: new Date(order.estimatedDeliveryDate || order.createdAt),
    status: order.status || "pending",
    overnight: order.items?.some((item) => item.keepOvernight) || false,
    isCorporate: order.invoiceType === "corporate",
    corporateNotes: order.adminNotes || "",
    customer: {
      name: customerName,
      firstName: firstNameFromAddress || customerName.split(" ")[0] || "",
      lastName:
        lastNameFromAddress || customerName.split(" ").slice(1).join(" "),
      email: order.user?.email || address.email || "N/A",
      phone: order.user?.phone || address.phone || "N/A",
      location: address.location || "N/A",
      street1: address.street || "N/A",
      street2: address.apartment || "",
      zip: address.zipCode || "N/A",
      deliveryTime: address.deliveryTime || "N/A",
      collectionTime: address.collectionTime || "N/A",
      companyName: address.companyName || "N/A",
      accessibility: address.locationAccessibility || "N/A",
      placedIn: address.floorType || "N/A",
      usedBy: address.userType || "N/A",
      occasion: address.hireOccasion || "N/A",
      notes: address.notes || order.adminNotes || "",
    },
    shipping: {
      location: address.location || "N/A",
      street1: address.street || "N/A",
      street2: address.apartment || "",
      city: address.city || "N/A",
      county: address.country || "N/A",
      zip: address.zipCode || "N/A",
    },
    items: (order.items || []).map((item, idx) => ({
      id: item.product?._id || String(idx),
      name: item.product?.name || item.name || "Unknown Product",
      price: toMoney(item.price),
      qty: item.quantity || 0,
      total: toMoney((item.price || 0) * (item.quantity || 0)),
      badge: "For 1 Day",
      secondary: item.sensitiveDetails ? "Sensitive Product" : "",
      image:
        item.imageCover ||
        item.product?.imageCover ||
        (SampleImage as unknown as { src: string }).src,
    })),
    summary: {
      shippingCharge: toMoney(order.deliveryFee),
      overnightCharge: toMoney(order.overnightFee),
      coupon: order.promoCode || order.promoDiscount ? order.promoCode || "—" : "—",
      couponAmount: order.promoDiscount
        ? `-£${Number(order.promoDiscount).toFixed(2)}`
        : "£0.00",
      total: toMoney(order.totalAmount),
    },
  };
};

export function CustomerHistoryModal({
  open,
  onOpenChange,
  orderId,
  orderDbId,
}: CustomerHistoryModalProps) {
  const [selectedDate, setSelectedDate] = useState<DateRange | undefined>(
    undefined,
  );
  const [dateError, setDateError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableOrder, setEditableOrder] = useState<OrderState | null>(null);
  const [bookedDateSet, setBookedDateSet] = useState<Set<string>>(new Set());
  const { notify } = useAdminToast();
  const queryClient = useQueryClient();

  const { data: orderData, isLoading: isOrderLoading } = useQuery({
    queryKey: ["admin-order-history", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const resp = await orderServices.searchOrders(orderId);
      return resp.orders?.[0] ?? null;
    },
    enabled: open && Boolean(orderId && orderId !== "—"),
  });

  const activeOrder = orderData ? mapOrderToState(orderData) : HISTORY_ORDER;

  const currentOrder = editableOrder ?? activeOrder;
  const today = startOfToday();

  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setEditableOrder(null);
    }
  }, [open]);

  useEffect(() => {
    let mounted = true;
    const loadBookedDates = async () => {
      if (!open || !orderData?.items?.length) {
        if (mounted) setBookedDateSet(new Set());
        return;
      }

      const ids = Array.from(
        new Set(
          (orderData.items || [])
            .map((item) => item.product?._id || item.productId)
            .filter(Boolean)
            .map(String),
        ),
      );

      if (ids.length === 0) {
        if (mounted) setBookedDateSet(new Set());
        return;
      }

      try {
        const responses = await Promise.all(
          ids.map((id) => api.get(`/products/${id}`)),
        );

        const allDates = new Set<string>();
        responses.forEach((res) => {
          const product = res?.data?.data?.product;
          const dates = Array.isArray(product?.bookedDates)
            ? product.bookedDates
                .map((entry: any) => entry?.date)
                .filter(Boolean)
                .map((d: string) => format(new Date(d), "yyyy-MM-dd"))
            : [];
          dates.forEach((d: string) => allDates.add(d));
        });

        if (mounted) setBookedDateSet(allDates);
      } catch {
        if (mounted) setBookedDateSet(new Set());
      }
    };

    loadBookedDates();

    return () => {
      mounted = false;
    };
  }, [open, orderData]);

  const isBooked = (date: Date) => bookedDateSet.has(format(date, "yyyy-MM-dd"));
  const isDisabledDate = (date: Date) => date < today || isBooked(date);
  const customerFirstName = currentOrder.customer.firstName || "";
  const customerLastName = currentOrder.customer.lastName || "";

  const dateSchema = useMemo(
    () =>
      yup.object({
        from: yup.date().required("This field is required."),
        to: yup.date().nullable(),
      }),
    [],
  );

  const handleReorder = async () => {
    try {
      await dateSchema.validate({
        from: selectedDate?.from,
        to: selectedDate?.to,
      });
      setDateError(null);
      if (!orderData) return;
      const email =
        orderData.user?.email ||
        orderData.shippingAddress?.email ||
        orderData.shippingAddress?.billingEmail ||
        "";
      if (!email) {
        setDateError("Customer email is missing.");
        return;
      }

      const start = selectedDate?.from;
      const end = selectedDate?.to;
      if (!start || !end) {
        setDateError("Please select a valid date range.");
        return;
      }

      const payload = {
        email,
        itemsToReorder: (orderData.items || []).map((item) => ({
          productId: item.product?._id || item.productId || "",
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          quantity: item.quantity || 1,
        })),
      };

      await reorderMutation.mutateAsync(payload);
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        setDateError(err.message);
      }
    }
  };

  const reorderMutation = useMutation({
    mutationFn: async (payload: {
      email: string;
      itemsToReorder: Array<{
        productId: string;
        startDate: string;
        endDate: string;
        quantity: number;
      }>;
    }) => {
      const { data } = await api.post("/customers/orders/reorder", payload);
      return data;
    },
    onSuccess: () => {
      notify({
        title: "Reorder placed",
        message: "The reorder has been created successfully.",
        variant: "success",
      });
      setSelectedDate(undefined);
      onOpenChange(false);
    },
    onError: (error: any) => {
      notify({
        title: "Reorder failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to create reorder.",
        variant: "error",
      });
    },
  });
  const handleDownloadInvoice = () => {
    if (orderData) {
      generateInvoice(orderData);
    }
  };

  const handleEditToggle = () => {
    if (!orderData) return;
    if (!isEditing) {
      setEditableOrder(mapOrderToState(orderData));
      setIsEditing(true);
      return;
    }
    setIsEditing(false);
    setEditableOrder(null);
  };

  const handleDiscardChanges = () => {
    setIsEditing(false);
    setEditableOrder(null);
  };

  const handleEditableChange = (
    section: "customer" | "shipping" | "summary" | "root",
    field: string,
    value: any,
  ) => {
    setEditableOrder((prev) => {
      if (!prev) return prev;
      if (section === "root") {
        return {
          ...prev,
          [field]: value,
        };
      }
      return {
        ...prev,
        [section]: {
          ...(prev as any)[section],
          [field]: value,
        },
      } as OrderState;
    });
  };

  const updateOrderMutation = useMutation({
    mutationFn: async (payload: any) => {
      const targetOrderId = orderData?._id || orderDbId;
      if (!targetOrderId) throw new Error("Missing order ID");
      return orderServices.updateOrder(targetOrderId, payload);
    },
    onSuccess: () => {
      notify({
        title: "Order updated",
        message: "Order details saved successfully",
        variant: "success",
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-order-history", orderId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setIsEditing(false);
      setEditableOrder(null);
    },
    onError: (error: any) => {
      notify({
        title: "Error",
        message: error?.response?.data?.message || "Failed to update order",
        variant: "error",
      });
    },
  });

  const handleSaveChanges = () => {
    if (!orderData || !editableOrder) return;

    const payload = {
      customerName:
        `${editableOrder.customer.firstName || ""} ${editableOrder.customer.lastName || ""}`.trim(),
      estimatedDeliveryDate: editableOrder.reservationDate.toISOString(),
      status: editableOrder.status,
      invoiceType: editableOrder.isCorporate ? "corporate" : "regular",
      adminNotes: editableOrder.corporateNotes || editableOrder.customer.notes,
      shippingAddress: {
        firstName: editableOrder.customer.firstName || "",
        lastName: editableOrder.customer.lastName || "",
        email: editableOrder.customer.email,
        phone: editableOrder.customer.phone,
        location: editableOrder.shipping.location,
        street: editableOrder.shipping.street1,
        apartment: editableOrder.shipping.street2,
        city: editableOrder.shipping.city,
        country: editableOrder.shipping.county,
        zipCode: editableOrder.shipping.zip,
        deliveryTime: editableOrder.customer.deliveryTime,
        collectionTime: editableOrder.customer.collectionTime,
        companyName: editableOrder.customer.companyName,
        locationAccessibility: editableOrder.customer.accessibility,
        floorType: editableOrder.customer.placedIn,
        userType: editableOrder.customer.usedBy,
        hireOccasion: editableOrder.customer.occasion,
        notes: editableOrder.customer.notes,
        keepOvernight: editableOrder.overnight,
      },
    };

    updateOrderMutation.mutate(payload);
  };

  const renderedOrderId = useMemo(
    () => (currentOrder?.id ? currentOrder.id.replace("#", "") : HISTORY_ORDER.id),
    [currentOrder?.id]
  );

  const renderDetailRow = (
    label: string,
    value: string,
    multiline?: boolean
  ) => (
    <div className="flex gap-16">
      <div className="w-40 text-[12px] text-slate-500">{label}</div>
      <div
        className={cn(
          "flex-1 text-[13px] text-slate-900",
          multiline ? "max-w-[280px] leading-5" : "leading-5"
        )}
      >
        {value}
      </div>
    </div>
  );

  const renderEditableRow = (
    label: string,
    value: string,
    onChange: (next: string) => void,
    multiline?: boolean
  ) => (
    <div className="flex gap-16">
      <div className="w-40 text-[12px] text-slate-500">{label}</div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-[13px] text-slate-900 border rounded px-2 py-1 h-20 resize-y max-w-[280px] font-inter"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-[13px] text-slate-900 border rounded px-2 py-1 h-8 max-w-[280px] font-inter"
        />
      )}
    </div>
  );

  const renderEditableSelectRow = (
    label: string,
    value: string,
    options: string[],
    onChange: (next: string) => void,
  ) => {
    const safeOptions = value && !options.includes(value)
      ? [value, ...options]
      : options;

    return (
      <div className="flex gap-16">
        <div className="w-40 text-[12px] text-slate-500">{label}</div>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="flex-1 h-8 max-w-[280px] font-inter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="font-inter">
            {safeOptions.map((option) => (
              <SelectItem key={option} value={option} className="font-inter">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "w-[70vw] max-w-[70vw] sm:w-[70vw] sm:max-w-[70vw] max-h-[90vh] font-inter p-0 gap-0",
          "overflow-hidden rounded-2xl border border-slate-200 flex flex-col"
        )}
      >
        <DialogClose asChild>
          <button
            type="button"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-brand-black-950 hover:bg-white hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogClose>
        <DialogHeader className="border-b border-slate-200 pt-5 pb-6">
          <DialogTitle className="sr-only">Order History</DialogTitle>
          <div className="flex items-start justify-between bg-brand-gray-50 px-6 py-4 -mt-6 border-b border-slate-200">
            {isOrderLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-5 w-40 rounded bg-slate-100" />
                <div className="h-4 w-28 rounded bg-slate-100" />
              </div>
            ) : (
              <div className="space-y-1">
                <DialogTitle className="text-lg font-semibold leading-none tracking-[0.01em] text-slate-900">
                  #{renderedOrderId}
                </DialogTitle>
                <p className="text-sm leading-none text-slate-500 mt-2">
                  Order History
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-10 text-slate-900 px-6">
            {isOrderLoading ? (
              <div className="flex items-center gap-10 w-full animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={`sk-top-${i}`} className="space-y-2">
                    <div className="h-4 w-24 rounded bg-slate-100" />
                    <div className="h-4 w-20 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-[2px]">
                  <div className="text-sm text-slate-500">Created at</div>
                  <div className="text-sm font-medium mt-4">
                    {isValid(currentOrder.createdAt)
                      ? format(currentOrder.createdAt, "MMM dd, yyyy")
                      : "Invalid date"}
                  </div>
                </div>
                <div className="space-y-[2px]">
                  <div className="text-sm text-slate-500">Reservation date</div>
                  <div className="text-sm font-medium mt-4">
                    {isEditing ? (
                      <input
                        type="date"
                        value={
                          currentOrder.reservationDate
                            ? format(currentOrder.reservationDate, "yyyy-MM-dd")
                            : ""
                        }
                        onChange={(e) => {
                          const next = new Date(e.target.value);
                          if (isValid(next)) {
                            handleEditableChange("root", "reservationDate", next);
                          }
                        }}
                        className="h-8 border rounded px-2 text-[13px] font-inter"
                      />
                    ) : (
                      format(currentOrder.reservationDate, "MMM dd, yyyy")
                    )}
                  </div>
                </div>
                <div className="space-y-[2px]">
                  <div className="text-sm text-slate-500">Order status</div>
                  {isEditing ? (
                    <Select
                      value={currentOrder.status as OrderStatus}
                      onValueChange={(value: OrderStatus) =>
                        handleEditableChange("root", "status", value)
                      }
                    >
                      <SelectTrigger className="w-[130px] h-8 mt-4 font-inter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="font-inter">
                        {statusOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className="font-inter"
                          >
                            <div className="flex items-center gap-2 font-inter">
                              <span
                                className={`h-2 w-2 rounded-full ${option.color}`}
                              />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-[3px] text-[12px] font-semibold mt-4 text-emerald-700 border-slate-200 shadow-[0px_1px_2px_var(--alpha-ink-900-5)] capitalize">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      {currentOrder.status}
                    </span>
                  )}
                </div>
                <div className="space-y-[2px]">
                  <div className="text-sm text-slate-500">Overnight</div>
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-4">
                      <Checkbox
                        checked={currentOrder.overnight}
                        onCheckedChange={(checked) =>
                          handleEditableChange(
                            "root",
                            "overnight",
                            Boolean(checked)
                          )
                        }
                        className="h-[14px] w-[14px]"
                      />
                      <span className="text-[12px] text-slate-800">
                        Keeping Overnight
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-sm border border-slate-300 bg-white px-2.5 py-[3px] text-[12px] font-medium mt-4 text-slate-800">
                      <span className="h-2 w-2 rounded-full bg-slate-900" />
                      {currentOrder.overnight ? "Yes" : "No"}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-6 px-6 py-5 text-[12px] text-slate-900">
            {isOrderLoading ? (
              <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm">
                  <div className="space-y-5">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={`sk-left-${i}`} className="h-4 w-48 bg-slate-100 rounded" />
                    ))}
                  </div>
                  <div className="space-y-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={`sk-right-${i}`} className="h-4 w-48 bg-slate-100 rounded" />
                    ))}
                  </div>
                </div>
                <div className="pt-5 border-t border-slate-200 space-y-4">
                  <div className="h-4 w-40 bg-slate-100 rounded" />
                  <div className="h-4 w-56 bg-slate-100 rounded" />
                  <div className="h-4 w-52 bg-slate-100 rounded" />
                </div>
                <div className="pt-5 border-t border-slate-200 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={`sk-item-${i}`} className="h-14 w-full bg-slate-100 rounded" />
                  ))}
                </div>
                <div className="pt-5 border-t border-slate-200 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={`sk-sum-${i}`} className="h-4 w-full bg-slate-100 rounded" />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm">
                  <div className="space-y-5">
                    {isEditing ? (
                      <>
                        {renderEditableRow("First name", customerFirstName, (v) => {
                          handleEditableChange(
                            "customer",
                            "firstName",
                            v
                          );
                          handleEditableChange(
                            "customer",
                            "name",
                            `${v} ${customerLastName}`.trim()
                          );
                        })}
                        {renderEditableRow("Last name", customerLastName, (v) => {
                          handleEditableChange(
                            "customer",
                            "lastName",
                            v
                          );
                          handleEditableChange(
                            "customer",
                            "name",
                            `${customerFirstName} ${v}`.trim()
                          );
                        })}
                      </>
                    ) : (
                      <>
                        {renderDetailRow("First name", customerFirstName)}
                        {renderDetailRow("Last name", customerLastName || "—")}
                      </>
                    )}
                    {isEditing
                      ? renderEditableRow(
                          "Email",
                          currentOrder.customer.email,
                          (v) => handleEditableChange("customer", "email", v)
                        )
                      : renderDetailRow("Email", currentOrder.customer.email)}
                    {isEditing
                      ? renderEditableRow(
                          "Phone",
                          currentOrder.customer.phone,
                          (v) => handleEditableChange("customer", "phone", v)
                        )
                      : renderDetailRow("Phone", currentOrder.customer.phone)}
                    {isEditing
                      ? renderEditableRow(
                          "Location",
                          currentOrder.customer.location,
                          (v) => handleEditableChange("customer", "location", v)
                        )
                      : renderDetailRow(
                          "Location",
                          currentOrder.customer.location
                        )}
                    {isEditing
                      ? renderEditableRow(
                          "Street address",
                          currentOrder.customer.street1,
                          (v) => handleEditableChange("customer", "street1", v),
                          true
                        )
                      : renderDetailRow(
                          "Street address",
                          currentOrder.customer.street1,
                          true
                        )}
                    {isEditing
                      ? renderEditableRow(
                          "Street address",
                          currentOrder.customer.street2,
                          (v) => handleEditableChange("customer", "street2", v)
                        )
                      : renderDetailRow(
                          "Street address",
                          currentOrder.customer.street2
                        )}
                    {isEditing
                      ? renderEditableRow(
                          "Zip code",
                          currentOrder.customer.zip,
                          (v) => handleEditableChange("customer", "zip", v)
                        )
                      : renderDetailRow("Zip code", currentOrder.customer.zip)}
                    {isEditing
                      ? renderEditableSelectRow(
                          "Delivery time",
                          currentOrder.customer.deliveryTime,
                          deliveryTimeOptions,
                          (v) =>
                            handleEditableChange("customer", "deliveryTime", v)
                        )
                      : renderDetailRow(
                          "Delivery time",
                          currentOrder.customer.deliveryTime
                        )}
                    {isEditing
                      ? renderEditableSelectRow(
                          "Collection time",
                          currentOrder.customer.collectionTime,
                          collectionTimeOptions,
                          (v) =>
                            handleEditableChange(
                              "customer",
                              "collectionTime",
                              v
                            )
                        )
                      : renderDetailRow(
                          "Collection time",
                          currentOrder.customer.collectionTime
                        )}
                  </div>
                  <div className="space-y-5">
                    {isEditing
                      ? renderEditableRow(
                          "Company name",
                          currentOrder.customer.companyName,
                          (v) =>
                            handleEditableChange("customer", "companyName", v)
                        )
                      : renderDetailRow(
                          "Company name",
                          currentOrder.customer.companyName
                        )}
                    {isEditing
                      ? renderEditableSelectRow(
                          "Location accessibility",
                          currentOrder.customer.accessibility,
                          accessibilityOptions,
                          (v) =>
                            handleEditableChange("customer", "accessibility", v)
                        )
                      : renderDetailRow(
                          "Location accessibility",
                          currentOrder.customer.accessibility
                        )}
                    {isEditing
                      ? renderEditableSelectRow(
                          "Product will be placed in",
                          currentOrder.customer.placedIn,
                          placementOptions,
                          (v) => handleEditableChange("customer", "placedIn", v)
                        )
                      : renderDetailRow(
                          "Product will be placed in",
                          currentOrder.customer.placedIn
                        )}
                    {isEditing
                      ? renderEditableSelectRow(
                          "Use occasion",
                          currentOrder.customer.occasion,
                          occasionOptions,
                          (v) => handleEditableChange("customer", "occasion", v)
                        )
                      : renderDetailRow(
                          "Use occasion",
                          currentOrder.customer.occasion
                        )}
                    {isEditing
                      ? renderEditableSelectRow(
                          "Product will be used by",
                          currentOrder.customer.usedBy,
                          userOptions,
                          (v) => handleEditableChange("customer", "usedBy", v)
                        )
                      : renderDetailRow(
                          "Product will be used by",
                          currentOrder.customer.usedBy
                        )}
                    {isEditing
                      ? renderEditableRow(
                          "Notes",
                          currentOrder.customer.notes,
                          (v) => handleEditableChange("customer", "notes", v),
                          true
                        )
                      : renderDetailRow("Notes", currentOrder.customer.notes, true)}
                  </div>
                </div>

                {/* SHIPPING INFORMATION */}
                <div className="pt-5 border-t border-slate-200">
                  <p className="mb-4 text-sm font-semibold text-slate-700">
                    Shipping Information
                  </p>
                  <div className="space-x-16 space-y-5 text-sm">
                    {isEditing
                      ? renderEditableRow(
                          "Location",
                          currentOrder.shipping.location,
                          (v) => handleEditableChange("shipping", "location", v)
                        )
                      : renderDetailRow(
                          "Location",
                          currentOrder.shipping.location
                        )}
                    {isEditing
                      ? renderEditableRow(
                          "Street address",
                          currentOrder.shipping.street1,
                          (v) => handleEditableChange("shipping", "street1", v),
                          true
                        )
                      : renderDetailRow(
                          "Street address",
                          currentOrder.shipping.street1,
                          true
                        )}
                    {isEditing
                      ? renderEditableRow(
                          "Street address",
                          currentOrder.shipping.street2,
                          (v) => handleEditableChange("shipping", "street2", v)
                        )
                      : renderDetailRow(
                          "Street address",
                          currentOrder.shipping.street2
                        )}
                    {isEditing
                      ? renderEditableRow(
                          "Town/City",
                          currentOrder.shipping.city,
                          (v) => handleEditableChange("shipping", "city", v)
                        )
                      : renderDetailRow("Town/City", currentOrder.shipping.city)}
                    {isEditing
                      ? renderEditableRow(
                          "State/County",
                          currentOrder.shipping.county,
                          (v) => handleEditableChange("shipping", "county", v)
                        )
                      : renderDetailRow(
                          "State/County",
                          currentOrder.shipping.county
                        )}
                    {isEditing
                      ? renderEditableRow(
                          "Zip code",
                          currentOrder.shipping.zip,
                          (v) => handleEditableChange("shipping", "zip", v)
                        )
                      : renderDetailRow("Zip code", currentOrder.shipping.zip)}
                  </div>
                </div>

                {/* ITEMS */}
                <div className="pt-5 border-t border-slate-200">
                  <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] items-center text-sm font-medium text-slate-600 pb-2 w-full">
                    <div>Items</div>
                    <div className="text-right">Price</div>
                    <div className="text-right">Total</div>
                  </div>

                  <div className="w-full text-sm">
                    {currentOrder.items.map((item) => {
                      const imageSrc = Array.isArray(item.image)
                        ? item.image[0]
                        : item.image;

                      return (
                      <div
                        key={item.id}
                        className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] items-center gap-2 py-4"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="relative h-[56px] w-[56px] overflow-hidden rounded-[6px] bg-brand-emerald-520 shrink-0">
                            <Image
                              src={imageSrc || SampleImage}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          </div>
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-[13px] text-slate-900 leading-[1.25]">
                              {item.name}
                            </span>
                            <div className="flex flex-col items-start gap-1">
                              <span className="inline-flex rounded-[4px] border border-slate-300 bg-white px-2 py-[2px] text-[11px] text-slate-700">
                                {item.badge}
                              </span>
                              {item.secondary && (
                                <span className="inline-flex items-center rounded-[4px] border border-red-300 px-2 py-[1px] text-[12px] font-medium text-red-600">
                                  {item.secondary}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-[13px] text-slate-900 text-right">
                          {item.price}
                        </div>
                        <div className="text-[13px] text-slate-900 text-right font-medium">
                          {item.total}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-200 space-y-5 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Shipping charge</span>
                    <span>{currentOrder.summary.shippingCharge}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Overnight charge</span>
                    <span>{currentOrder.summary.overnightCharge}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>
                      Coupon <span className="mx-1">•</span>{" "}
                      <span className="font-medium">
                        {currentOrder.summary.coupon}
                      </span>
                    </span>
                    <span className="text-brand-red-450 font-medium">
                      {currentOrder.summary.couponAmount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Total amount</span>
                    <span className="text-[13px] font-semibold text-slate-900">
                      {currentOrder.summary.total}
                    </span>
                  </div>

                  <div className="pt-5 border-t border-slate-200">
                    <label className="flex items-center gap-2 text-sm text-slate-800 font-inter">
                      <Checkbox
                        checked={currentOrder.isCorporate}
                        onCheckedChange={(checked) =>
                          handleEditableChange(
                            "root",
                            "isCorporate",
                            Boolean(checked)
                          )
                        }
                        className="h-[14px] w-[14px]"
                        disabled={!isEditing}
                      />
                      <span>Mark as corporate order.</span>
                    </label>
                    {currentOrder.isCorporate && (
                      <div className="mt-3">
                        <textarea
                          value={currentOrder.corporateNotes}
                          onChange={(e) =>
                            handleEditableChange(
                              "root",
                              "corporateNotes",
                              e.target.value
                            )
                          }
                          placeholder="Enter payment details and any additional information you want included in the corporate invoice."
                          className="min-h-[72px] w-full max-w-[520px] resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-[12px] leading-5 text-slate-600 placeholder:text-slate-400 font-inter"
                          disabled={!isEditing}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            <div className="border-t border-slate-200 pt-4">
              <div className="text-[12px] text-slate-900 font-medium mb-3">
                Reorder Information
              </div>
              <div className="space-y-2">
                <div className="text-[12px] text-slate-500">
                  Select order date
                </div>
                <TooltipProvider delayDuration={120}>
                  <div className="rounded-2xl  bg-white py-3 shadow-[0_1px_0_var(--alpha-black-3)]">
                    <div className="mb-2 flex items-center">
                      <Button
                        variant="outline"
                        className={cn(
                          "h-10 w-[490px] justify-start rounded-lg border bg-white px-3 text-sm font-medium text-slate-800 shadow-sm",
                          dateError
                            ? "border-brand-orange-500 text-brand-orange-500"
                            : "border-slate-300"
                        )}
                      >
                        <CalendarIcon
                          className={cn(
                            "mr-2 h-4 w-4",
                            dateError ? "text-brand-orange-500" : "text-slate-500"
                          )}
                        />
                        {selectedDate?.from ? (
                          <span>
                            {selectedDate.to
                              ? `${format(selectedDate.from, "MMM d, yyyy")} - ${format(selectedDate.to, "MMM d, yyyy")}`
                              : format(selectedDate.from, "MMM d, yyyy")}
                          </span>
                        ) : (
                          <span>Select date</span>
                        )}
                        <ChevronDown
                          className={cn(
                            "ml-auto h-4 w-4",
                            dateError ? "text-brand-orange-500" : "text-slate-500"
                          )}
                        />
                      </Button>
                    </div>
                    <Calendar
                      mode="range"
                      numberOfMonths={2}
                      defaultMonth={selectedDate?.from ?? new Date()}
                      selected={selectedDate}
                      onSelect={(range) => {
                        setSelectedDate(range ?? undefined);
                        setDateError(null);
                      }}
                      disabled={isDisabledDate}
                      modifiers={{ booked: isBooked }}
                      modifiersClassNames={{
                        booked:
                          "opacity-40 relative data-[outside=true]:!text-muted-foreground",
                      }}
                      className="font-inter border border-slate-200 rounded-xl p-3 [&_button[aria-selected='true']]:!bg-brand-orange-500 [&_button[aria-selected='true']]:!text-white [&_button[aria-selected='true']]:rounded-[8px]"
                      classNames={{
                        day_selected:
                          "!bg-brand-orange-500 !text-white hover:!bg-brand-orange-500 hover:!text-white rounded-[8px] font-semibold",
                        day_range_start:
                          "!bg-brand-orange-500 !text-white hover:!bg-brand-orange-500 hover:!text-white rounded-[8px]",
                        day_range_end:
                          "!bg-brand-orange-500 !text-white hover:!bg-brand-orange-500 hover:!text-white rounded-[8px]",
                      }}
                    />
                    {dateError && (
                      <p className="mt-2 text-[13px] font-medium text-brand-red-550">
                        {dateError}
                      </p>
                    )}
                  </div>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                className="h-9 rounded-[6px] border-slate-300 px-3 text-[13px] font-medium text-slate-800 bg-white"
                onClick={handleDiscardChanges}
                disabled={updateOrderMutation.isPending}
              >
                <X className="mr-2 h-4 w-4" />
                Discard Changes
              </Button>
              <Button
                className="h-9 rounded-[6px] bg-brand-orange-500 px-4 text-[13px] font-semibold text-white hover:bg-brand-orange-470"
                onClick={handleSaveChanges}
                disabled={updateOrderMutation.isPending}
              >
                {updateOrderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="h-9 rounded-[6px] border-slate-300 px-3 text-[13px] font-medium text-slate-800 bg-white"
              onClick={handleEditToggle}
              disabled={!orderData}
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Order
            </Button>
          )}
          <Button
            variant="outline"
            className="h-9 rounded-[6px] border-slate-300 px-3 text-[13px] font-medium text-slate-800 bg-white"
            onClick={handleDownloadInvoice}
            disabled={!orderData}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
          </Button>
          <Button
            className="h-9 rounded-[6px] bg-brand-orange-500 px-4 text-[13px] font-semibold text-white hover:bg-brand-orange-470"
            onClick={handleReorder}
            disabled={reorderMutation.isPending}
          >
            {reorderMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              <>
                <PackageCheck className="mr-2 h-4 w-4" />
                Reorder
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
