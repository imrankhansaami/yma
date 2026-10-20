// src/routes/checkout.routes.ts
import { Router } from "express";
import {
  checkoutFromCart, // Main cart checkout
  quickCheckout, // Direct products checkout
  getCartSummary, // Cart summary
  getOrderById,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  checkAvailability,
  calculateDeliveryFeeAPI,
} from "./checkout.controller";
import { protectRoute } from "../../middlewares/auth.middleware";
import { rateLimit } from "../../middlewares/rateLimit";

const router = Router();

// Public routes
// router.post("/", checkoutFromCart); // Main checkout from cart
router.post(
  "/",
  rateLimit({ windowMs: 10 * 60 * 1000, max: 10 }),
  quickCheckout,
); // Quick checkout with products
router.get("/cart-summary", getCartSummary); // Get cart summary

// Utility routes
router.post("/check-availability", checkAvailability);
router.post("/calculate-delivery-fee", calculateDeliveryFeeAPI);

// Order routes: the controller only returns the signed-in user's own orders
// (admins may read any order).
router.get("/order/:orderId", protectRoute, getOrderById);
router.get("/user/:userId/orders", protectRoute, getUserOrders);

// Admin routes
// router.get("/all", authenticate, authorize("admin"), getAllOrders);
// router.patch("/order/:orderId/status", authenticate, authorize("admin"), updateOrderStatus);
// router.post("/order/:orderId/cancel", authenticate, cancelOrder);

export default router;
