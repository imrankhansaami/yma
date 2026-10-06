import express from "express";
import * as pageContentController from "./pageContent.controller";
import { protectRoute } from "../../middlewares/auth.middleware";
import { restrictTo } from "../../middlewares/authorization.middleware";

const router = express.Router();

// Public routes
// NOTE: `/type/:pageType` must be registered BEFORE `/:pageType/:pageKey`,
// otherwise Express matches "type" as the pageType and 404s.
router.get("/type/:pageType", pageContentController.getPageContentByType);
router.get("/:pageType/:pageKey", pageContentController.getPageContentByKey);

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
