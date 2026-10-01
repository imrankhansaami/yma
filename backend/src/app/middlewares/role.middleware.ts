import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/apiError";

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user) {
    return next(new ApiError("Not authenticated", 401));
  }

  const demoAdminEmail = (process.env.DEMO_ADMIN_EMAIL || "demo.admin@yma.test")
    .trim()
    .toLowerCase();
  const isDemoAdmin =
    Boolean(demoAdminEmail) &&
    String(user.email || "").toLowerCase() === demoAdminEmail;

  if (user.role !== "admin" && user.role !== "superadmin" && !isDemoAdmin) {
    return next(new ApiError("Access denied. Admin only.", 403));
  }

  next();
};
