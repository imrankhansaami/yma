import { Router } from "express";
import { PromoController } from "./promos.controller";
import { protectRoute } from "../../middlewares/auth.middleware";
import { restrictTo } from "../../middlewares/authorization.middleware";

const router = Router();
const promoController = new PromoController();

const adminOnly = [protectRoute, restrictTo("admin", "superadmin")] as const;

// Public: the storefront needs to show active offers and validate a code
// during checkout. These endpoints do not expose the promo list.
router.get("/promos/active", promoController.getActivePromos);
router.post("/promos/apply", promoController.applyPromo);
router.post("/promos/validate", promoController.validatePromo);

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
