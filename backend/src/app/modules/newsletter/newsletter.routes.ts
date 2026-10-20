import express from "express";
import {
  subscribe,
  unsubscribe,
  getSubscribers,
  sendNewsletter,
  getCount,
} from "./newsletter.controller";
import { protectRoute } from "../../middlewares/auth.middleware";
import { restrictTo } from "../../middlewares/authorization.middleware";
import { rateLimit } from "../../middlewares/rateLimit";

const router = express.Router();

const adminOnly = [protectRoute, restrictTo("admin", "superadmin")] as const;

// Public routes (rate limited so the list cannot be flooded).
router.post(
  "/newsletter/subscribe",
  rateLimit({ windowMs: 10 * 60 * 1000, max: 5 }),
  subscribe,
);
router.post("/newsletter/unsubscribe", unsubscribe);

// Admin only: subscriber emails and mass mail sending. Guards are attached per
// route because this router is mounted at /api/v1.
router.get("/newsletter/subscribers", ...adminOnly, getSubscribers);
router.get("/newsletter/count", ...adminOnly, getCount);
router.post("/newsletter/send", ...adminOnly, sendNewsletter);

export default router;
