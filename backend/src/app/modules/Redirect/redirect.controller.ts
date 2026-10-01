import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import * as redirectService from "./redirect.service";

/**
 * Create redirect
 */
export const createRedirect = asyncHandler(
  async (req: Request, res: Response) => {
    const redirect = await redirectService.createRedirect(req.body);

    res.status(201).json({
      success: true,
      message: "Redirect created successfully",
      data: { redirect },
    });
  },
);

/**
 * Get all redirects (admin)
 */
export const getRedirects = asyncHandler(
  async (req: Request, res: Response) => {
    const filters = {
      isActive: req.query.isActive as string | undefined,
      search: req.query.search as string | undefined,
    };

    const redirects = await redirectService.getAllRedirects(filters);

    res.status(200).json({
      success: true,
      count: redirects.length,
      data: { redirects },
    });
  },
);

/**
 * Get active redirects (public, for frontend middleware)
 */
export const getActiveRedirects = asyncHandler(
  async (_req: Request, res: Response) => {
    const redirects = await redirectService.getActiveRedirects();

    res.status(200).json({
      success: true,
      count: redirects.length,
      data: { redirects },
    });
  },
);

/**
 * Get redirect by ID
 */
export const getRedirect = asyncHandler(
  async (req: Request, res: Response) => {
    const redirect = await redirectService.getRedirectById(req.params.id);

    res.status(200).json({
      success: true,
      data: { redirect },
    });
  },
);

/**
 * Update redirect
 */
export const updateRedirect = asyncHandler(
  async (req: Request, res: Response) => {
    const redirect = await redirectService.updateRedirect(
      req.params.id,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Redirect updated successfully",
      data: { redirect },
    });
  },
);

/**
 * Delete redirect
 */
export const deleteRedirect = asyncHandler(
  async (req: Request, res: Response) => {
    await redirectService.deleteRedirect(req.params.id);

    res.status(200).json({
      success: true,
      message: "Redirect deleted successfully",
    });
  },
);
