import { Router } from "express";
import { CustomerController } from "./customer.controller";
import { protectRoute } from "../../middlewares/auth.middleware";
import { restrictTo } from "../../middlewares/authorization.middleware";

const router = Router();

/**
 * Customers
 */

// GET /api/customers
// List customers with filters + pagination. Customer records contain personal
// data, so only admins may read them.
router.get(
  "/",
  protectRoute,
  restrictTo("admin", "superadmin"),
  CustomerController.getCustomers,
);

// GET /api/customers/:customerId
// Get customer detail + recent orders.
router.get(
  "/:customerId",
  protectRoute,
  restrictTo("admin", "superadmin"),
  CustomerController.getCustomerDetail,
);

// POST /api/customers/orders/reorder
// Prepare reorder (auth required)
router.post("/orders/reorder", protectRoute, CustomerController.prepareReorder);

export default router;
