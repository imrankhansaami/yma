import { Router } from "express";
import { PromoController } from "./promos.controller";
import { protectRoute } from "../../middlewares/auth.middleware";
import { restrictTo } from "../../middlewares/authorization.middleware";
import { rateLimit } from "../../middlewares/rateLimit";

const router = Router();
const promoController = new PromoController();

const adminOnly = [protectRoute, restrictTo("admin", "superadmin")] as const;

// Public: the storefront needs to show active offers and validate a code
// during checkout. These endpoints do not expose the promo list, and applying
// a code is read-only - the redemption is counted when an order is created.
const promoLookupLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  message: "Too many promo code attempts. Please try again later.",
});

router.get("/promos/active", promoController.getActivePromos);
router.post("/promos/apply", promoLookupLimit, promoController.applyPromo);
router.post(
  "/promos/validate",
  promoLookupLimit,
  promoController.validatePromo,
);

// Admin only: creating, editing, deleting promos and reading their usage.
// Guards are attached per route because this router is mounted at /api/v1.
router.post("/promos", ...adminOnly, promoController.createPromo);
router.get("/promos", ...adminOnly, promoController.getAllPromos);
router.get("/promos/:id", ...adminOnly, promoController.getPromoById);
router.put("/promos/:id", ...adminOnly, promoController.updatePromo);
router.delete("/promos/:id", ...adminOnly, promoController.deletePromo);
router.get("/promos/stats/overview", ...adminOnly, promoController.getPromoStats);
router.get("/promos/orders/all", ...adminOnly, promoController.getAllPromoOrders);
router.get("/promos/:id/orders", ...adminOnly, promoController.getPromoOrders);

export default router;
