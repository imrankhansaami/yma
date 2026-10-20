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

const adminOnly = [protectRoute, restrictTo("admin", "superadmin")] as const;

// Public: contact form submission (rate limited to slow spam).
router.post(
  "/contact",
  rateLimit({ windowMs: 10 * 60 * 1000, max: 5 }),
  submitContact,
);

// Admin only: contact messages contain personal data. Guards are attached per
// route because this router is mounted at /api/v1; a router-level `use` would
// also gate every other API route that falls through it.
router.get("/contacts", ...adminOnly, getContacts);
router.get("/contacts/:id", ...adminOnly, getContact);
router.patch("/contacts/:id/status", ...adminOnly, updateContactStatus);

export default router;
