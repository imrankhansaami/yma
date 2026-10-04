import SampleImage from "@/assets/images/bg1.png";
import { AddProductsModal } from "@/components/admin/dashboard/AddProductsModal";
import { useAdminToast } from "@/components/ui/admin-toast";
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
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generateInvoice } from "@/lib/invoice-generator";
import { cn } from "@/lib/utils";
import { orderServices } from "@/services/order.service";
import { applyPromoCode } from "@/services/promo.service";
import { TOrder } from "@/types/order";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";
import {
  CalendarIcon,
  CircleCheck,
  Download,
  Edit3,
  Loader2,
  Minus,
  PackagePlus,
  PackageXIcon,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type OrderDetailsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: TOrder | null;
  extraFooterActions?: React.ReactNode;
  hideAdminActions?: boolean;
};

type OrderItem = {
  id: string;
  name: string;
  price: string;
  quantity: number;
  total: string;
  badges: string[];
  secondaryBadge: string;
  days: number;
  image: string | string[];
  startDate?: string;
  endDate?: string;
};

type InternalOrderState = {
  id: string;
  createdAt: Date;
  reservationDate: Date;
  status: OrderStatus;
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
    streetAddress1: string;
    streetAddress2: string;
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
    placementCharge: string;
    couponCode: string;
    couponAmount: string;
    totalAmount: string;
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

const HIRE_OCCASION_VALUE_MAP: Record<string, string> = {
  "Christmas Event": "christmasEvent",
  Eid: "eid",
  "Birthday Party - Child": "birthdayPartyKid",
  "Birthday Party - Adult": "birthdayPartyAdult",
  "Community Event / Fayre": "community_event",
  "School Fete": "school_event",
  Wedding: "wedding",
  Christening: "christening",
  "Corporate Funday": "corporateFunday",
};

const HIRE_OCCASION_LABEL_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(HIRE_OCCASION_VALUE_MAP).map(([label, value]) => [
    value,
    label,
  ]),
);

const normalizeOptionValue = (value: string, options: string[]) => {
  if (!value) return "";
  const exact = options.find((opt) => opt === value);
  if (exact) return exact;
  const lower = value.toLowerCase();
  const match = options.find((opt) => opt.toLowerCase() === lower);
  return match || value;
};

const formatTimeLabel = (value: string) => {
  const clean = value.trim();
  const timeMatch = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!timeMatch) return clean;
  const hour = Number(timeMatch[1]);
  const minute = timeMatch[2];
  const ampm =
    timeMatch[3]?.toUpperCase() ||
    (hour >= 12 ? "PM" : "AM");
  const hour12 =
    hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${minute} ${ampm}`;
};

const normalizeDeliveryLabel = (value?: string) => {
  if (!value) return "";
  const lower = value.toLowerCase();
  if (lower.includes("standard") || lower.includes("free")) {
    return deliveryTimeOptions[0];
  }
  const label = `${formatTimeLabel(value)} (+£10)`;
  return normalizeOptionValue(label, deliveryTimeOptions);
};

const normalizeCollectionLabel = (value?: string) => {
  if (!value) return "";
  const lower = value.toLowerCase();
  if (lower.includes("standard") || lower.includes("free")) {
    return collectionTimeOptions[0];
  }
  const timeLabel = formatTimeLabel(value);
  const fee = timeLabel.toLowerCase() === "8:30 pm" ? "+£20" : "+£10";
  const label = `${timeLabel} (${fee})`;
  return normalizeOptionValue(label, collectionTimeOptions);
};

const stripFeeLabel = (value?: string) =>
  (value || "").replace(/\s*\(\+£\d+\)\s*/g, "").replace(/\s*\(€\d+\)\s*/g, "").trim();

const parseTimeLabelToValue = (value?: string) => {
  const cleaned = stripFeeLabel(value);
  const match = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return "";
  const hour = Number(match[1]);
  const minute = match[2];
  const ampm = match[3].toUpperCase();
  const hour24 = ampm === "PM" ? (hour % 12) + 12 : hour === 12 ? 0 : hour;
  return `${hour24.toString().padStart(2, "0")}:${minute}`;
};

const normalizeDeliveryTimeValue = (value?: string) => {
  const cleaned = stripFeeLabel(value);
  if (!cleaned) return "";
  if (/standard delivery/i.test(cleaned)) return "09:00";
  return parseTimeLabelToValue(cleaned);
};

const normalizeCollectionTimeValue = (value?: string) => {
  const cleaned = stripFeeLabel(value);
  if (!cleaned) return "";
  if (/standard collection/i.test(cleaned)) return "17:00";
  return parseTimeLabelToValue(cleaned);
};

// Helper function to safely parse dates
const parseSafeDate = (dateValue: any): Date => {
  if (!dateValue) return new Date();

  // If already a Date object
  if (dateValue instanceof Date) {
    return isValid(dateValue) ? dateValue : new Date();
  }

  // If string, try to parse
  if (typeof dateValue === "string") {
    const parsed = parseISO(dateValue);
    return isValid(parsed) ? parsed : new Date();
  }

  // If number (timestamp)
  if (typeof dateValue === "number") {
    const parsed = new Date(dateValue);
    return isValid(parsed) ? parsed : new Date();
  }

  return new Date();
};

const transformOrderToState = (order: TOrder): InternalOrderState => {
  const address = order.shippingAddress || {};

  return {
    id: order.orderNumber,
    createdAt: parseSafeDate(order.createdAt),
    reservationDate: parseSafeDate(order.estimatedDeliveryDate),
    status: order.status,
    overnight: order.items?.some((item) => item.keepOvernight) || false,
    isCorporate: order.invoiceType === "corporate",
    corporateNotes: order.adminNotes || "",
    customer: {
      name:
        order.user?.name ||
        `${address.firstName || ""} ${address.lastName || ""}`.trim() ||
        "Guest",
      firstName: address.firstName || "",
      lastName: address.lastName || "",
      email: order.user?.email || address.email || "N/A",
      phone: order.user?.phone || address.phone || "N/A",
      location: address.location || "N/A",
      streetAddress1: address.street || "N/A",
      streetAddress2: address.apartment || "",
      zip: address.zipCode || "N/A",
      deliveryTime: normalizeDeliveryLabel(address.deliveryTime),
      collectionTime: normalizeCollectionLabel(address.collectionTime),
      companyName: address.companyName || "N/A",
      accessibility:
        normalizeOptionValue(address.locationAccessibility || "", accessibilityOptions),
      placedIn: normalizeOptionValue(address.floorType || "", placementOptions),
      usedBy: normalizeOptionValue(address.userType || "", userOptions),
      occasion:
        HIRE_OCCASION_LABEL_MAP[address.hireOccasion || ""] ||
        address.hireOccasion ||
        "Birthday Party - Child",
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
    items: (order.items || []).map((p) => ({
      id: p.product?._id || p.productId || "",
      name: p.product?.name || p.name || "Unknown Product",
      price: `$${(p.price || 0).toFixed(2)}`,
      quantity: p.quantity || 0,
      total: `$${((p.price || 0) * (p.quantity || 0)).toFixed(2)}`,
      badges: ["For 1 Day"],
      secondaryBadge: "",
      days: 1,
      image:
        (Array.isArray(p.product?.imageCover)
          ? p.product.imageCover[0]
          : p.product?.imageCover) ||
        p.imageCover ||
        SampleImage.src,
      startDate: p.startDate ? new Date(p.startDate).toISOString() : undefined,
      endDate: p.endDate ? new Date(p.endDate).toISOString() : undefined,
    })),
    summary: {
      shippingCharge: `$${(order.deliveryFee || 0).toFixed(2)}`,
      overnightCharge: `$${(order.overnightFee || 0).toFixed(2)}`,
      placementCharge: `$${(order.placementFee || 0).toFixed(2)}`,
      couponCode: order.promoCode || "",
      couponAmount: `-$${(order.discountAmount || 0).toFixed(2)}`,
      totalAmount: `$${(order.totalAmount || 0).toFixed(2)}`,
    },
  };
};

export function OrderDetailsModal({
  open,
  onOpenChange,
  order: orderProp,
  extraFooterActions,
  hideAdminActions = false,
}: OrderDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [internalOrder, setInternalOrder] = useState<InternalOrderState | null>(
    null,
  );
  const [originalOrder, setOriginalOrder] = useState<InternalOrderState | null>(
    null,
  );
  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const [appliedPromoData, setAppliedPromoData] = useState<{
    discount: number;
    finalAmount: number;
    promoCode: string;
  } | null>(null);
  const [addProductsOpen, setAddProductsOpen] = useState(false);

  const { notify } = useAdminToast();
  const queryClient = useQueryClient();

  // Mutation for updating status
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      status,
      adminNotes,
    }: {
      status: string;
      adminNotes?: string;
    }) => {
      if (!orderProp?._id) throw new Error("Missing order ID");
      return orderServices.updateOrderStatus(orderProp._id, status, adminNotes);
    },
    onSuccess: async (data, variables) => {
      notify({
        title: "Order updated",
        message: `Order status changed to ${variables.status}`,
        variant: "success",
      });

      // Invalidate queries to refetch
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      await queryClient.invalidateQueries({ queryKey: ["revenueOverTime"] });

      // Don't close modal immediately - let the useEffect handle state update
      // onOpenChange(false);
    },
    onError: (error: any) => {
      notify({
        title: "Error",
        message: error?.response?.data?.message || "Failed to update status",
        variant: "error",
      });
    },
  });

  // Mutation for updating entire order
  const updateOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!orderProp?._id) throw new Error("Missing order ID");
      return orderServices.updateOrder(orderProp._id, data);
    },
    onSuccess: async () => {
      notify({
        title: "Order updated",
        message: "Order details saved successfully",
        variant: "success",
      });

      // Invalidate queries to refetch
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      await queryClient.invalidateQueries({ queryKey: ["revenueOverTime"] });

      setIsEditing(false);
      // Don't close modal - let the user see the updated data
      // onOpenChange(false);
    },
    onError: (error: any) => {
      notify({
        title: "Error",
        message: error?.response?.data?.message || "Failed to update order",
        variant: "error",
      });
    },
  });

  // Update local state when orderProp changes
  useEffect(() => {
    if (orderProp) {
      try {
        const transformed = transformOrderToState(orderProp);
        setInternalOrder(transformed);
        setOriginalOrder(transformed);
        setCouponApplied(Boolean(transformed.summary.couponCode));
        setAppliedPromoData(
          transformed.summary.couponCode
            ? {
                discount: Math.abs(
                  parseFloat(
                    transformed.summary.couponAmount.replace(/[^0-9.-]+/g, ""),
                  ) || 0,
                ),
                finalAmount: parseFloat(
                  transformed.summary.totalAmount.replace(/[^0-9.-]+/g, ""),
                ),
                promoCode: transformed.summary.couponCode,
              }
            : null,
        );
      } catch (error) {
        console.error("Error transforming order:", error);
        // Set defaults if transformation fails
        setInternalOrder(null);
        setOriginalOrder(null);
      }
    } else {
      setInternalOrder(null);
      setOriginalOrder(null);
    }
  }, [orderProp]);

  // Reset editing state when modal closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setCouponInput("");
      setCouponApplied(false);
      setAppliedPromoData(null);
    }
  }, [open]);

  if (!internalOrder) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Loading order...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const customerFullName = internalOrder.customer.name.trim();
  const nameParts = customerFullName.split(/\s+/).filter(Boolean);
  const customerFirstName =
    internalOrder.customer.firstName || nameParts[0] || "";
  const customerLastName =
    internalOrder.customer.lastName || nameParts.slice(1).join(" ");
  const handleCustomerNamePartChange = (
    part: "first" | "last",
    value: string,
  ) => {
    const nextFirst = part === "first" ? value : customerFirstName;
    const nextLast = part === "last" ? value : customerLastName;
    const nextFullName = [nextFirst, nextLast].filter(Boolean).join(" ");
    handleCustomerChange("name", nextFullName || "Guest");
    handleCustomerChange("firstName", nextFirst);
    handleCustomerChange("lastName", nextLast);
  };

  const parseCurrencyValue = (value: string) => {
    if (!value) return 0;
    const multiplierMatch = value.match(/(\d+)\s*[×x]\s*\$?\s*([0-9.]+)/i);
    if (multiplierMatch) {
      const qty = Number(multiplierMatch[1]);
      const amount = Number(multiplierMatch[2]);
      return Number.isFinite(qty) && Number.isFinite(amount) ? qty * amount : 0;
    }
    const moneyMatches = value.match(/-?\$?\s*([0-9]+(?:\.[0-9]+)?)/g) || [];
    const dollarMatches = moneyMatches.filter((m) => m.includes("$"));
    const raw = (dollarMatches[dollarMatches.length - 1] || moneyMatches[moneyMatches.length - 1] || "")
      .replace(/[^0-9.-]+/g, "");
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const calculateTotal = (
    items: OrderItem[],
    couponAmount: string,
    shippingCharge: string,
    overnightCharge: string,
    placementCharge: string,
  ) => {
    const subtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.total.replace("$", "")) || 0);
    }, 0);

    const shippingValue = parseCurrencyValue(shippingCharge);
    const overnightValue = parseCurrencyValue(overnightCharge);
    const placementValue = parseCurrencyValue(placementCharge);
    const couponValue = parseCurrencyValue(couponAmount);
    const couponDiscount = Math.abs(couponValue);

    return (
      subtotal +
      shippingValue +
      overnightValue +
      placementValue -
      couponDiscount
    );
  };

  const handleEditToggle = () => {
    if (isEditing && originalOrder) {
      setInternalOrder(originalOrder);
      setCouponInput("");
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => {
    if (!internalOrder) return;

    const firstName =
      internalOrder.customer.firstName.trim() || customerFirstName.trim();
    const lastName =
      internalOrder.customer.lastName.trim() || customerLastName.trim();

    const mappedOccasion =
      HIRE_OCCASION_VALUE_MAP[internalOrder.customer.occasion] ||
      "birthdayPartyKid";

    const isValidObjectId = (value?: string) =>
      !!value && /^[a-fA-F0-9]{24}$/.test(value);

    const itemsPayload = internalOrder.items
      .filter((item) => isValidObjectId(item.id))
      .map((item) => ({
        product: item.id,
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price.replace(/[^0-9.-]+/g, "")),
        hireOccasion: mappedOccasion,
        keepOvernight: internalOrder.overnight,
        startDate: item.startDate,
        endDate: item.endDate,
      }));

    const payload = {
      estimatedDeliveryDate: internalOrder.reservationDate.toISOString(),
      status: internalOrder.status,
      invoiceType: internalOrder.isCorporate ? "corporate" : "regular",
      adminNotes: internalOrder.customer.notes,
      promoCode: internalOrder.summary.couponCode || "",
      discountAmount: Math.abs(
        parseFloat(
          internalOrder.summary.couponAmount.replace(/[^0-9.-]+/g, ""),
        ) || 0,
      ),
      shippingAddress: {
        firstName,
        lastName,
        email: internalOrder.customer.email,
        phone: internalOrder.customer.phone,
        location: internalOrder.shipping.location,
        street: internalOrder.shipping.street1,
        apartment: internalOrder.shipping.street2,
        city: internalOrder.shipping.city,
        country: internalOrder.shipping.county,
        zipCode: internalOrder.shipping.zip,
        deliveryTime: normalizeDeliveryTimeValue(
          internalOrder.customer.deliveryTime,
        ),
        collectionTime: normalizeCollectionTimeValue(
          internalOrder.customer.collectionTime,
        ),
        companyName: internalOrder.customer.companyName,
        locationAccessibility: internalOrder.customer.accessibility,
        floorType: internalOrder.customer.placedIn,
        userType: internalOrder.customer.usedBy,
        hireOccasion: mappedOccasion,
        notes: internalOrder.customer.notes,
        keepOvernight: internalOrder.overnight,
      },
      totalAmount: parseFloat(
        internalOrder.summary.totalAmount.replace(/[^0-9.-]+/g, ""),
      ),
    };

    if (itemsPayload.length > 0) {
      (payload as any).items = itemsPayload;
    }

    updateOrderMutation.mutate(payload);
  };

  const handleDiscard = () => {
    if (originalOrder) {
      setInternalOrder(originalOrder);
    }
    setCouponInput("");
    setIsEditing(false);
  };

  const handleConfirmOrder = () => {
    updateStatusMutation.mutate({ status: "confirmed" });
  };

  const handleDownloadInvoice = () => {
    if (orderProp) {
      generateInvoice(orderProp);
    }
  };

  const handleCancelOrder = () => {
    updateStatusMutation.mutate({
      status: "cancelled",
      adminNotes: "Cancelled by admin",
    });
  };

  const handleCustomerChange = (
    field: keyof InternalOrderState["customer"],
    value: string,
  ) => {
    setInternalOrder((prev) =>
      prev
        ? {
            ...prev,
            customer: {
              ...prev.customer,
              [field]: value,
            },
          }
        : null,
    );
  };

  const handleShippingChange = (
    field: keyof InternalOrderState["shipping"],
    value: string,
  ) => {
    setInternalOrder((prev) =>
      prev
        ? {
            ...prev,
            shipping: {
              ...prev.shipping,
              [field]: value,
            },
          }
        : null,
    );
  };

  const handleDateChange = (
    field: "createdAt" | "reservationDate",
    date: Date | undefined,
  ) => {
    if (date && isValid(date)) {
      setInternalOrder((prev) =>
        prev
          ? {
              ...prev,
              [field]: date,
            }
          : null,
      );
    }
  };

  const handleStatusChange = (status: OrderStatus) => {
    setInternalOrder((prev) => (prev ? { ...prev, status } : null));
  };

  const handleOvernightChange = (checked: boolean) => {
    setInternalOrder((prev) => {
      if (!prev) return null;
      const newOvernightCharge = checked ? "$60.00" : "$0.00";
      const newTotal = calculateTotal(
        prev.items,
        prev.summary.couponAmount,
        prev.summary.shippingCharge,
        newOvernightCharge,
        prev.summary.placementCharge,
      );

      return {
        ...prev,
        overnight: checked,
        summary: {
          ...prev.summary,
          overnightCharge: newOvernightCharge,
          totalAmount: `$${newTotal.toFixed(2)}`,
        },
      };
    });
  };

  const handleCorporateChange = (checked: boolean) => {
    setInternalOrder((prev) =>
      prev ? { ...prev, isCorporate: checked } : null,
    );
  };

  const handleCorporateNotesChange = (value: string) => {
    setInternalOrder((prev) =>
      prev ? { ...prev, corporateNotes: value } : null,
    );
  };

  const handleItemDaysChange = (id: string, change: number) => {
    setInternalOrder((prev) => {
      if (!prev) return null;
      const newItems = prev.items.map((item) => {
        if (item.id === id) {
          const newDays = Math.max(1, item.days + change);
          const priceNum =
            parseFloat(item.price.replace(/[^0-9.-]+/g, "")) || 0;
          const newTotal = `$${(priceNum * item.quantity * newDays).toFixed(2)}`;
          const newBadge = `For ${newDays} Day${newDays > 1 ? "s" : ""}`;

          return {
            ...item,
            days: newDays,
            badges: [newBadge],
            total: newTotal,
          };
        }
        return item;
      });

      const newTotal = calculateTotal(
        newItems,
        prev.summary.couponAmount,
        prev.summary.shippingCharge,
        prev.summary.overnightCharge,
        prev.summary.placementCharge,
      );

      return {
        ...prev,
        items: newItems,
        summary: {
          ...prev.summary,
          totalAmount: `$${newTotal.toFixed(2)}`,
        },
      };
    });
  };

  const handleDeleteItem = (id: string) => {
    if (internalOrder && internalOrder.items.length > 1) {
      setInternalOrder((prev) => {
        if (!prev) return null;
        const newItems = prev.items.filter((item) => item.id !== id);
        const newTotal = calculateTotal(
          newItems,
          prev.summary.couponAmount,
          prev.summary.shippingCharge,
          prev.summary.overnightCharge,
          prev.summary.placementCharge,
        );

        return {
          ...prev,
          items: newItems,
          summary: {
            ...prev.summary,
            totalAmount: `$${newTotal.toFixed(2)}`,
          },
        };
      });
    }
  };

  const handleAddProduct = () => {
    setAddProductsOpen(true);
  };

  const handleAddProductsToOrder = (
    items: Array<{ product: { _id?: string; id?: string; name?: string; price?: number; imageCover?: string; images?: string[] }; quantity: number }>,
  ) => {
    setInternalOrder((prev) => {
      if (!prev) return prev;
      const referenceItem = prev.items[0];
      const startDate =
        referenceItem?.startDate || prev.reservationDate.toISOString();
      const endDate = referenceItem?.endDate || startDate;

      const nextItems = [...prev.items];

      items.forEach(({ product, quantity }) => {
        const productId = (product._id || product.id || "") as string;
        if (!productId) return;
        const existingIndex = nextItems.findIndex((it) => it.id === productId);
        const priceNum = typeof product.price === "number" ? product.price : 0;
        const image =
          (Array.isArray(product.imageCover)
            ? product.imageCover[0]
            : product.imageCover) ||
          (Array.isArray(product.images) ? product.images[0] : undefined) ||
          SampleImage.src;

        if (existingIndex >= 0) {
          const existing = nextItems[existingIndex];
          const newQty = existing.quantity + quantity;
          const total = `$${(priceNum * newQty * existing.days).toFixed(2)}`;
          nextItems[existingIndex] = {
            ...existing,
            quantity: newQty,
            total,
          };
        } else {
          nextItems.push({
            id: productId,
            name: product.name || "Unknown Product",
            price: `$${priceNum.toFixed(2)}`,
            quantity,
            total: `$${(priceNum * quantity).toFixed(2)}`,
            badges: ["For 1 Day"],
            secondaryBadge: "",
            days: 1,
            image,
            startDate,
            endDate,
          });
        }
      });

      const newTotal = calculateTotal(
        nextItems,
        prev.summary.couponAmount,
        prev.summary.shippingCharge,
        prev.summary.overnightCharge,
        prev.summary.placementCharge,
      );

      return {
        ...prev,
        items: nextItems,
        summary: {
          ...prev.summary,
          totalAmount: `$${newTotal.toFixed(2)}`,
        },
      };
    });
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || !internalOrder) {
      notify({
        title: "Coupon code required",
        message: "Please enter a coupon code",
        variant: "error",
      });
      return;
    }

    setIsApplyingCoupon(true);

    try {
      const subtotal = internalOrder.items.reduce((sum, item) => {
        const total = parseFloat(item.total.replace(/[^0-9.-]+/g, "")) || 0;
        return sum + total;
      }, 0);
      const shippingCharge =
        parseFloat(
          internalOrder.summary.shippingCharge.replace(/[^0-9.-]+/g, ""),
        ) || 0;
      const overnightCharge =
        parseFloat(
          internalOrder.summary.overnightCharge.replace(/[^0-9.-]+/g, ""),
        ) || 0;
      const placementCharge =
        parseFloat(
          internalOrder.summary.placementCharge.replace(/[^0-9.-]+/g, ""),
        ) || 0;
      const orderAmount =
        subtotal + shippingCharge + overnightCharge + placementCharge;

      const response = await applyPromoCode({
        promo: couponInput.trim(),
        orderAmount,
      });

      if (response.success) {
        setAppliedPromoData({
          discount: response.discount,
          finalAmount: response.finalAmount,
          promoCode: couponInput.trim(),
        });
        setCouponApplied(true);

        const newCouponAmount = `-$${response.discount.toFixed(2)}`;
        const newTotal = calculateTotal(
          internalOrder.items,
          newCouponAmount,
          internalOrder.summary.shippingCharge,
          internalOrder.summary.overnightCharge,
          internalOrder.summary.placementCharge,
        );

        setInternalOrder((prev) =>
          prev
            ? {
                ...prev,
                summary: {
                  ...prev.summary,
                  couponCode: couponInput.trim(),
                  couponAmount: newCouponAmount,
                  totalAmount: `$${newTotal.toFixed(2)}`,
                },
              }
            : prev,
        );

        notify({
          title: "Coupon applied",
          message: response.message || "Promo code applied successfully",
          variant: "success",
        });
      }
    } catch (error: any) {
      notify({
        title: "Failed to apply coupon",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to apply promo code",
        variant: "error",
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleCancelCoupon = () => {
    setCouponApplied(false);
    setAppliedPromoData(null);
    setCouponInput("");
    setInternalOrder((prev) => {
      if (!prev) return null;
      const newTotal = calculateTotal(
        prev.items,
        "$0",
        prev.summary.shippingCharge,
        prev.summary.overnightCharge,
        prev.summary.placementCharge,
      );
      return {
        ...prev,
        summary: {
          ...prev.summary,
          couponCode: "",
          couponAmount: "$0",
          totalAmount: `$${newTotal.toFixed(2)}`,
        },
      };
    });
    notify({
      title: "Coupon removed",
      message: "Promo code removed",
      variant: "success",
    });
  };

  const getStatusStyle = (status: OrderStatus) => {
    const styles: Record<OrderStatus, { text: string; dot: string }> = {
      pending: {
        text: "text-amber-700",
        dot: "bg-amber-500",
      },
      confirmed: {
        text: "text-blue-700",
        dot: "bg-blue-500",
      },
      shipped: {
        text: "text-purple-700",
        dot: "bg-purple-500",
      },
      delivered: {
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      },
      cancelled: {
        text: "text-red-700",
        dot: "bg-red-500",
      },
    };
    return styles[status];
  };

  const st = getStatusStyle(internalOrder.status);

  // Safe date formatting helper
  const formatSafeDate = (date: Date, formatStr: string): string => {
    try {
      if (!isValid(date)) return "Invalid date";
      return format(date, formatStr);
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid date";
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "w-[70vw] max-w-[70vw] sm:w-[70vw] sm:max-w-[70vw] max-h-[90vh] font-inter p-0 gap-0",
            "overflow-hidden rounded-2xl border border-slate-200 flex flex-col",
          )}
        >
          <DialogClose asChild>
            <button
              type="button"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-brand-black-950 hover:bg-white hover:shadow-sm focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-slate-300 z-50"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogClose>

          {/* HEADER STRIP */}
          <DialogHeader className="border-b border-slate-200 pt-5 pb-6">
            {/* Title row */}
            <div className="flex items-start justify-between border-b border-slate-200 px-6 pb-4 bg-brand-gray-50 -mt-6 pt-6">
              <div className="space-y-0.5">
                <DialogTitle className="text-lg font-semibold leading-none tracking-[0.01em] text-slate-900">
                  #{internalOrder.id}
                </DialogTitle>
                <p className="text-sm leading-none text-slate-500 mt-2">
                  Order Details {isEditing && "(Editing)"}
                </p>
              </div>
            </div>

            {/* Meta row */}
            <div className="mt-4 flex items-center gap-10 text-slate-900 px-6">
              {/* Created at */}
              <div className="space-y-[2px]">
                <div className="text-sm text-slate-500">Created at</div>
                {isEditing ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-4 h-8 px-3 font-inter",
                          !internalOrder.createdAt && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {isValid(internalOrder.createdAt)
                          ? formatSafeDate(internalOrder.createdAt, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 font-inter"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={internalOrder.createdAt}
                        onSelect={(date) => handleDateChange("createdAt", date)}
                        initialFocus
                        className="font-inter"
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="text-sm font-medium mt-4">
                    {formatSafeDate(internalOrder.createdAt, "MMM dd, yyyy")}
                  </div>
                )}
              </div>

              {/* Reservation date */}
              <div className="space-y-[2px]">
                <div className="text-sm text-slate-500">Reservation date</div>
                {isEditing ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-4 h-8 px-3 font-inter",
                          !internalOrder.reservationDate &&
                            "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {isValid(internalOrder.reservationDate)
                          ? formatSafeDate(internalOrder.reservationDate, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 font-inter"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={internalOrder.reservationDate}
                        onSelect={(date) =>
                          handleDateChange("reservationDate", date)
                        }
                        initialFocus
                        className="font-inter"
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="text-sm font-medium mt-4">
                    {formatSafeDate(
                      internalOrder.reservationDate,
                      "MMM dd, yyyy",
                    )}
                  </div>
                )}
              </div>

              {/* Order status */}
              <div className="space-y-[2px]">
                <div className="text-sm text-slate-500">Order status</div>
                {isEditing ? (
                  <Select
                    value={internalOrder.status}
                    onValueChange={(value: OrderStatus) =>
                      handleStatusChange(value)
                    }
                  >
                    <SelectTrigger className="w-[120px] h-8 mt-4 font-inter">
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
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-[3px] text-[12px] font-semibold mt-4 shadow-[0px_1px_2px_var(--alpha-ink-900-5)]",
                      st.text,
                      "border-slate-200 capitalize",
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full", st.dot)} />
                    {internalOrder.status}
                  </span>
                )}
              </div>

              {/* Overnight */}
              <div className="space-y-[2px]">
                <div className="text-sm text-slate-500">Overnight</div>
                {isEditing ? (
                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox
                      id="overnight"
                      checked={internalOrder.overnight}
                      onCheckedChange={handleOvernightChange}
                    />
                    <label
                      htmlFor="overnight"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Keeping Overnight
                    </label>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-sm border border-slate-300 bg-white px-2.5 py-[3px] text-[12px] font-medium mt-4 text-slate-800">
                    <span className="h-2 w-2 rounded-full bg-slate-900" />
                    {internalOrder.overnight ? "Yes" : "No"}
                  </span>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* BODY: scrollable area */}
          <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="px-6 py-5 text-[12px] text-slate-900 space-y-6">
              {/* CUSTOMER & BOOKING DETAILS */}
              <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm">
                <div className="space-y-5">
                  <EditableDetailRow
                    label="First name"
                    value={customerFirstName}
                    editing={isEditing}
                    onChange={(value) =>
                      handleCustomerNamePartChange("first", value)
                    }
                  />
                  <EditableDetailRow
                    label="Last name"
                    value={customerLastName}
                    editing={isEditing}
                    onChange={(value) =>
                      handleCustomerNamePartChange("last", value)
                    }
                  />
                  <EditableDetailRow
                    label="Email"
                    value={internalOrder.customer.email}
                    editing={isEditing}
                    onChange={(value) => handleCustomerChange("email", value)}
                  />
                  <EditableDetailRow
                    label="Phone"
                    value={internalOrder.customer.phone}
                    editing={isEditing}
                    onChange={(value) => handleCustomerChange("phone", value)}
                  />
                  <EditableDetailRow
                    label="Location"
                    value={internalOrder.customer.location}
                    editing={isEditing}
                    onChange={(value) =>
                      handleCustomerChange("location", value)
                    }
                  />
                  <EditableDetailRow
                    label="Street address"
                    value={internalOrder.customer.streetAddress1}
                    multiline
                    editing={isEditing}
                    onChange={(value) =>
                      handleCustomerChange("streetAddress1", value)
                    }
                  />
                  <EditableDetailRow
                    label="Street address"
                    value={internalOrder.customer.streetAddress2}
                    editing={isEditing}
                    onChange={(value) =>
                      handleCustomerChange("streetAddress2", value)
                    }
                  />
                  <EditableDetailRow
                    label="Zip code"
                    value={internalOrder.customer.zip}
                    editing={isEditing}
                    onChange={(value) => handleCustomerChange("zip", value)}
                  />

                  {/* Delivery Time Dropdown */}
                  <div className="flex gap-16">
                    <div className="w-40 text-[12px] text-slate-500">
                      Delivery time
                    </div>
                    {isEditing ? (
                      <Select
                        value={internalOrder.customer.deliveryTime}
                        onValueChange={(value) =>
                          handleCustomerChange("deliveryTime", value)
                        }
                      >
                        <SelectTrigger className="w-[140px] h-8 font-inter">
                          <SelectValue className="font-inter" />
                        </SelectTrigger>
                        <SelectContent className="font-inter">
                          {deliveryTimeOptions.map((time) => (
                            <SelectItem
                              key={time}
                              value={time}
                              className="font-inter"
                            >
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex-1 text-[13px] text-slate-900">
                        {internalOrder.customer.deliveryTime}
                      </div>
                    )}
                  </div>

                  {/* Collection Time Dropdown */}
                  <div className="flex gap-16">
                    <div className="w-40 text-[12px] text-slate-500">
                      Collection time
                    </div>
                    {isEditing ? (
                      <Select
                        value={internalOrder.customer.collectionTime}
                        onValueChange={(value) =>
                          handleCustomerChange("collectionTime", value)
                        }
                      >
                        <SelectTrigger className="w-[140px] h-8 font-inter">
                          <SelectValue className="font-inter" />
                        </SelectTrigger>
                        <SelectContent className="font-inter">
                          {collectionTimeOptions.map((time) => (
                            <SelectItem
                              key={time}
                              value={time}
                              className="font-inter"
                            >
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex-1 text-[13px] text-slate-900">
                        {internalOrder.customer.collectionTime}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <EditableDetailRow
                    label="Company name"
                    value={internalOrder.customer.companyName}
                    editing={isEditing}
                    onChange={(value) =>
                      handleCustomerChange("companyName", value)
                    }
                  />

                  {/* Location Accessibility Dropdown */}
                  <div className="flex gap-16">
                    <div className="w-40 text-[12px] text-slate-500">
                      Location accessibility
                    </div>
                    {isEditing ? (
                      <Select
                        value={internalOrder.customer.accessibility}
                        onValueChange={(value) =>
                          handleCustomerChange("accessibility", value)
                        }
                      >
                        <SelectTrigger className="w-full max-w-[280px] h-8 font-inter">
                          <SelectValue className="font-inter" />
                        </SelectTrigger>
                        <SelectContent className="font-inter">
                          {accessibilityOptions.map((option) => (
                            <SelectItem
                              key={option}
                              value={option}
                              className="font-inter"
                            >
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex-1 text-[13px] text-slate-900 max-w-[280px]">
                        {internalOrder.customer.accessibility}
                      </div>
                    )}
                  </div>

                  {/* Product Placement Dropdown */}
                  <div className="flex gap-16">
                    <div className="w-40 text-[12px] text-slate-500">
                      Product will be placed in
                    </div>
                    {isEditing ? (
                      <Select
                        value={internalOrder.customer.placedIn}
                        onValueChange={(value) =>
                          handleCustomerChange("placedIn", value)
                        }
                      >
                        <SelectTrigger className="w-full max-w-[280px] h-8 font-inter">
                          <SelectValue className="font-inter" />
                        </SelectTrigger>
                        <SelectContent className="font-inter">
                          {placementOptions.map((option) => (
                            <SelectItem
                              key={option}
                              value={option}
                              className="font-inter"
                            >
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex-1 text-[13px] text-slate-900 max-w-[280px]">
                        {internalOrder.customer.placedIn}
                      </div>
                    )}
                  </div>

                  {/* Used By Dropdown */}
                  <div className="flex gap-16">
                    <div className="w-40 text-[12px] text-slate-500">
                      Product will be used by
                    </div>
                    {isEditing ? (
                      <Select
                        value={internalOrder.customer.usedBy}
                        onValueChange={(value) =>
                          handleCustomerChange("usedBy", value)
                        }
                      >
                        <SelectTrigger className="w-full max-w-[280px] h-8 font-inter">
                          <SelectValue className="font-inter" />
                        </SelectTrigger>
                        <SelectContent className="font-inter">
                          {userOptions.map((option) => (
                            <SelectItem
                              key={option}
                              value={option}
                              className="font-inter"
                            >
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex-1 text-[13px] text-slate-900 max-w-[280px]">
                        {internalOrder.customer.usedBy}
                      </div>
                    )}
                  </div>

                  {/* Occasion Dropdown */}
                  <div className="flex gap-16">
                    <div className="w-40 text-[12px] text-slate-500">
                      Hire occasion
                    </div>
                    {isEditing ? (
                      <Select
                        value={internalOrder.customer.occasion}
                        onValueChange={(value) =>
                          handleCustomerChange("occasion", value)
                        }
                      >
                        <SelectTrigger className="w-full max-w-[280px] h-8 font-inter">
                          <SelectValue className="font-inter" />
                        </SelectTrigger>
                        <SelectContent className="font-inter">
                          {occasionOptions.map((option) => (
                            <SelectItem
                              key={option}
                              value={option}
                              className="font-inter"
                            >
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex-1 text-[13px] text-slate-900 max-w-[280px]">
                        {internalOrder.customer.occasion}
                      </div>
                    )}
                  </div>

                  {/* Notes Textarea */}
                  <div className="flex gap-16">
                    <div className="w-40 text-[12px] text-slate-500">Notes</div>
                    {isEditing ? (
                      <Textarea
                        value={internalOrder.customer.notes}
                        onChange={(e) =>
                          handleCustomerChange("notes", e.target.value)
                        }
                        className="w-full max-w-[280px] min-h-[80px] text-[13px] font-inter"
                        placeholder="Add notes..."
                      />
                    ) : (
                      <div className="flex-1 text-[13px] text-slate-900 max-w-[280px] leading-5 whitespace-pre-wrap">
                        {internalOrder.customer.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SHIPPING INFORMATION */}
              <div className="pt-5 border-t border-slate-200">
                <p className="mb-4 text-sm font-semibold text-slate-700">
                  Shipping Information
                </p>
                <div className="space-x-16 space-y-5 text-sm">
                  <EditableDetailRow
                    label="Location"
                    value={internalOrder.shipping.location}
                    editing={isEditing}
                    onChange={(value) =>
                      handleShippingChange("location", value)
                    }
                  />
                  <EditableDetailRow
                    label="Street address"
                    value={internalOrder.shipping.street1}
                    multiline
                    editing={isEditing}
                    onChange={(value) => handleShippingChange("street1", value)}
                  />
                  <EditableDetailRow
                    label="Street address"
                    value={internalOrder.shipping.street2}
                    editing={isEditing}
                    onChange={(value) => handleShippingChange("street2", value)}
                  />
                  <EditableDetailRow
                    label="Town/City"
                    value={internalOrder.shipping.city}
                    editing={isEditing}
                    onChange={(value) => handleShippingChange("city", value)}
                  />
                  <EditableDetailRow
                    label="State/County"
                    value={internalOrder.shipping.county}
                    editing={isEditing}
                    onChange={(value) => handleShippingChange("county", value)}
                  />
                  <EditableDetailRow
                    label="Zip code"
                    value={internalOrder.shipping.zip}
                    editing={isEditing}
                    onChange={(value) => handleShippingChange("zip", value)}
                  />
                </div>
              </div>

              {/* ITEMS */}
              <div className="pt-5 border-t border-slate-200">
                {/* Sticky header for product details */}
                <div className="sticky top-0 z-10 bg-white pb-2">
                  <p className="text-sm font-semibold text-slate-700">
                    Product Details
                  </p>
                  <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] items-center text-sm font-medium text-slate-600 pt-3 w-full">
                    <div>Items</div>
                    <div className="text-right">Price</div>
                    <div className="text-right">Total</div>
                  </div>
                </div>

                {/* Items */}
                <div className="w-full text-sm">
                  {internalOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] items-center gap-2 py-4 group"
                    >
                      {/* Item left section */}
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Delete button on left side */}
                        {isEditing && (
                          <Button
                            size="icon"
                            className="h-6 w-6 rounded-md border p-4 shadow shrink-0 mt-2 bg-transparent hover:bg-transparent"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3 text-black" />
                          </Button>
                        )}

                        {/* Product image */}
                        <div className="relative">
                          <div className="relative h-[56px] w-[56px] overflow-hidden rounded-[6px] bg-brand-emerald-520 shrink-0">
                            <Image
                              src={Array.isArray(item.image) ? item.image[0] : item.image}
                              alt={item.name}
                              width={82}
                              height={82}
                              className="object-cover"
                            />
                          </div>
                        </div>

                        {/* Name + badges */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[13px] text-slate-900 leading-[1.25]">
                            {item.name}
                          </span>

                          <div className="flex flex-col items-start gap-1">
                            {item.badges.map((b) => (
                              <div key={b} className="flex items-center gap-1">
                                {isEditing ? (
                                  <>
                                    <Button
                                      size="icon"
                                      className="h-5 w-5 border-none bg-transparent"
                                      onClick={() =>
                                        handleItemDaysChange(item.id, -1)
                                      }
                                    >
                                      <Minus className="h-3 w-3 text-black" />
                                    </Button>
                                    <span className="inline-flex rounded-[4px] border border-slate-300 bg-white px-2 py-[2px] text-[11px] text-slate-700 min-w-[70px] justify-center">
                                      {b}
                                    </span>
                                    <Button
                                      size="icon"
                                      className="h-5 w-5 border-none bg-transparent"
                                      onClick={() =>
                                        handleItemDaysChange(item.id, 1)
                                      }
                                    >
                                      <Plus className="h-3 w-3 text-black" />
                                    </Button>
                                  </>
                                ) : (
                                  <span className="inline-flex rounded-[4px] border border-slate-300 bg-white px-2 py-[2px] text-[11px] text-slate-700">
                                    {b}
                                  </span>
                                )}
                              </div>
                            ))}

                            {item.secondaryBadge && (
                              <span className="inline-flex items-center rounded-[4px] border border-red-300 px-2 py-[1px] text-[12px] font-medium text-red-600">
                                {item.secondaryBadge}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-[13px] text-slate-900 text-right">
                        {item.price}
                      </div>

                      {/* Total */}
                      <div className="text-[13px] text-slate-900 text-right font-medium">
                        {item.total}
                      </div>
                    </div>
                  ))}

                  {/* Add Product Button */}
                  {isEditing && (
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        className="h-8 gap-1 font-inter"
                        onClick={handleAddProduct}
                      >
                        <Plus className="h-4 w-4" />
                        Add Product
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* SUMMARY */}
              <div className="pt-5 border-t border-slate-200 space-y-5 text-sm">
                <SummaryRow
                  label="Shipping charge"
                  value={internalOrder.summary.shippingCharge}
                />
                <SummaryRow
                  label="Overnight charge"
                  value={internalOrder.summary.overnightCharge}
                />
                <SummaryRow
                  label="Outdoor placement fee"
                  value={internalOrder.summary.placementCharge}
                />
                <SummaryRow
                  label={
                    <>
                      Coupon Code{" "}
                      {internalOrder.summary.couponCode ? (
                        <>
                          <span className="mx-1">•</span>{" "}
                          <span className="font-medium">
                            {internalOrder.summary.couponCode}
                          </span>
                        </>
                      ) : null}
                    </>
                  }
                  value={internalOrder.summary.couponAmount}
                />

                {/* Apply Discount Input */}
                {isEditing && (
                  <div className="flex items-center gap-2 pt-2">
                    {couponApplied ? (
                      <>
                        <div className="flex-1 text-[12px] text-slate-600">
                          Coupon Applied ({appliedPromoData?.promoCode})
                        </div>
                        <button
                          className="h-8 text-sm px-3 text-red-500 font-medium font-inter"
                          onClick={handleCancelCoupon}
                        >
                          Remove Coupon
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 max-w-[200px]">
                          <Input
                            placeholder="Enter coupon code"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            className="h-8 text-[13px] font-inter"
                            disabled={isApplyingCoupon}
                          />
                        </div>
                        <button
                          className="h-8 text-sm px-3 text-brand-blue-500 font-medium font-inter disabled:opacity-50"
                          onClick={handleApplyCoupon}
                          disabled={isApplyingCoupon || !couponInput.trim()}
                        >
                          {isApplyingCoupon ? "Applying..." : "Apply Coupon"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-5 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                  <span>Total amount</span>
                  <span>{internalOrder.summary.totalAmount}</span>
                </div>
              </div>

              {/* CORPORATE CHECKBOX */}
              <div className="pt-5 border-t border-slate-200">
                <label className="flex items-center gap-2 text-sm text-slate-800 font-inter cursor-pointer">
                  <Checkbox
                    id="corporate"
                    checked={internalOrder.isCorporate}
                    onCheckedChange={handleCorporateChange}
                    className="h-[14px] w-[14px]"
                    disabled={!isEditing}
                  />
                  <span>Mark as corporate order.</span>
                </label>
                {internalOrder.isCorporate && (
                  <div className="mt-3">
                    <Textarea
                      value={internalOrder.corporateNotes}
                      onChange={(e) =>
                        handleCorporateNotesChange(e.target.value)
                      }
                      placeholder="Enter payment details and any additional information you want included in the corporate invoice."
                      className="min-h-[72px] w-full max-w-[520px] resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-[12px] leading-5 text-slate-600 placeholder:text-slate-400 font-inter"
                      disabled={!isEditing}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FOOTER BUTTONS */}
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3">
            {isEditing ? (
              <>
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="outline"
                    className="h-9 rounded-[6px] border-slate-300 px-3 text-[13px] font-medium text-slate-800 bg-white font-inter"
                    onClick={handleDiscard}
                    disabled={updateOrderMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Discard Changes
                  </Button>
                  <Button
                    className="h-9 rounded-[6px] bg-brand-orange-500 px-4 text-[13px] font-semibold text-white hover:bg-brand-orange-450 font-inter"
                    onClick={handleSaveChanges}
                    disabled={updateOrderMutation.isPending}
                  >
                    {updateOrderMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <CircleCheck className="h-4 w-4 mr-1" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </>
            ) : (
              <>
                {!hideAdminActions && (
                  <Button
                    variant="outline"
                    className="h-9 rounded-[6px] border-slate-300 px-3 text-[13px] font-medium text-slate-800 bg-white font-inter"
                    onClick={handleCancelOrder}
                    disabled={updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <PackageXIcon className="h-4 w-4 mr-1" />
                    )}
                    Cancel Order
                  </Button>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-9 rounded-[6px] border-slate-300 px-3 text-[13px] font-medium text-slate-800 bg-white font-inter"
                    onClick={handleEditToggle}
                  >
                    <Edit3 className="mr-1 h-4 w-4" />
                    Edit Order
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 rounded-[6px] border-slate-300 px-3 text-[13px] font-medium text-slate-800 bg-white font-inter"
                    onClick={handleDownloadInvoice}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Invoice
                  </Button>
                  {extraFooterActions}
                  {!hideAdminActions && (
                    <Button
                      className="h-9 rounded-[6px] bg-brand-orange-500 px-4 text-[13px] font-semibold text-white hover:bg-brand-orange-450 font-inter"
                      onClick={handleConfirmOrder}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <PackagePlus className="h-4 w-4 mr-1" />
                      )}
                      Confirm Order
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Products Modal */}
      <AddProductsModal
        open={addProductsOpen}
        onOpenChange={setAddProductsOpen}
        onAddProducts={handleAddProductsToOrder}
      />
    </>
  );
}

function DetailRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex gap-16">
      <div className="w-40 text-[12px] text-slate-500">{label}</div>
      <div
        className={cn(
          "flex-1 text-[13px] text-slate-900",
          multiline && "max-w-[280px] leading-5",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function EditableDetailRow({
  label,
  value,
  multiline,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  editing: boolean;
  onChange: (value: string) => void;
}) {
  if (!editing) {
    return <DetailRow label={label} value={value} multiline={multiline} />;
  }

  return (
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
          className="flex-1 text-[13px] text-slate-900 border rounded px-2 py-1 h-8 max-w-[200px] font-inter"
        />
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: React.ReactNode;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-[12px] text-slate-800 font-inter">
      <span className="text-slate-600">{label}</span>
      <span>{value}</span>
    </div>
  );
}
