import express from "express";
import {
  register,
  loginUser,
  googleOAuthCallback,
  refreshTokenHandler,
  logout,
  forgotPasswordHandler,
  renderResetPage,
  resetPasswordHandler,
  updatePasswordHandler,
  getMe,
  updateMe,
  // NEW IMPORTS
  registerWithVerification,
  verifyEmail,
  resendVerification,
  checkVerificationStatus,
} from "./auth.controller";
import passport from "../../config/passport";
import { upload } from "../../utils/cloudinary.util";
import { protectRoute } from "../../middlewares/auth.middleware";
import { rateLimit } from "../../middlewares/rateLimit";
const router = express.Router();

/**
 * Absolute URLs the backend hands to the browser (Google OAuth callback, OAuth
 * error redirects) are built from this base. A proxy that reports an internal
 * bind address - e.g. the wildcard host the platform's own proxy uses - would
 * send users to https://0.0.0.0:3000, so such values are ignored in favour of
 * the configured FRONTEND_URL.
 */
const UNUSABLE_ORIGIN =
  /^https?:\/\/(0\.0\.0\.0|127\.0\.0\.1|localhost|\[::1?\]|\[::\]|::)(:\d+)?$/i;

const resolveFrontendBase = (req: express.Request) => {
  const fromHeader = (req.headers["x-frontend-origin"] as string | undefined)?.trim();
  if (fromHeader && !UNUSABLE_ORIGIN.test(fromHeader)) {
    return fromHeader.replace(/\/$/, "");
  }
  return (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
};

// ==================== PUBLIC ROUTES ====================

// Original registration (kept for backward compatibility)
router.post("/register", upload.single("photo"), register);

// NEW: Email verification registration
router.post(
  "/register-with-verification",
  upload.single("photo"),
  registerWithVerification,
);

// Email verification routes
router.get("/verify-email/:token", verifyEmail); // Browser verification
router.post("/verify-email/:token", verifyEmail); // API verification
router.post("/resend-verification", resendVerification);
router.post("/check-verification", checkVerificationStatus);

// Other auth routes
router.get("/google", (req, res, next) => {
  const frontendBase = resolveFrontendBase(req);
  const callbackURL = `${frontendBase}/api/v1/auth/google/callback`;

  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    callbackURL,
  } as any)(req, res, next);
});
router.get(
  "/google/callback",
  (req, res, next) => {
    const frontendBase = resolveFrontendBase(req);
    const callbackURL = `${frontendBase}/api/v1/auth/google/callback`;

    passport.authenticate(
      "google",
      { session: false, callbackURL } as any,
      (err: any, user: any) => {
        if (err || !user) {
          const message = err?.message || "Google sign-in failed";
          const code =
            message === "This email is registered with a password. Use email login."
              ? "oauth_password_user"
              : "oauth_error";
          const redirectUrl = `${frontendBase}/login?oauth=error&code=${code}`;
          return res.redirect(redirectUrl);
        }
        req.user = user;
        return next();
      },
    )(req, res, next);
  },
  googleOAuthCallback,
);
router.post(
  "/login",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }),
  loginUser,
);
router.post("/refresh", refreshTokenHandler);
router.post("/logout", logout);
router.post(
  "/forgot-password",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }),
  forgotPasswordHandler,
);

// Reset password routes
router.get("/reset-password/:token", renderResetPage);
router.post(
  "/reset-password/:token",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  resetPasswordHandler,
);
router.post(
  "/reset-password",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  resetPasswordHandler,
);

// ==================== PROTECTED ROUTES ====================
router.use(protectRoute);

router.get("/me", getMe);
router.patch("/update-me", upload.single("photo"), updateMe);
router.patch("/update-password", updatePasswordHandler);

export default router;
