"use client";

import { Edit3, Save, Trash2, X } from "lucide-react";

import { AddProductFormData } from "@/lib/validation/addProductSchema";
import { ApiProduct, deleteProduct, updateProduct } from "@/services/product.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { MouseEvent, useMemo, useState } from "react";
import { useAdminToast } from "../../ui/admin-toast";
import { ConfirmActionModal } from "../../ui/confirm-action-modal";
import AddProductForm from "./AddProductForm";

const SAMPLE_IMAGE =
  "https://www.figma.com/api/mcp/asset/59c6bc13-24dd-47de-9891-e047e4de33a2";

interface ProductDetailsModalProps {
  product: ApiProduct;
  onClose: () => void;
  onDeleteSuccess?: () => void;
}

export default function ProductDetailsModal({
  product,
  onClose,
  onDeleteSuccess,
}: ProductDetailsModalProps) {
  const queryClient = useQueryClient();
  const { notify } = useAdminToast();

  // Status state for toggle
  const [isActive, setIsActive] = useState(product.isActive !== false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync state with prop if it changes (e.g. from query refresh)
  useMemo(() => {
    setIsActive(product.isActive !== false);
  }, [product.isActive]);

  // Map product data to form data
  const formInitialData: Partial<AddProductFormData> & {
    _id?: string;
    imageCover?: string;
    images?: string[];
    certificates?: string[];
  } = useMemo(() => {
    const dimensions = product.dimensions;
    const rawAgeRange = product.ageRange;
    const ageRange = (rawAgeRange && typeof rawAgeRange === 'object') ? rawAgeRange : {};
    const location = product.location || { country: "England", state: "London" };
    
    // Safely extracting dimensions if string or object
    let length = 10, width = 10, height = 10;
    if (dimensions && typeof dimensions === 'object') {
        length = Number(dimensions.length) || 10;
        width = Number(dimensions.width) || 10;
        height = Number(dimensions.height) || 10;
    } else if (product.size && typeof product.size === 'string') {
        length = Number(product.size.match(/(\d+)ft \(L\)/)?.[1]) || 10;
        width = Number(product.size.match(/(\d+)ft \(W\)/)?.[1]) || 10;
        height = Number(product.size.match(/(\d+)ft \(H\)/)?.[1]) || 10;
    }

    // Safely getting categories (a product can belong to several)
    const categoryIds = Array.isArray(product.categories)
        ? product.categories
            .map((cat: any) =>
                typeof cat === "string" ? cat : cat?.id || cat?._id || "",
            )
            .filter(Boolean)
        : [];

    return {
      _id: product._id || product.id,
      name: product.name,
      description: product.description || "",
      metaTitle: product.metaTitle || "",
      metaDescription: product.metaDescription || "",
      imageCoverAltText: product.imageCoverAltText || product.imageAltText || "",
      imageAltTexts: product.imageAltTexts || [],
      price: Number(product.price || product.rentalPrice || 0),
      stock: 1,
      imageCover: product.imageCover,
      images: product.images || [],
      certificates: product.certificates || [],
      
      dimensions: {
        length: length,
        width: width,
        height: height,
      },
      
      ageRange: {
        min: Number((ageRange as any)?.min ?? 3),
        max: Number((ageRange as any)?.max ?? 12),
        unit: (ageRange as any)?.unit || "years",
      },

      location: {
        country: location.country || "United Kingdom",
        state: location.state || "Greater London",
        city: location.city || "",
        postcodes: Array.isArray(location.postcodes) ? location.postcodes : [],
      },

      categories: categoryIds,
      vendor: product.vendor || "YMA",
      warehouse: product.warehouse || "yma",
      difficulty: (product.difficulty as any) || "easy",
      
      deliveryTimeFee: product.deliveryTimeFee || 0,
      collectionTimeFee: product.collectionTimeFee || 0,
      
      isSensitive: !!product.sensitiveDetails,
      sensitiveDetails: product.sensitiveDetails || "",

      availableFrom: product.availableFrom?.split('T')[0] || new Date().toISOString().split('T')[0],
      availableUntil: product.availableUntil?.split('T')[0] || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      
      qualityAssurance: {
        isCertified: true,
        certification: "ISO-9001",
        warrantyPeriod: "1 year",
      },
    };
  }, [product]);

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      notify({
        title: "Success",
        message: "Product deleted successfully",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      if (onDeleteSuccess) onDeleteSuccess();
      onClose();
    },
    onError: (error: any) => {
      notify({
        title: "Error",
        message: error?.response?.data?.message || "Failed to delete product",
        variant: "error",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: boolean) => {
      const formData = new FormData();
      formData.append("isActive", String(newStatus));
      return updateProduct(product.id || product._id || "", formData);
    },
    onSuccess: (updatedProduct) => {
      if (!updatedProduct) {
        // Fallback if the service returned undefined but didn't throw
        queryClient.invalidateQueries({ queryKey: ["admin-products"] });
        return;
      }
      setIsActive(updatedProduct.isActive !== false);
      notify({
        title: "Success",
        message: `Product ${updatedProduct.isActive !== false ? "activated" : "paused"} successfully`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (error: any) => {
      notify({
        title: "Error",
        message: error?.response?.data?.message || "Failed to update status",
        variant: "error",
      });
    },
  });

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate(product.id || product._id || "");
  };

  const handleEditClick = (event?: MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // Helper to format currency
  const formatPrice = (price?: number | null) => {
    if (price === undefined || price === null) return "$0.00";
    return `$${Number(price).toFixed(2)}`;
  };

  // Image helpers
  const mainImage = product.imageCover || (product.images && product.images.length > 0 ? product.images[0] : SAMPLE_IMAGE);
  const thumbnails = product.images ? product.images.slice(0, 4) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="relative w-[70vw] max-w-[70vw] max-h-[90vh] bg-white rounded-2xl overflow-y-auto border border-slate-200 flex flex-col [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Header + Info (sticky) */}
        <div className="sticky top-0 z-20 bg-white border-b border-brand-gray-150">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 relative">
            <div className="text-[18px] font-semibold text-brand-black-950 leading-[1.5]">
              {isEditing ? "Edit Product" : "Product Details"}
            </div>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-brand-black-950 hover:bg-white hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300 transition"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-4 border-t border-brand-gray-150 px-6 py-4">
            <div className="flex flex-col gap-1 min-w-[120px]">
              <span className="text-[14px] text-brand-gray-500">Product ID</span>
              <span className="text-[14px] font-medium text-brand-black-950">
                #{String(product.id || product._id).slice(-6).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col gap-1 min-w-[120px]">
              <span className="text-[14px] text-brand-gray-500">Rental Fee</span>
              <span className="text-[14px] font-medium text-brand-black-950">
                {formatPrice(product.price || product.rentalPrice)}
              </span>
            </div>
            <div className="flex flex-col gap-1 min-w-[120px]">
              <span className="text-[14px] text-brand-gray-500">Category</span>
              <span className="inline-block bg-brand-gray-110 text-[12px] font-medium text-brand-black-950 rounded px-2 py-0.5">
                 {Array.isArray(product.categories) && product.categories.length > 0
                    ? product.categories
                        .map((c: any) => (typeof c === "string" ? c : c?.name))
                        .filter(Boolean)
                        .join(", ")
                    : "Uncategorized"}
              </span>
            </div>
            <div className="flex flex-col gap-1 min-w-[120px]">
              <span className="text-[14px] text-brand-gray-500">Vendor</span>
              <span className="text-[14px] text-brand-black-950">
                {product.vendor || "YMA"}
              </span>
            </div>
            <div className="flex flex-col gap-1 min-w-[120px]">
              <span className="text-[14px] text-brand-gray-500">Warehouse</span>
              <span className="text-[14px] font-medium text-brand-black-950">
                {product.warehouse || product.location?.city || "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 min-w-[120px]">
              <span className="text-[14px] text-brand-gray-500">Status</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Toggle status"
                  disabled={statusMutation.isPending}
                  className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-all border border-brand-gray-150 ${
                    isActive ? "bg-brand-orange-500 justify-end" : "bg-brand-gray-150 justify-start"
                  } ${statusMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => statusMutation.mutate(!isActive)}
                >
                  <span
                    className={`w-4 h-4 rounded-full shadow transition-all ${
                      isActive ? "bg-white" : "bg-neutral-300"
                    }`}
                  />
                </button>
                <span
                  className={`text-[14px] ${isActive ? "text-brand-black-950" : "text-brand-zinc-400"}`}
                >
                  {isActive ? "Active" : "Paused"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {isEditing ? (
          <div key="edit" className="px-6 py-6">
            <AddProductForm
              isEdit={true}
              onSubmit={() => onClose()}
              initialData={formInitialData}
              onSubmittingChange={setIsSavingChanges}
            />
          </div>
        ) : (
          <div key="view">

            {/* Main Content */}
            <div className="flex gap-8 px-6 py-6">
              {/* Images */}
              <div className="flex flex-col gap-4">
                <div className="w-[10rem] h-[10rem] rounded bg-brand-gray-250 overflow-hidden flex items-center justify-center relative">
                    <Image
                      src={mainImage}
                    alt={product.imageCoverAltText || product.imageAltText || product.name}
                      fill
                      className="object-cover w-full h-full"
                    />
                </div>
                {thumbnails.length > 0 && (
                    <div className="flex gap-2 flex-wrap max-w-[10rem]">
                    {thumbnails.map((thumb, idx) => (
                        <div key={idx} className="w-8 h-8 rounded border border-brand-gray-200 overflow-hidden relative">
                            <Image
                            src={thumb}
                            alt={product.imageAltTexts?.[idx] || product.imageAltText || `${product.name} thumbnail ${idx + 1}`}
                            fill
                            className="object-cover w-full h-full"
                            />
                        </div>
                    ))}
                    </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="text-[24px] font-medium text-brand-black-950 leading-[1.35]">
                  {product.name}
                </div>
                <div className="flex gap-1">
                  <span className="text-[14px] font-medium text-brand-black-950">
                    Dimensions:
                  </span>
                  <span className="text-[14px] text-brand-gray-500">
                    {product.dimensions 
                        ? `${product.dimensions.length}ft (L) x ${product.dimensions.width}ft (W) x ${product.dimensions.height}ft (H)`
                        : product.size || "N/A"
                    }
                  </span>
                </div>
                 <div className="flex gap-1">
                  <span className="text-[14px] font-medium text-brand-black-950">
                    Age Range:
                  </span>
                  <span className="text-[14px] text-brand-gray-500">
                    {typeof product.ageRange === 'object' && product.ageRange 
                        ? `${product.ageRange.min} - ${product.ageRange.max} ${product.ageRange.unit}`
                        : product.ageRange || "N/A"
                    }
                  </span>
                </div>
                <div className="flex gap-1">
                  <span className="text-[14px] font-medium text-brand-black-950">
                    Delivery & Collection:
                  </span>
                  <span className="text-[14px] text-brand-gray-500">
                    {product.deliveryAndCollection || 
                     `Delivery: ${product.deliveryTimeFee ? `£${product.deliveryTimeFee}` : 'Free'}. Collection: ${product.collectionTimeFee ? `£${product.collectionTimeFee}` : 'Free'}.`
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Description & Specs */}
            <div className="px-6 pb-6 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="text-[18px] font-medium text-brand-black-950">
                  Description
                </div>
                {/* Ideally this should be a sanitized HTML renderer if description is rich text */}
                <div 
                    className="text-sm text-brand-gray-500 prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.description || "No description provided." }}
                />
              </div>

              {/* Sensitive Notice */}
              {product.sensitiveDetails && (
                <div className="flex flex-col gap-2 bg-brand-orange-50/50 p-4 rounded-lg border border-brand-orange-100">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-brand-orange-500 shrink-0">
                            <path d="M18.1085 15L11.4419 3.33332C11.2965 3.07682 11.0857 2.86347 10.831 2.71504C10.5762 2.56661 10.2867 2.4884 9.99185 2.4884C9.69703 2.4884 9.40748 2.56661 9.15275 2.71504C8.89802 2.86347 8.68722 3.07682 8.54185 3.33332L1.87519 15C1.72825 15.2544 1.65121 15.5432 1.65186 15.8371C1.65251 16.1309 1.73083 16.4194 1.87889 16.6732C2.02695 16.927 2.23948 17.1371 2.49493 17.2823C2.75039 17.4275 3.03969 17.5026 3.33352 17.5H16.6669C16.9593 17.4997 17.2465 17.4225 17.4996 17.2761C17.7527 17.1297 17.9629 16.9192 18.1089 16.6659C18.255 16.4126 18.3319 16.1253 18.3318 15.8329C18.3317 15.5405 18.2547 15.2532 18.1085 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M10 7.5V10.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M10 14.1666H10.0083" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div className="text-[16px] font-medium text-brand-black-950">
                            Sensitive Product Warranty Details
                        </div>
                    </div>
                    <div 
                        className="text-[14px] text-brand-black-950 prose max-w-none prose-sm"
                        dangerouslySetInnerHTML={{ __html: product.sensitiveDetails }}
                    />
                </div>
              )}

              {/* Location/Coverage */}
              <div className="flex flex-col gap-2">
                <div className="text-[18px] font-medium text-brand-black-950">
                  Location
                </div>
                <div className="text-[14px] text-brand-gray-500">
                    {product.location?.city}, {product.location?.state}, {product.location?.country}
                </div>
              </div>

              {Array.isArray(product.certificates) && product.certificates.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-[18px] font-medium text-brand-black-950">
                    Certificates
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {product.certificates.map((certificate, index) => {
                      const isPdf =
                        certificate?.startsWith("data:application/pdf") ||
                        certificate?.toLowerCase().includes(".pdf");
                      return (
                        <a
                          key={`${certificate.slice(0, 20)}-${index}`}
                          href={certificate}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-[10px] border border-brand-gray-150 bg-white p-1.5 text-[12px] text-brand-black-950 hover:bg-brand-gray-50"
                        >
                          {isPdf ? (
                            <div className="aspect-square w-full max-w-[110px] overflow-hidden rounded-[8px] border border-brand-gray-100 bg-brand-gray-50 mx-auto">
                              <iframe
                                src={certificate}
                                title={`Certificate ${index + 1}`}
                                className="h-full w-full"
                              />
                            </div>
                          ) : (
                            <div className="relative aspect-square w-full max-w-[110px] overflow-hidden rounded-[8px] border border-brand-gray-100 bg-brand-gray-50 mx-auto">
                              <Image
                                src={certificate}
                                alt={`Certificate ${index + 1}`}
                                fill
                                className="object-contain p-2"
                              />
                            </div>
                          )}
                          <div className="mt-1 text-[11px] text-center">
                            Certificate {index + 1} {isPdf ? "(PDF)" : "(Image)"}
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions - fixed, pixel-perfect, Figma icons */}
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-brand-gray-150 px-6 py-4 flex items-center justify-between gap-4 z-10">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex items-center gap-2 border border-brand-gray-260 rounded-md px-4 py-2 shadow-xs text-[14px] text-brand-ink-950 bg-white hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-product-form"
                disabled={isSavingChanges}
                className="flex items-center gap-2 rounded-md px-4 py-2 text-[14px] text-white bg-brand-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSavingChanges ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 border border-brand-gray-260 rounded-md px-4 py-2 shadow-xs text-[14px] text-brand-ink-950 bg-white hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteMutation.isPending ? "Deleting..." : <><Trash2 className="w-4 h-4" /> Delete Product</>}
              </button>
              <button
                type="button"
                onClick={handleEditClick}
                className="flex items-center gap-2 rounded-md px-4 py-2 text-[14px] text-white bg-brand-orange-500 hover:bg-orange-600"
              >
                <Edit3 className="w-4 h-4" /> Edit Product
              </button>
            </>
          )}
        </div>
      </div>

      <ConfirmActionModal
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Product"
        description={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
        confirmLabel="Delete Product"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
