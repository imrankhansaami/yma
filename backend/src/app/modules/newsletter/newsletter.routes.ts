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

// Public routes (rate limited so the list cannot be flooded).
router.post(
  "/newsletter/subscribe",
  rateLimit({ windowMs: 10 * 60 * 1000, max: 5 }),
  subscribe,
);
router.post("/newsletter/unsubscribe", unsubscribe);

// Admin only: subscriber emails and mass mail sending.
router.use(protectRoute);
router.use(restrictTo("admin", "superadmin"));
router.get("/newsletter/subscribers", getSubscribers);
router.get("/newsletter/count", getCount);
router.post("/newsletter/send", sendNewsletter);

export default router;
