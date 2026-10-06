import PageContent, { IPageContentDocument } from "./pageContent.model";
import Redirect from "../Redirect/redirect.model";
import ApiError from "../../utils/apiError";
import { CreatePageContentData, UpdatePageContentData, PageType } from "./pageContent.interface";
import { normalizeSlug } from "../../utils/slug";

/**
 * Core page keys that already have a hand-built route, so their address is
 * fixed in the code and cannot be moved from the admin. Renaming one would
 * orphan its route rather than move it.
 */
export const ROUTE_OWNED_PAGE_KEYS = new Set([
  "home",
  "contact",
  "faqs",
  "privacy-policy",
  "terms",
  "booking-catalog",
  "locations",
  "blog",
  "cart",
  "checkout",
  "profile",
]);

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
  // `pageType`/`pageKey` are identity fields supplied by the route. They must
  // not appear in `$set` as well as `$setOnInsert`, or MongoDB throws
  // "Updating the path 'pageKey' would create a conflict at 'pageKey'".
  const { pageType: _pt, pageKey: _pk, ...fields } = data as any;

  const pageContent = await PageContent.findOneAndUpdate(
    { pageType, pageKey: pageKey.toLowerCase() },
    { $set: fields, $setOnInsert: { pageType, pageKey: pageKey.toLowerCase() } },
    { new: true, upsert: true, runValidators: true },
  );

  return pageContent;
};

/**
 * Rename a core page's address, moving it and keeping the old one working.
 *
 * The page key is the address (the storefront serves core records at /<key>),
 * so a rename is a change of that field. A 301 redirect is written from the old
 * path to the new one, and any redirect that already pointed at the old path is
 * repointed so chains do not build up. Only `core` pages are movable: category
 * and location keys are tied to their products, and the route-owned core keys
 * have hand-built pages whose address lives in the code.
 */
export const renamePageContentKey = async (
  pageType: string,
  oldKey: string,
  newKey: string,
): Promise<IPageContentDocument> => {
  const from = normalizeSlug(oldKey);
  const to = normalizeSlug(newKey);

  if (pageType !== "core") {
    throw new ApiError("Only Core Pages can have their address changed", 400);
  }
  if (!from || !to) {
    throw new ApiError("A new address is required", 400);
  }
  if (ROUTE_OWNED_PAGE_KEYS.has(from)) {
    throw new ApiError(
      `/${from} is a built-in page, so its address cannot be changed`,
      400,
    );
  }
  if (ROUTE_OWNED_PAGE_KEYS.has(to)) {
    throw new ApiError(`/${to} is reserved by a built-in page`, 400);
  }
  if (from === to) {
    return getPageContentByKey(pageType, from);
  }

  const clash = await PageContent.findOne({ pageType, pageKey: to });
  if (clash) {
    throw new ApiError(`Another core page already uses /${to}`, 400);
  }

  const updated = await PageContent.findOneAndUpdate(
    { pageType, pageKey: from },
    { $set: { pageKey: to } },
    { new: true, runValidators: true },
  );
  if (!updated) {
    throw new ApiError("Page content not found", 404);
  }

  const fromPath = `/${from}`;
  const toPath = `/${to}`;

  // The new address is now a real page, so drop any redirect that pointed away
  // from it (this happens when a page is moved back to a previous address).
  await Redirect.deleteMany({ fromPath: toPath });

  // Anything that used to land on the old address should now land on the new
  // one directly, rather than hopping through the old address.
  await Redirect.updateMany({ toPath: fromPath }, { $set: { toPath } });

  await Redirect.findOneAndUpdate(
    { fromPath },
    {
      $set: {
        toPath,
        statusCode: 301,
        isActive: true,
        note: `Automatic: /${from} moved to /${to}`,
      },
    },
    { upsert: true },
  );

  return updated;
};

/**
 * Delete page content by ID. Returns the removed record so the caller can
 * revalidate the path it used to be served at.
 */
export const deletePageContent = async (
  id: string,
): Promise<IPageContentDocument> => {
  const pageContent = await PageContent.findByIdAndDelete(id);

  if (!pageContent) {
    throw new ApiError("Page content not found", 404);
  }

  return pageContent;
};
