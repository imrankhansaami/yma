import express from "express";
import {
  submitContact,
  getContacts,
  getContact,
  updateContactStatus,
} from "./contact.controller";
import { protectRoute } from "../../middlewares/auth.middleware";
import { restrictTo } from "../../middlewares/authorization.middleware";
import { rateLimit } from "../../middlewares/rateLimit";

const router = express.Router();

// Public: contact form submission (rate limited to slow spam).
router.post(
  "/contact",
  rateLimit({ windowMs: 10 * 60 * 1000, max: 5 }),
  submitContact,
);

// Admin only: contact messages contain personal data.
router.use(protectRoute);
router.use(restrictTo("admin", "superadmin"));
router.get("/contacts", getContacts);
router.get("/contacts/:id", getContact);
router.patch("/contacts/:id/status", updateContactStatus);

export default router;
