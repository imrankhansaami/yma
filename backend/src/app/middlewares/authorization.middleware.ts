import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/apiError";
import { IUser } from "../modules/Auth/user.interface";
import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler";
import { protectRoute as protect } from "@app/middlewares/auth.middleware";
import User from "../modules/Auth/user.model";
type AuthenticatedRequest = Request & { user?: IUser };

// ---------------------------------------------
// restrictTo → Only selected roles can access
// ---------------------------------------------
export const restrictTo = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const aReq = req as AuthenticatedRequest;

    if (!aReq.user) {
      return next(new ApiError("You are not logged in", 401));
    }

    if (!allowedRoles.includes(aReq.user.role)) {
      return next(new ApiError("You do not have permission", 403));
    }

    next();
  };
};

// ---------------------------------------------
// canManageUser -> Who may administer whom
//   superadmin : anyone
//   admin      : ordinary accounts only (never another admin/superadmin)
// ---------------------------------------------
export const canManageUser = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const aReq = req as AuthenticatedRequest;

    if (!aReq.user) {
      throw new ApiError("You are not logged in", 401);
    }

    const targetUserId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw new ApiError("Invalid user ID", 400);
    }

    if (aReq.user.role === "superadmin") {
      return next();
    }

    if (aReq.user.role !== "admin") {
      throw new ApiError("You do not have permission", 403);
    }

    const target = await User.findById(targetUserId).select("role");
    if (!target) {
      throw new ApiError("User not found", 404);
    }

    if (target.role === "admin" || target.role === "superadmin") {
      throw new ApiError(
        "Only a superadmin can manage an administrator account",
        403,
      );
    }

    next();
  },
);
// export const protectRoute = asyncHandler(
//   async (req: Request, _res: Response, next: NextFunction) => {
//     const cookieToken = (req as any).cookies?.accessToken as string | undefined;
//     const headerToken = req.headers.authorization?.startsWith("Bearer ")
//       ? req.headers.authorization.split(" ")[1]
//       : undefined;
//
//     let tokenToUse: string | undefined = cookieToken || headerToken;
//
//     // Debug logging
//     console.log("🔐 Auth Debug:", {
//       hasCookieToken: !!cookieToken,
//       hasHeaderToken: !!headerToken,
//       tokenToUse: tokenToUse ? "Present" : "Missing",
//     });
//
//     if (!tokenToUse) throw new ApiError("No token provided", 401);
//
//     const currentUser = await verifyAccessToken(tokenToUse);
//
//     // Debug user info - check if role is present
//     console.log("👤 User Debug:", {
//       userId: currentUser._id,
//       email: currentUser.email,
//       role: currentUser.role,
//       hasRole: !!currentUser.role,
//       isActive: currentUser.active,
//     });
//
//     // Ensure role exists
//     if (!currentUser.role) {
//       console.error("❌ User role is missing!");
//       throw new ApiError("User role not found", 401);
//     }
//
//     (req as AuthenticatedRequest).user = currentUser;
//     next();
//   }
// );
