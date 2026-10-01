import Redirect, { IRedirectModel } from "./redirect.model";
import ApiError from "../../utils/apiError";
import {
  CreateRedirectData,
  UpdateRedirectData,
  RedirectFilters,
} from "./redirect.interface";

/**
 * Create redirect
 * fromPath must be unique
 */
export const createRedirect = async (
  data: CreateRedirectData,
): Promise<IRedirectModel> => {
  const exists = await Redirect.findOne({
    fromPath: data.fromPath,
  });

  if (exists) {
    throw new ApiError(
      `Redirect with fromPath "${data.fromPath}" already exists`,
      400,
    );
  }

  return await Redirect.create(data);
};

/**
 * Get all redirects with optional filters
 */
export const getAllRedirects = async (
  filters: RedirectFilters = {},
): Promise<IRedirectModel[]> => {
  const query: any = {};

  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive === "true";
  }

  if (filters.search) {
    query.$or = [
      { fromPath: { $regex: filters.search, $options: "i" } },
      { toPath: { $regex: filters.search, $options: "i" } },
      { note: { $regex: filters.search, $options: "i" } },
    ];
  }

  return Redirect.find(query).sort({ createdAt: -1 });
};

/**
 * Get redirect by ID
 */
export const getRedirectById = async (
  id: string,
): Promise<IRedirectModel> => {
  const redirect = await Redirect.findById(id);

  if (!redirect) {
    throw new ApiError("Redirect not found", 404);
  }

  return redirect;
};

/**
 * Get all active redirects (for frontend middleware)
 */
export const getActiveRedirects = async (): Promise<IRedirectModel[]> => {
  return Redirect.find({ isActive: true }).sort({ createdAt: -1 });
};

/**
 * Update redirect
 */
export const updateRedirect = async (
  id: string,
  updateData: UpdateRedirectData,
): Promise<IRedirectModel> => {
  const redirect = await Redirect.findById(id);

  if (!redirect) {
    throw new ApiError("Redirect not found", 404);
  }

  // Check for duplicate fromPath if it's being changed
  if (updateData.fromPath && updateData.fromPath !== redirect.fromPath) {
    const exists = await Redirect.findOne({
      fromPath: updateData.fromPath,
      _id: { $ne: id },
    });

    if (exists) {
      throw new ApiError(
        `Redirect with fromPath "${updateData.fromPath}" already exists`,
        400,
      );
    }
  }

  const updated = await Redirect.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    throw new ApiError("Redirect not found", 404);
  }

  return updated;
};

/**
 * Delete redirect
 */
export const deleteRedirect = async (id: string): Promise<void> => {
  const redirect = await Redirect.findByIdAndDelete(id);

  if (!redirect) {
    throw new ApiError("Redirect not found", 404);
  }
};
