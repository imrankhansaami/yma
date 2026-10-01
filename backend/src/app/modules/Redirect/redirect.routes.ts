import express from "express";
import * as redirectController from "./redirect.controller";
import { protectRoute } from "../../middlewares/auth.middleware";
import { restrictTo } from "../../middlewares/authorization.middleware";

const router = express.Router();

// Public routes
router.get("/active", redirectController.getActiveRedirects);

// Protected routes (admin only)
router.use(protectRoute);
router.use(restrictTo("admin", "superadmin"));

router
  .route("/")
  .get(redirectController.getRedirects)
  .post(redirectController.createRedirect);

router
  .route("/:id")
  .get(redirectController.getRedirect)
  .put(redirectController.updateRedirect)
  .delete(redirectController.deleteRedirect);

export default router;
