import express from "express";
import * as pageContentController from "./pageContent.controller";
import { optionalAuth, protectRoute } from "../../middlewares/auth.middleware";
import { restrictTo } from "../../middlewares/authorization.middleware";

const router = express.Router();

/**
 * The sitemap needs the list of core pages anonymously. Every other content
 * type can include draft pages, so its list is admin-only.
 */
const publicCoreListOnly = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  if (req.params.pageType === "core") return next();
  return protectRoute(req, res, (err?: any) => {
    if (err) return next(err);
    return restrictTo("admin", "superadmin")(req, res, next);
  });
};

// Public routes
// NOTE: `/type/:pageType` must be registered BEFORE `/:pageType/:pageKey`,
// otherwise Express matches "type" as the pageType and 404s.
router.get(
  "/type/:pageType",
  publicCoreListOnly,
  pageContentController.getPageContentByType,
);
router.get(
  "/:pageType/:pageKey",
  optionalAuth,
  pageContentController.getPageContentByKey,
);

// Protected routes (admin only)
router.use(protectRoute);
router.use(restrictTo("admin", "superadmin"));

router.get("/", pageContentController.getAllPageContent);
router.post("/", pageContentController.createPageContent);
router.put("/:id", pageContentController.updatePageContent);
router.put(
  "/key/:pageType/:pageKey/rename",
  pageContentController.renamePageContentByKey,
);
router.put(
  "/key/:pageType/:pageKey",
  pageContentController.upsertPageContentByKey,
);
router.delete("/:id", pageContentController.deletePageContent);

export default router;
