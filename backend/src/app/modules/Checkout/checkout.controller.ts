// src/controllers/checkout.controller.ts
import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import mongoose, { Types } from "mongoose";
import ApiError from "../../utils/apiError";
import Order from "../../modules/Order/order.model";
import Product from "../../modules/Product/product.model";
import type { IOrderItemExtra } from "../../modules/Order/order.interface";
import { DeliveryTimeManager, PlacementFeeManager } from "../../modules/Order/order.interface";
import User from "../../modules/Auth/user.model";
import bcrypt from "bcryptjs";
import { PromoService } from "../../modules/promos/promos.service";
import crypto from "crypto";
import {
  sendOrderReceivedEmail,
  sendOrderNotificationToAdmin,
  sendUserCredentialsEmail,
  sendOrderConfirmedEmail,
  sendOrderCancellationEmail,
  sendDeliveryReminderEmail,
} from "./email.service";

// Import cart store
import { cartStore } from "../Cart/cart.store";
import Customer from "../../modules/customer/customer.model";

// ==================== HELPER FUNCTIONS ====================

const generateRandomPassword = (length = 8) => {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
};

const createOrGetUser = async (
  email: string,
  phone: string,
  firstName: string,
  lastName: string,
  session: any,
) => {
  // Check by email
  let user = await User.findOne({ email }).session(session);
  if (user) return { user, isNewUser: false };

  // Check by phone
  user = await User.findOne({ phone }).session(session);
  if (user) {
    if (!user.email || user.email !== email) {
      user.email = email;
      await user.save({ session });
    }
    return { user, isNewUser: false };
  }

  // Create new user
  const password = generateRandomPassword();
  const newUser = new User({
    name: `${firstName} ${lastName}`,
    firstName,
    lastName,
    email,
    phone,
    password,
    role: "customer",
    isEmailVerified: false,
    createdViaCheckout: true,
  });

  await newUser.save({ session });
  return { user: newUser, isNewUser: true, password };
};

// ==================== ENHANCED CALCULATE DELIVERY FEE ====================
// One fee table, shared with the order model and the storefront: the free
// standard windows are "09:00" (delivery 8AM–12PM) and "After 5:00 PM"
// (collection); every fixed slot is charged at its listed price.
const calculateDeliveryFee = (
  deliveryTime: string | undefined,
  collectionTime: string | undefined,
) => {
  const deliveryFee = DeliveryTimeManager.getDeliveryFee(
    DeliveryTimeManager.normalize(deliveryTime, "delivery"),
  );
  const collectionFee = DeliveryTimeManager.getCollectionFee(
    DeliveryTimeManager.normalize(collectionTime, "collection"),
  );
  return deliveryFee + collectionFee;
};

// ==================== APPLY PROMO ====================
const applyPromo = async (promoCode: string, orderAmount: number) => {
  if (!promoCode || promoCode.trim() === "") {
    return { discount: 0, promoName: "", promoCode: "", success: true };
  }

  const promoService = new PromoService();

  try {
    const result = await promoService.applyPromo(promoCode, orderAmount);

    if (!result.success) {
      throw new ApiError(result.message || "Invalid promo code", 400);
    }

    return {
      discount: result.discount,
      promoName: promoCode,
      promoCode: promoCode,
      success: true,
    };
  } catch (error: any) {
    throw new ApiError(error.message || "Failed to apply promo code", 400);
  }
};

// ==================== GET CART FROM SESSION ====================
const getCartFromSession = (cartId?: string) => {
  if (!cartId || !cartStore.has(cartId)) {
    return null;
  }

  return cartStore.get(cartId);
};

// ==================== VALIDATE CART ITEMS ====================
const validateAndProcessCartItems = async (cartItems: any[], session: any) => {
  let subtotalAmount = 0;
  const orderItems = [];

  for (const cartItem of cartItems) {
    if (!cartItem.productId) {
      throw new ApiError("Product ID is missing in cart item", 400);
    }

    const product = await Product.findById(cartItem.productId).session(session);

    if (!product) {
      throw new ApiError(`Product not found: ${cartItem.productId}`, 404);
    }

    // Check stock (show actual numbers)
    if (product.stock < cartItem.quantity) {
      throw new ApiError(
        `${product.name}: Available ${product.stock}, Requested ${cartItem.quantity}`,
        400,
      );
    }

    // Update product stock
    product.stock -= cartItem.quantity;
    await product.save({ session });

    // Use cart item price or product price
    const price = cartItem.price || product.price || 0;

    orderItems.push({
      product: product._id,
      quantity: cartItem.quantity,
      price: price,
      name: product.name || cartItem.name || "Product",
      startDate: cartItem.startDate,
      endDate: cartItem.endDate,
      hireOccasion: cartItem.hireOccasion,
      keepOvernight: cartItem.keepOvernight,
      rentalType: cartItem.rentalType,
    });

    subtotalAmount += price * cartItem.quantity;
  }

  return { orderItems, subtotalAmount };
};

// ==================== MAIN CHECKOUT FUNCTION ====================
// src/app/modules/Checkout/checkout.controller.ts
// ... keep your existing imports

export const checkoutFromCart = asyncHandler(
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // ──────────────────────────────────────────────
      // Robust cartId extraction (handles string/array/undefined)
      // ──────────────────────────────────────────────
      let cartIdFromHeader: string | undefined;
      const rawHeader = req.headers["x-cart-id"];
      if (typeof rawHeader === "string") {
        cartIdFromHeader = rawHeader.trim();
      } else if (Array.isArray(rawHeader) && rawHeader.length > 0) {
        cartIdFromHeader = rawHeader[0].trim();
      }

      const cart = getCartFromSession(cartIdFromHeader);

      if (!cart || !cart.items || cart.items.length === 0) {
        throw new ApiError(
          "Your cart is empty. Please add items to cart before checkout.",
          400,
        );
      }

      // ──────────────────────────────────────────────
      // Rest of your original logic (unchanged)
      // ──────────────────────────────────────────────
      const {
        shippingAddress,
        paymentMethod = "cash_on_delivery",
        termsAccepted = false,
        invoiceType = "regular",
        bankDetails,
        promoCode,
        deliveryNotes,
      } = req.body;

      if (!shippingAddress) {
        throw new ApiError("Shipping address is required", 400);
      }

      const requiredFields = [
        "firstName",
        "lastName",
        "phone",
        "email",
        "street",
        "city",
        "zipCode",
        "country",
      ];

      requiredFields.forEach((field) => {
        if (!shippingAddress[field]) {
          throw new ApiError(`${field} is required`, 400);
        }
      });

      if (!termsAccepted) {
        throw new ApiError("You must accept terms & conditions", 400);
      }

      if (!["regular", "corporate"].includes(invoiceType)) {
        throw new ApiError("Invalid invoice type", 400);
      }

      if (
        invoiceType === "corporate" &&
        (!bankDetails || bankDetails.trim() === "")
      ) {
        throw new ApiError(
          "Bank details are required for corporate invoices",
          400,
        );
      }

      if (
        !["cash_on_delivery", "online", "bank_transfer"].includes(paymentMethod)
      ) {
        throw new ApiError("Invalid payment method", 400);
      }

      console.log("📦 Cart items:", cart.items.length, "items");

      const {
        user: orderUser,
        isNewUser,
        password,
      } = await createOrGetUser(
        shippingAddress.email,
        shippingAddress.phone,
        shippingAddress.firstName,
        shippingAddress.lastName,
        session,
      );

      const { orderItems, subtotalAmount } = await validateAndProcessCartItems(
        cart.items,
        session,
      );

      console.log(
        "💰 Subtotal:",
        subtotalAmount,
        "Order items:",
        orderItems.length,
      );

      const deliveryFee = calculateDeliveryFee(
        shippingAddress.deliveryTime,
        shippingAddress.collectionTime,
      );

      const overnightFee = shippingAddress.keepOvernight ? 30 : 0;
      const placementFee = PlacementFeeManager.getFee(shippingAddress.floorType);
      const feesTotal = deliveryFee + overnightFee + placementFee;
      const amountBeforePromo = subtotalAmount + feesTotal;

      console.log("📊 Fee calculation:", {
        subtotalAmount,
        deliveryFee,
        overnightFee,
        placementFee,
        feesTotal,
        amountBeforePromo,
        deliveryTime: shippingAddress.deliveryTime,
        collectionTime: shippingAddress.collectionTime,
        keepOvernight: shippingAddress.keepOvernight,
        floorType: shippingAddress.floorType,
      });

      let discount = 0;
      let appliedPromoCode = "";

      if (promoCode && promoCode.trim() !== "") {
        try {
          const promoResult = await applyPromo(promoCode, amountBeforePromo);
          discount = promoResult.discount;
          appliedPromoCode = promoResult.promoCode;
          console.log("🎟️ Promo applied:", { promoCode, discount });
        } catch (promoError: any) {
          console.log("⚠️ Promo error:", promoError.message);
          throw new ApiError(`Promo code error: ${promoError.message}`, 400);
        }
      }

      const totalAmount = amountBeforePromo - discount;

      console.log("💳 Final amounts:", {
        subtotalAmount,
        deliveryFee,
        overnightFee,
        placementFee,
        discount,
        totalAmount,
      });

      const orderData = {
        user: orderUser._id,
        items: orderItems,
        subtotalAmount,
        deliveryFee,
        overnightFee,
        placementFee,
        discountAmount: discount,
        totalAmount,
        paymentMethod,
        status: "pending",
        shippingAddress: {
          ...shippingAddress,
          deliveryNotes: deliveryNotes || "",
        },
        termsAccepted,
        invoiceType,
        bankDetails: invoiceType === "corporate" ? bankDetails : undefined,
        promoCode: appliedPromoCode || undefined,
        estimatedDeliveryDate:
          orderItems[0]?.startDate ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const createdOrder = new Order(orderData);
      await createdOrder.save({ session });

      // Clear the cart from memory (using the extracted cartId)
      if (cartIdFromHeader && cartStore.has(cartIdFromHeader)) {
        cartStore.delete(cartIdFromHeader);
        console.log("🧹 Cart cleared:", cartIdFromHeader);
      }

      await session.commitTransaction();
      session.endSession();

      // Send emails (non-critical, won't fail the response)
      try {
        await sendOrderReceivedEmail(createdOrder);
        await sendOrderNotificationToAdmin(createdOrder);

        if (isNewUser && password) {
          await sendUserCredentialsEmail(
            shippingAddress.email,
            shippingAddress.firstName,
            password,
          );
        }

        console.log("📧 All emails sent successfully");
      } catch (emailError) {
        console.error("⚠️ Email sending failed (non-critical):", emailError);
      }

      const responseData: any = {
        order: createdOrder,
        cartCleared: true,
      };

      if (isNewUser) {
        responseData.newAccount = {
          created: true,
          email: orderUser.email,
          password,
          message: "Account created. Check your email for login details.",
        };
      }

      res.status(201).json({
        success: true,
        message: isNewUser
          ? "Order placed successfully! Account created."
          : "Order placed successfully!",
        data: responseData,
      });
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      console.error("❌ Checkout error:", err.message, err.stack);
      throw err;
    }
  },
);

// ==================== GET CART SUMMARY ====================
export const getCartSummary = asyncHandler(
  async (req: Request, res: Response) => {
    const cartId = req.headers["x-cart-id"] as string;
    const cart = getCartFromSession(cartId);

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          items: [],
          totalItems: 0,
          subtotal: 0,
          message: "Cart is empty",
        },
      });
    }

    // Calculate subtotal
    let subtotal = 0;
    const itemsWithDetails = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.productId).select(
        "name price images category",
      );

      const itemPrice = item.price || product?.price || 0;
      const itemSubtotal = itemPrice * item.quantity;
      subtotal += itemSubtotal;

      itemsWithDetails.push({
        ...item,
        productDetails: product,
        price: itemPrice,
        subtotal: itemSubtotal,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        items: itemsWithDetails,
        totalItems: cart.items.length,
        subtotal,
        cartId,
      },
    });
  },
);

// ==================== OTHER FUNCTIONS ====================
export const getOrderById = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const requester = (req as any).user;
    const isAdmin =
      requester?.role === "admin" || requester?.role === "superadmin";

    const order = await Order.findOne(
      isAdmin ? { _id: orderId } : { _id: orderId, user: requester?._id },
    )
      .populate("user", "name email phone")
      .populate("items.product", "name images price");

    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    res.status(200).json({
      success: true,
      data: { order },
    });
  },
);

export const getUserOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const requester = (req as any).user;
    const isAdmin =
      requester?.role === "admin" || requester?.role === "superadmin";

    if (!isAdmin && String(userId) !== String(requester?._id)) {
      throw new ApiError("You can only view your own orders", 403);
    }

    // Keep pagination bounded so a large limit cannot dump the collection.
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);

    const skip = (safePage - 1) * safeLimit;
    const [orders, total] = await Promise.all([
      Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .populate("items.product", "name images"),
      Order.countDocuments({ user: userId }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          pages: Math.ceil(total / safeLimit),
        },
      },
    });
  },
);

export const getAllOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, status, search } = req.query;

    const query: any = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      query.$or = [
        { orderNumber: searchRegex },
        { "shippingAddress.firstName": searchRegex },
        { "shippingAddress.lastName": searchRegex },
        { "shippingAddress.email": searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("user", "name email")
        .populate("items.product", "name price"),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  },
);

export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      throw new ApiError("Invalid status", 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    const oldStatus = order.status;
    order.status = status;

    if (notes) {
      order.adminNotes = notes;
    }

    await order.save();

    // Send email on status change
    try {
      if (status === "confirmed" && oldStatus !== "confirmed") {
        await sendOrderConfirmedEmail(order);
      } else if (status === "cancelled" && oldStatus !== "cancelled") {
        await sendOrderCancellationEmail(order, notes || "Cancelled");
      }
    } catch (emailError) {
      console.error("Status email failed:", emailError);
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: { order },
    });
  },
);

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError("Order not found", 404);
  }

  if (order.status === "delivered") {
    throw new ApiError("Cannot cancel delivered order", 400);
  }

  order.status = "cancelled";
  order.cancellationReason = reason;
  await order.save();

  // Return stock
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      product.stock += item.quantity;
      await product.save();
    }
  }

  // Send cancellation email
  try {
    await sendOrderCancellationEmail(order, reason);
  } catch (emailError) {
    console.error("Cancellation email failed:", emailError);
  }

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    data: { order },
  });
});

export const checkAvailability = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      throw new ApiError("Product ID is required", 400);
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError("Product not found", 404);
    }

    // Just check stock (no unit mention)
    const available = product.stock >= quantity;

    res.status(200).json({
      success: true,
      available,
      stock: product.stock,
      requested: quantity,
      message: available
        ? `Available: ${product.stock} in stock`
        : `Only ${product.stock} available in stock`,
      product: {
        id: product._id,
        name: product.name,
        price: product.price,
      },
    });
  },
);

export const calculateDeliveryFeeAPI = asyncHandler(
  async (req: Request, res: Response) => {
    // Normalize first so callers can send raw labels ("7:30 PM (+£15)").
    const normalizedDelivery = DeliveryTimeManager.normalize(
      req.body?.deliveryTime,
      "delivery",
    );
    const normalizedCollection = DeliveryTimeManager.normalize(
      req.body?.collectionTime,
      "collection",
    );

    const deliveryFee = DeliveryTimeManager.getDeliveryFee(normalizedDelivery);
    const collectionFee = DeliveryTimeManager.getCollectionFee(
      normalizedCollection,
    );

    res.status(200).json({
      success: true,
      data: {
        deliveryFee,
        collectionFee,
        totalFee: deliveryFee + collectionFee,
        breakdown: {
          delivery: deliveryFee,
          collection: collectionFee,
        },
        details: {
          deliveryTime: normalizedDelivery,
          collectionTime: normalizedCollection,
        },
      },
    });
  },
);

// Quick / Direct Checkout – no cart needed

/**
 * Resolve the add-ons a customer selected against the product's own option
 * definitions. Prices always come from the database, never from the request,
 * so a tampered payload cannot change what is charged. Unknown or disabled
 * options are dropped rather than rejected, so a stale cart still checks out.
 */
const resolveExtras = (
  product: any,
  requested: any,
  startDate: any,
  endDate: any,
): { extras: IOrderItemExtra[]; extrasTotal: number } => {
  const definitions = Array.isArray(product?.extraOptions)
    ? product.extraOptions
    : [];
  if (!definitions.length || !Array.isArray(requested) || !requested.length) {
    return { extras: [], extrasTotal: 0 };
  }

  // Booked days, used by `per_day` options. Defaults to a single day.
  let days = 1;
  if (startDate) {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      days = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / 86400000) + 1,
      );
    }
  }

  const extras: IOrderItemExtra[] = [];
  let extrasTotal = 0;

  for (const selection of requested) {
    const key = String(selection?.key ?? "").trim();
    if (!key) continue;

    const definition = definitions.find(
      (option: any) => option.key === key && option.enabled !== false,
    );
    if (!definition) continue;

    const maxQty = Number(definition.max) > 0 ? Number(definition.max) : 1;
    const rawQty = Number(selection?.quantity ?? selection?.qty ?? 1);
    const quantity = Math.min(
      Math.max(1, Number.isFinite(rawQty) ? Math.floor(rawQty) : 1),
      maxQty,
    );

    let lineTotal: number;
    switch (definition.pricingType) {
      case "per_day":
        lineTotal = definition.price * quantity * days;
        break;
      case "per_quantity":
        lineTotal = definition.price * quantity;
        break;
      default:
        lineTotal = definition.price;
    }

    lineTotal = Math.round(lineTotal * 100) / 100;

    extras.push({
      key: definition.key,
      label: definition.label,
      price: definition.price,
      pricingType: definition.pricingType || "total",
      quantity,
      total: lineTotal,
    });
    extrasTotal += lineTotal;
  }

  return { extras, extrasTotal: Math.round(extrasTotal * 100) / 100 };
};

export const quickCheckout = asyncHandler(
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        products,
        shippingAddress,
        paymentMethod = "cash_on_delivery",
        termsAccepted = false,
        invoiceType = "regular",
        bankDetails,
      } = req.body ?? {};

      if (!shippingAddress) throw new ApiError("Shipping address required", 400);

      if (!Array.isArray(products) || products.length === 0) {
        throw new ApiError("Your basket is empty.", 400);
      }

      if (!termsAccepted) {
        throw new ApiError("You must accept terms & conditions", 400);
      }

      if (!["regular", "corporate"].includes(invoiceType)) {
        throw new ApiError("Invalid invoice type", 400);
      }

      if (
        !["cash_on_delivery", "online", "bank_transfer"].includes(paymentMethod)
      ) {
        throw new ApiError("Invalid payment method", 400);
      }

      if (invoiceType === "corporate" && !String(bankDetails || "").trim()) {
        throw new ApiError(
          "Bank details are required for corporate invoices",
          400,
        );
      }

      for (const field of [
        "firstName",
        "lastName",
        "phone",
        "email",
        "street",
        "city",
        "zipCode",
        "country",
      ]) {
        if (!shippingAddress[field]) {
          throw new ApiError(`${field} is required`, 400);
        }
      }

      // 1. FETCH PRODUCTS IN PARALLEL
      const productIds = products.map((p: any) => p?.productId).filter(Boolean);
      const dbProducts = await Product.find({
        _id: { $in: productIds },
      }).session(session);
      const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

      let subtotal = 0;
      const orderItems = [];

      for (const p of products) {
        const quantity = Number(p?.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) {
          throw new ApiError("Invalid quantity", 400);
        }
        p.quantity = quantity;
        const product = productMap.get(p.productId);
        if (!product)
          throw new ApiError(`Product ${p.productId} not found`, 404);
        if (product.stock < quantity)
          throw new ApiError(`${product.name} out of stock`, 400);

        product.stock -= quantity;

        // Price any selected add-ons from the product's own definitions.
        const { extras, extrasTotal } = resolveExtras(
          product,
          p.extras,
          p.startDate,
          p.endDate,
        );

        orderItems.push({
          product: product._id,
          name: product.name,
          imageCover: product.imageCover,
          quantity: p.quantity,
          price: product.price,
          startDate: p.startDate ? new Date(p.startDate) : undefined,
          endDate: p.endDate ? new Date(p.endDate) : undefined,
          extras,
          extrasTotal,
        });
        subtotal += product.price * p.quantity + extrasTotal;
      }

      // 2. IDENTITY LOGIC (Detect if new user)
      const email = String(shippingAddress.email).trim().toLowerCase();
      shippingAddress.email = email;
      const existingUser = await User.findOne({ email }).session(session);
      const isNewUser = !existingUser;
      const tempPassword = isNewUser
        ? `${crypto.randomBytes(12).toString("base64url")}Aa1!`
        : "";
      // findOneAndUpdate does not run the model's pre-save hash hook, so hash
      // here. A plaintext password must never reach the database.
      const passwordHash = isNewUser
        ? await bcrypt.hash(
            tempPassword,
            Number(process.env.BCRYPT_SALT_ROUNDS || 12),
          )
        : undefined;

      const user = await User.findOneAndUpdate(
        { email },
        {
          $setOnInsert: {
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
            ...(passwordHash ? { password: passwordHash } : {}),
            role: "customer",
            createdViaCheckout: true,
          },
        },
        { upsert: true, new: true, session },
      );

      // Server-side fees. Money fields never come from the request body.
      const deliveryFee = calculateDeliveryFee(
        shippingAddress.deliveryTime,
        shippingAddress.collectionTime,
      );
      const overnightFee = shippingAddress.keepOvernight ? 30 : 0;
      const placementFee = PlacementFeeManager.getFee(
        shippingAddress.floorType,
      );
      const totalAmount =
        subtotal + deliveryFee + overnightFee + placementFee;

      // 3. SAVE UPDATES
      await Promise.all(dbProducts.map((p) => p.save({ session })));

      const order = new Order({
        user: user._id,
        customerName:
          `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(),
        items: orderItems,
        subtotalAmount: subtotal,
        deliveryFee,
        overnightFee,
        placementFee,
        discountAmount: 0,
        totalAmount,
        shippingAddress,
        paymentMethod,
        invoiceType,
        bankDetails:
          invoiceType === "corporate" ? String(bankDetails || "") : "",
      });
      await order.save({ session });

      await Customer.findOneAndUpdate(
        { email },
        {
          $push: { orders: order._id },
          $inc: { totalSpent: subtotal },
          $setOnInsert: {
            user: user._id,
            customerId: "CUST-" + Date.now().toString(36).toUpperCase(),
          },
        },
        { upsert: true, session },
      );

      // 4. COMMIT TRANSACTION
      await session.commitTransaction();
      session.endSession();

      // 5. ASYNCHRONOUS EMAILS (Don't 'await' these before sending response to user)
      // Sending after commit ensures user only gets email if DB update succeeded
      if (isNewUser) {
        sendUserCredentialsEmail(
          email,
          shippingAddress.firstName,
          tempPassword,
        ).catch((err) => console.error("Credentials Email Failed", err));
      }

      sendOrderReceivedEmail(order).catch((err) =>
        console.error("Order Receipt Email Failed", err),
      );

      //       // Send emails (non-critical, won't fail the response)
      //       try {
      //         console.log("📧 [Checkout] Triggering quickCheckout emails", {
      //           orderId: order._id,
      //           orderNumber: order.orderNumber,
      //           customerEmail: shippingAddress.email,
      //           isNewUser,
      //         });
      //
      //         await sendOrderReceivedEmail(order);
      //         await sendOrderNotificationToAdmin(order);
      //
      //         if (isNewUser && tempPassword) {
      //           await sendUserCredentialsEmail(email, firstName, tempPassword);
      //         }
      //
      //         console.log("📧 [Checkout] quickCheckout emails completed");
      //       } catch (emailError) {
      //         console.error(
      //           "⚠️ [Checkout] quickCheckout email sending failed (non-critical):",
      //           emailError,
      //         );
      //       }

      res.status(201).json({ success: true, data: order });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  },
);
