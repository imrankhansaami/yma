import PageContent, { IPageContentDocument } from "./pageContent.model";
import ApiError from "../../utils/apiError";
import { CreatePageContentData, UpdatePageContentData, PageType } from "./pageContent.interface";

/**
 * Create page content
 */
export const createPageContent = async (
  data: CreatePageContentData,
): Promise<IPageContentDocument> => {
  const exists = await PageContent.findOne({
    pageType: data.pageType,
    pageKey: data.pageKey,
  });

  if (exists) {
    throw new ApiError(
      `Page content for "${data.pageType}/${data.pageKey}" already exists`,
      400,
    );
  }

  return await PageContent.create(data);
};

/**
 * Get all page content, optionally filtered by pageType
 */
export const getAllPageContent = async (
  filters: { pageType?: PageType } = {},
): Promise<IPageContentDocument[]> => {
  const query: any = {};

  if (filters.pageType) {
    query.pageType = filters.pageType;
  }

  return PageContent.find(query).sort({ pageType: 1, pageKey: 1 });
};

/**
 * Get single page content by pageType and pageKey
 */
export const getPageContentByKey = async (
  pageType: string,
  pageKey: string,
): Promise<IPageContentDocument> => {
  const pageContent = await PageContent.findOne({
    pageType,
    pageKey: pageKey.toLowerCase(),
  });

  if (!pageContent) {
    throw new ApiError(
      `Page content for "${pageType}/${pageKey}" not found`,
      404,
    );
  }

  return pageContent;
};

/**
 * Update page content by ID
 */
export const updatePageContent = async (
  id: string,
  updateData: UpdatePageContentData,
): Promise<IPageContentDocument> => {
  const pageContent = await PageContent.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!pageContent) {
    throw new ApiError("Page content not found", 404);
  }

  return pageContent;
};

/**
 * Upsert page content by pageType and pageKey
 */
export const updatePageContentByKey = async (
  pageType: string,
  pageKey: string,
  data: UpdatePageContentData,
): Promise<IPageContentDocument> => {
  const pageContent = await PageContent.findOneAndUpdate(
    { pageType, pageKey: pageKey.toLowerCase() },
    { $set: data, $setOnInsert: { pageType, pageKey: pageKey.toLowerCase() } },
    { new: true, upsert: true, runValidators: true },
  );

  return pageContent;
};

/**
 * Delete page content by ID
 */
export const deletePageContent = async (id: string): Promise<void> => {
  const pageContent = await PageContent.findByIdAndDelete(id);

  if (!pageContent) {
    throw new ApiError("Page content not found", 404);
  }
};
