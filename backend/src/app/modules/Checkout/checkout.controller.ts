// src/controllers/checkout.controller.ts
import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import mongoose, { Types } from "mongoose";
import ApiError from "../../utils/apiError";
import Order from "../../modules/Order/order.model";
import Product from "../../modules/Product/product.model";
import type { IOrderItemExtra } from "../../modules/Order/order.interface";
import { PlacementFeeManager } from "../../modules/Order/order.interface";
import User from "../../modules/Auth/user.model";
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
const calculateDeliveryFee = (
  deliveryTime: string | undefined,
  collectionTime: string | undefined,
  keepOvernight: boolean = false,
) => {
  let fee = 0;

  // Base delivery fee: 8am-2pm FREE, others €10
  if (deliveryTime === "8am-12pm" || deliveryTime === "12pm-4pm") {
    // 8am-2pm (approximated as 8am-12pm and 12pm-4pm) - FREE
    fee += 0;
  } else {
    // Other times - €10
    fee += 10;
  }

  // Collection fee: before 5pm FREE, after 5pm €10
  if (collectionTime === "after_5pm") {
    fee += 10;
  }
  // before_5pm is free, so no charge

  // Overnight keeping: €30 if selected
  if (keepOvernight) {
    fee += 30;
  }

  return fee;
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

      // Debug logging (keep for production troubleshooting, or remove later)
      console.log("━━━━━━━━━━━━━━━━ CHECKOUT DEBUG ━━━━━━━━━━━━━━━━");
      console.log("→ Timestamp             :", new Date().toISOString());
      console.log("→ Raw x-cart-id header  :", JSON.stringify(rawHeader));
      console.log(
        "→ Extracted cartId      :",
        cartIdFromHeader || "(missing/empty)",
      );
      console.log(
        "→ cartStore has ID?     :",
        cartIdFromHeader ? cartStore.has(cartIdFromHeader) : false,
      );
      console.log("→ All cart keys in store:", [...cartStore.keys()]);

      const cart = getCartFromSession(cartIdFromHeader);

      console.log("→ Cart found?           :", !!cart);
      console.log("→ Items length          :", cart?.items?.length ?? "N/A");
      if ((cart?.items?.length || 0) > 0) {
        console.log(
          "→ First item sample     :",
          JSON.stringify(cart?.items[0], null, 2),
        );
      }
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

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

      console.log("🛒 Checkout Request:", {
        shippingAddress,
        paymentMethod,
        termsAccepted,
        promoCode,
      });

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

      if (!["cash_on_delivery", "online"].includes(paymentMethod)) {
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
        shippingAddress.keepOvernight,
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

    const order = await Order.findById(orderId)
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

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("items.product", "name images"),
      Order.countDocuments({ user: userId }),
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
    const { deliveryTime, collectionTime, keepOvernight = false } = req.body;

    const deliveryFee = calculateDeliveryFee(
      deliveryTime,
      collectionTime,
      keepOvernight,
    );
    const overnightFee = keepOvernight ? 30 : 0;
    const totalFee = deliveryFee + overnightFee;

    // Fee breakdown
    let deliveryBreakdown = 0;
    let collectionBreakdown = 0;

    // Delivery breakdown
    if (deliveryTime === "8am-12pm" || deliveryTime === "12pm-4pm") {
      deliveryBreakdown = 0; // Free
    } else {
      deliveryBreakdown = 10; // €10
    }

    // Collection breakdown
    if (collectionTime === "after_5pm") {
      collectionBreakdown = 10; // €10
    }
    // before_5pm is free

    res.status(200).json({
      success: true,
      data: {
        deliveryFee,
        overnightFee,
        totalFee,
        breakdown: {
          delivery: deliveryBreakdown,
          collection: collectionBreakdown,
          overnight: overnightFee,
        },
        details: {
          deliveryTime: deliveryTime || "Standard (8am-2pm: Free, Others: €10)",
          collectionTime:
            collectionTime || "Standard (Before 5pm: Free, After 5pm: €10)",
          keepOvernight: keepOvernight || false,
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
      const { products, shippingAddress, ...rest } = req.body;

      if (!shippingAddress)
        throw new ApiError("Shipping address required", 400);

      // 1. FETCH PRODUCTS IN PARALLEL
      const productIds = products.map((p: any) => p.productId);
      const dbProducts = await Product.find({
        _id: { $in: productIds },
      }).session(session);
      const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

      let subtotal = 0;
      const orderItems = [];

      for (const p of products) {
        const product = productMap.get(p.productId);
        if (!product)
          throw new ApiError(`Product ${p.productId} not found`, 404);
        if (product.stock < p.quantity)
          throw new ApiError(`${product.name} out of stock`, 400);

        product.stock -= p.quantity;

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
      const email = shippingAddress.email.trim().toLowerCase();
      const existingUser = await User.findOne({ email }).session(session);
      const isNewUser = !existingUser;
      const tempPassword = Math.random().toString(36).slice(-10) + "X1!";

      const user = await User.findOneAndUpdate(
        { email },
        {
          $setOnInsert: {
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
            password: tempPassword,
            role: "customer",
            createdViaCheckout: true,
          },
        },
        { upsert: true, new: true, session },
      );

      // 3. SAVE UPDATES
      await Promise.all(dbProducts.map((p) => p.save({ session })));

      const order = new Order({
        user: user._id,
        items: orderItems,
        subtotalAmount: subtotal,
        shippingAddress,
        ...rest,
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
