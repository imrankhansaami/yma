import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import ApiError from "../utils/apiError";
import { protectRoute } from "./auth.middleware";

/**
 * Auth for the invoice documents that are opened as plain links — the bulk
 * printable page, the bulk PDF and the single-invoice download.
 *
 * iPhone browsers cannot open blob-URL tabs and block pop-ups raised after an
 * await, so those documents are fetched by direct link; the link carries a
 * short-lived "invoice-links" token scoped to exactly the order ids it was
 * signed for. Without a query token the normal Bearer auth chain applies, so
 * the same routes keep working for the app itself.
 */
export const invoiceLinkAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const queryToken = String(req.query.token || "");

  if (queryToken) {
    try {
      const payload = jwt.verify(
        queryToken,
        process.env.JWT_SECRET as string,
      ) as any;

      if (payload?.scope === "invoice-links" && Array.isArray(payload.ids)) {
        const fromQuery = String(req.query.ids || "")
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);
        const fromParams = String((req.params as any)?.orderId || "").trim();
        const wanted = fromQuery.length
          ? fromQuery
          : fromParams
            ? [fromParams]
            : [];

        const allowed =
          wanted.length > 0 &&
          wanted.every((id) => payload.ids.includes(String(id)));

        if (allowed) {
          (req as any).user = {
            id: String(payload.by || ""),
            role: payload.role === "admin" ? "admin" : "customer",
          };
          return next();
        }

        return next(new ApiError("This invoice link is no longer valid", 403));
      }
    } catch {
      // Expired or not a link token — fall through to the normal auth chain.
    }
  }

  return protectRoute(req, res, next);
};
