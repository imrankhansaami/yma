import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import * as pageContentService from "./pageContent.service";
import { pageContentTag, revalidatePaths } from "../../utils/revalidate";

/**
 * Map a PageContent record to the public paths whose ISR cache it affects.
 */
const pageContentPaths = (pageType?: string, pageKey?: string): string[] => {
  const key = String(pageKey || "").trim();
  if (!key) return [];
  switch (pageType) {
    case "category":
      return ["/booking-catalog", `/booking-catalog/${key}`];
    case "location":
      return ["/locations", `/locations/${key}`];
    case "core":
    default:
      return [key === "home" ? "/" : `/${key}`];
  }
};

/**
 * Create page content
 */
export const createPageContent = asyncHandler(
  async (req: Request, res: Response) => {
    const pageContent = await pageContentService.createPageContent(req.body);

    const pageType = (pageContent as any)?.pageType ?? req.body.pageType;
    const pageKey = (pageContent as any)?.pageKey ?? req.body.pageKey;
    revalidatePaths(
      pageContentPaths(pageType, pageKey),
      [pageContentTag(pageType, pageKey)].filter(Boolean),
    );

    res.status(201).json({
      success: true,
      message: "Page content created successfully",
      data: { pageContent },
    });
  },
);

/**
 * Get all page content
 */
export const getAllPageContent = asyncHandler(
  async (req: Request, res: Response) => {
    const filters: any = {};

    if (req.query.pageType) {
      filters.pageType = req.query.pageType;
    }

    const pageContents = await pageContentService.getAllPageContent(filters);

    res.status(200).json({
      success: true,
      count: pageContents.length,
      data: { pageContents },
    });
  },
);

/**
 * Get all page content by type
 */
export const getPageContentByType = asyncHandler(
  async (req: Request, res: Response) => {
    const pageContents = await pageContentService.getAllPageContent({
      pageType: req.params.pageType as any,
    });

    res.status(200).json({
      success: true,
      count: pageContents.length,
      data: { pageContents },
    });
  },
);

/**
 * Get page content by type and key
 */
export const getPageContentByKey = asyncHandler(
  async (req: Request, res: Response) => {
    const pageContent = await pageContentService.getPageContentByKey(
      req.params.pageType,
      req.params.pageKey,
    );

    res.status(200).json({
      success: true,
      data: { pageContent },
    });
  },
);

/**
 * Update page content by ID
 */
export const updatePageContent = asyncHandler(
  async (req: Request, res: Response) => {
    const pageContent = await pageContentService.updatePageContent(
      req.params.id,
      req.body,
    );

    const pt = (pageContent as any)?.pageType;
    const pk = (pageContent as any)?.pageKey;
    revalidatePaths(pageContentPaths(pt, pk), [pageContentTag(pt, pk)].filter(Boolean));

    res.status(200).json({
      success: true,
      message: "Page content updated successfully",
      data: { pageContent },
    });
  },
);

/**
 * Upsert page content by type and key
 */
export const upsertPageContentByKey = asyncHandler(
  async (req: Request, res: Response) => {
    const pageContent = await pageContentService.updatePageContentByKey(
      req.params.pageType,
      req.params.pageKey,
      req.body,
    );

    revalidatePaths(
      pageContentPaths(req.params.pageType, req.params.pageKey),
      [pageContentTag(req.params.pageType, req.params.pageKey)].filter(Boolean),
    );

    res.status(200).json({
      success: true,
      message: "Page content updated successfully",
      data: { pageContent },
    });
  },
);

/**
 * Delete page content by ID
 */
export const deletePageContent = asyncHandler(
  async (req: Request, res: Response) => {
    await pageContentService.deletePageContent(req.params.id);

    // The record is gone, so we can no longer derive its paths; revalidate the
    // common CMS-backed routes so the page reverts to its defaults promptly.
    revalidatePaths([
      "/",
      "/faqs",
      "/contact",
      "/privacy-policy",
      "/terms",
      "/booking-catalog",
      "/locations",
    ]);

    res.status(200).json({
      success: true,
      message: "Page content deleted successfully",
    });
  },
);
