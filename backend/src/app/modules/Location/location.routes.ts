import express from "express";
import { protectRoute } from "../../middlewares/auth.middleware";
import { restrictTo } from "../../middlewares/authorization.middleware";
import {
  createLocationHandler,
  getLocationsHandler,
  getLocationHandler,
  getLocationBySlugHandler,
  updateLocationHandler,
  duplicateLocationHandler,
  deleteLocationHandler,
  addDeliveryAreaHandler,
  updateDeliveryAreaHandler,
  deleteDeliveryAreaHandler,
  getDeliveryAreaHandler,
  checkDeliveryHandler,
  getDeliveryHierarchyHandler,
} from "./location.controller";

const router = express.Router();

// Public routes
router.get("/", getLocationsHandler);
router.get("/hierarchy", getDeliveryHierarchyHandler);
router.get("/delivery/check", checkDeliveryHandler);
router.get("/slug/:slug", getLocationBySlugHandler);
router.get("/:id", getLocationHandler);
router.get("/:id/delivery-areas/:areaId", getDeliveryAreaHandler);

// Protected routes (admin only)
router.use(protectRoute);
router.use(restrictTo("admin", "superadmin"));

router.post("/", createLocationHandler);
router.patch("/:id", updateLocationHandler);
router.post("/:id/duplicate", duplicateLocationHandler);
router.delete("/:id", deleteLocationHandler);
router.post("/:id/delivery-areas", addDeliveryAreaHandler);
router.patch("/:id/delivery-areas/:areaId", updateDeliveryAreaHandler);
router.delete("/:id/delivery-areas/:areaId", deleteDeliveryAreaHandler);

export default router;
