import { Router } from "express";
import { PromoController } from "./promos.controller";
import { protectRoute } from "../../middlewares/auth.middleware";
import { restrictTo } from "../../middlewares/authorization.middleware";

const router = Router();
const promoController = new PromoController();

// Public: the storefront needs to show active offers and validate a code
// during checkout. These endpoints do not expose the promo list.
router.get("/promos/active", promoController.getActivePromos);
router.post("/promos/apply", promoController.applyPromo);
router.post("/promos/validate", promoController.validatePromo);

// Admin only: creating, editing, deleting promos and reading their usage.
router.use(protectRoute);
router.use(restrictTo("admin", "superadmin"));

router.post("/promos", promoController.createPromo);
router.get("/promos", promoController.getAllPromos);
router.get("/promos/:id", promoController.getPromoById);
router.put("/promos/:id", promoController.updatePromo);
router.delete("/promos/:id", promoController.deletePromo);
router.get("/promos/stats/overview", promoController.getPromoStats);
router.get("/promos/orders/all", promoController.getAllPromoOrders);
router.get("/promos/:id/orders", promoController.getPromoOrders);

export default router;
