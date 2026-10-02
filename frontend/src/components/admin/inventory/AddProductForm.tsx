"use client";

import {
  AddProductFormData,
  addProductSchema,
} from "@/lib/validation/addProductSchema";
import { fetchCategories } from "@/services/category.service";
import { fetchLocations } from "@/services/location.service";
import { createProduct, updateProduct } from "@/services/product.service";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Euro, Plus, X, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useAdminToast } from "../../ui/admin-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Checkbox } from "../../ui/checkbox";
import { SuccessModal } from "../../ui/success-modal";
import ImageUpload from "./ImageUpload";
import LocationPostcodePicker from "./LocationPostcodePicker";
import TextEditor from "./TextEditor";

interface AddProductFormProps {
  onSubmit?: (data: AddProductFormData) => void;
  initialData?: Partial<AddProductFormData> & {
    _id?: string;
    imageCover?: string;
    images?: string[];
    certificates?: string[];
  };
  isEdit?: boolean;
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

const DEFAULT_SENSITIVE_DETAILS = `For our <strong>white or light-coloured bouncy castles,</strong> extra care is required as these colours can easily get stained or marked by food, cakes, drinks, mud, colouring, or any kind of misuse.

To maintain their quality, we require a <strong>refundable deposit of 20%</strong> of the rental price.

How it works:
<ul>
<li>You pay an additional <strong>20% deposit when receiving the delivery</strong> of the bouncy castle.</li>
<li>Our team will inspect the castle during pickup.</li>
<li><strong>If the product has no stains, marks, or damage,</strong> the full deposit will be <strong>refunded immediately</strong> at pickup.</li>
<li>If any stains, food spills, colouring, damage, or misuse is found, the deposit will not be refunded to cover cleaning or repair costs.</li>
</ul>

This policy helps us keep our premium light-colored castles clean, safe, and beautiful for all children to enjoy.`;

const AddProductForm: React.FC<AddProductFormProps> = ({
  onSubmit,
  initialData,
  isEdit = false,
  onSubmittingChange,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useAdminToast();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Image States (File | string)
  const [coverImage, setCoverImage] = useState<(File | string)[]>([]);
  const [galleryImages, setGalleryImages] = useState<(File | string)[]>([]);
  const [certificates, setCertificates] = useState<(File | string)[]>([]);
  
  const [newSafetyFeature, setNewSafetyFeature] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Initialize images from initialData
  useEffect(() => {
    if (initialData?.imageCover) {
      setCoverImage([initialData.imageCover]);
    }
    if (initialData?.images && Array.isArray(initialData.images)) {
      setGalleryImages(initialData.images);
    }
    if (initialData?.certificates && Array.isArray(initialData.certificates)) {
      setCertificates(initialData.certificates);
    }
    if (isEdit && initialData?.slug) {
      setSlugManuallyEdited(true);
    }
  }, [initialData, isEdit]);

  // Queries
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // Mutation
  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      if (isEdit && initialData?._id) {
        return updateProduct(initialData._id, formData);
      }
      return createProduct(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      if (isEdit) {
        setShowSuccessModal(true);
        return;
      }
      router.push("/admin/inventory");
    },
    onError: (error: any) => {
      notify({
        title: "Error",
        message: error?.response?.data?.message || "Failed to process product",
        variant: "error",
      });
    },
  });

  useEffect(() => {
    onSubmittingChange?.(mutation.isPending);
  }, [mutation.isPending, onSubmittingChange]);

  const defaultValues = useMemo(() => {
    return {
      name: "",
      description: "",
      metaTitle: "",
      metaDescription: "",
      imageCoverAltText: "",
      imageAltTexts: [],
      stock: 1,
      price: 0,
      deliveryTimeFee: 50,
      collectionTimeFee: 0,
      difficulty: "easy",
      vendor: "YMA",
      warehouse: "yma",
      safetyFeatures: [],
      categories: [],
      isSensitive: false,
      sensitiveDetails: DEFAULT_SENSITIVE_DETAILS,
      qualityAssurance: {
        isCertified: true,
        certification: "ISO-9001",
        warrantyPeriod: "1 year",
      },
      ageRange: {
        min: 3,
        max: 12,
        unit: "years",
      },
      location: {
        country: "United Kingdom",
        state: "Greater London",
        city: "",
        postcodes: [],
      },
      dimensions: {
        length: 10,
        width: 10,
        height: 10,
      },
      availableFrom: new Date().toISOString().split('T')[0],
      availableUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      certificates: [],
      ...initialData,
    };
  }, [initialData]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
    reset,
  } = useForm<AddProductFormData>({
    resolver: yupResolver(addProductSchema),
    defaultValues: defaultValues as any,
  });

  useEffect(() => {
    if (initialData) {
        reset(defaultValues as any);
    }
  }, [defaultValues, reset, initialData]);

  // Watchers
  const description = watch("description") || "";
  const sensitiveDetails = watch("sensitiveDetails") || "";
  const selectedCategories = watch("categories") || [];
  const isSensitive = watch("isSensitive");
  const safetyFeatures = watch("safetyFeatures") || [];
  const watchedImageAltTexts = watch("imageAltTexts");
  const watchedName = watch("name");

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => fetchLocations({ page: 1, limit: 100 }),
  });

  // --- Internal size ---------------------------------------------------------
  // Kept in L/W/H text form so the admin can adjust it by hand. Auto-filled from
  // the structured dimensions, but only while the admin has not customised it:
  // once the value differs from the last generated one it is left alone.
  const watchedSize = watch("size") || "";
  const watchedLength = watch("dimensions.length");
  const watchedWidth = watch("dimensions.width");
  const watchedHeight = watch("dimensions.height");
  const autoSizeRef = React.useRef("");

  useEffect(() => {
    const length = Number(watchedLength);
    const width = Number(watchedWidth);
    const height = Number(watchedHeight);
    if (!(length > 0 && width > 0 && height > 0)) return;

    const generated = `${length}ft x ${width}ft x ${height}ft`;
    const current = String(watchedSize || "").trim();
    if (!current || current === autoSizeRef.current) {
      autoSizeRef.current = generated;
      setValue("size", generated, { shouldDirty: true });
    }
  }, [watchedLength, watchedWidth, watchedHeight, watchedSize, setValue]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const watchedSlug = watch("slug");

  // Auto-generate slug from product name (only if user hasn't manually edited it)
  useEffect(() => {
    if (slugManuallyEdited) return;
    const generated = (watchedName || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setValue("slug", generated, { shouldValidate: false });
  }, [watchedName, slugManuallyEdited, setValue]);

  useEffect(() => {
    const currentAltTexts = watchedImageAltTexts ?? [];
    if (galleryImages.length === currentAltTexts.length) return;
    const normalized = Array.from({ length: galleryImages.length }, (_, idx) => currentAltTexts[idx] || "");
    setValue("imageAltTexts", normalized, { shouldValidate: false });
  }, [galleryImages.length, watchedImageAltTexts, setValue]);

  const handleFormSubmit = (data: AddProductFormData) => {
    // Validation for images
    if (coverImage.length === 0) {
      notify({ title: "Error", message: "Cover image is required", variant: "error" });
      return;
    }

    const formData = new FormData();

    // Basic Information
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("metaTitle", data.metaTitle || "");
    formData.append("metaDescription", data.metaDescription || "");
    formData.append("imageCoverAltText", data.imageCoverAltText || "");
    if (data.slug) formData.append("slug", data.slug);
    if (data.canonicalUrl) formData.append("canonicalUrl", data.canonicalUrl);
    if (data.customJsonLd) formData.append("customJsonLd", data.customJsonLd);
    formData.append("price", String(data.price));
    formData.append("stock", "1");
    formData.append("isActive", "true");

    // Dimensions - Try brackets for safer nesting
    formData.append("dimensions[length]", String(data.dimensions.length));
    formData.append("dimensions[width]", String(data.dimensions.width));
    formData.append("dimensions[height]", String(data.dimensions.height));

    // Internal size (L/W/H text). Drives big/small ordering and the Size filter.
    if (data.size) formData.append("size", String(data.size));

    // Age Range - Try brackets for safer nesting
    formData.append("ageRange[min]", String(data.ageRange.min));
    formData.append("ageRange[max]", String(data.ageRange.max));
    formData.append("ageRange[unit]", "years");

    // Location
    formData.append("location[country]", data.location.country || "United Kingdom");
    formData.append("location[state]", data.location.state || "Greater London");
    // Postcode districts this product covers, sent as an indexed array so the
    // backend's bracketed-field expander turns them into a real array.
    (data.location.postcodes || []).forEach((code, index) => {
      if (String(code).trim()) {
        formData.append(`location[postcodes][${index}]`, String(code).trim());
      }
    });
    // Keep the legacy single-value field populated with the first postcode so
    // older readers of location.city still resolve something sensible.
    const primaryPostcode = (data.location.postcodes || [])[0];
    if (primaryPostcode) formData.append("location[city]", String(primaryPostcode));

    // Organization — a product may belong to several categories.
    (data.categories || []).forEach((categoryId, index) => {
      formData.append(`categories[${index}]`, categoryId);
    });
    formData.append("vendor", data.vendor || "YMA");
    formData.append("warehouse", data.warehouse || "yma");
    formData.append("difficulty", data.difficulty || "easy");

    // Fees & Time
    formData.append("deliveryTimeFee", String(data.deliveryTimeFee));
    formData.append("collectionTimeFee", String(data.collectionTimeFee));
    
    // Dates
    const fromDate = new Date(data.availableFrom);
    const untilDate = new Date(data.availableUntil);
    formData.append("availableFrom", fromDate.toISOString());
    formData.append("availableUntil", untilDate.toISOString());

    // Quality Assurance & Safety
    formData.append("qualityAssurance[isCertified]", String(data.qualityAssurance.isCertified));
    formData.append("qualityAssurance[certification]", data.qualityAssurance.certification || "");
    formData.append("qualityAssurance[warrantyPeriod]", data.qualityAssurance.warrantyPeriod || "");
    
    if (data.isSensitive) {
        formData.append("qualityAssurance[warrantyDetails]", data.sensitiveDetails);
    } else {
        formData.append("qualityAssurance[warrantyDetails]", "");
    }

    // Safety Features
    data.safetyFeatures
      ?.filter((feature): feature is string => Boolean(feature))
      .forEach((feature, index) => {
        formData.append(`safetyFeatures[${index}]`, feature);
      });

    // Images Handling
    // For PATCH/Update, backend might expect strings for existing images or just files for new ones
    // We'll append all as 'images' or 'imageCover'. If it's a string, we send it as a string field.
    
    // Image Cover
    if (coverImage[0] instanceof File) {
      formData.append("imageCover", coverImage[0]);
    } else if (typeof coverImage[0] === "string") {
      formData.append("imageCover", coverImage[0]);
    }

    // Gallery Images
    galleryImages.forEach((img) => {
      if (img instanceof File) {
        formData.append("images", img);
      } else if (typeof img === "string") {
        formData.append("images", img);
      }
    });

    (data.imageAltTexts || []).forEach((alt, index) => {
      formData.append(`imageAltTexts[${index}]`, alt || "");
    });

    const existingCertificates = certificates.filter(
      (certificate): certificate is string => typeof certificate === "string",
    );
    const newCertificateFiles = certificates.filter(
      (certificate): certificate is File => certificate instanceof File,
    );

    if (isEdit) {
      formData.append("existingCertificates", JSON.stringify(existingCertificates));
    }

    newCertificateFiles.forEach((file) => {
      formData.append("certificates", file);
    });

    mutation.mutate(formData);
  };

  const handleCertificatesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const selected = Array.from(files).slice(0, Math.max(0, 5 - certificates.length));
    if (selected.length === 0) return;
    setCertificates((prev) => [...prev, ...selected]);
    event.target.value = "";
  };

  const removeCertificate = (index: number) => {
    setCertificates((prev) => prev.filter((_, i) => i !== index));
  };

  const isPdfCertificate = (value: File | string) => {
    if (value instanceof File) return value.type === "application/pdf";
    return value.startsWith("data:application/pdf") || value.toLowerCase().includes(".pdf");
  };

  const handleAddSafetyFeature = () => {
    if (newSafetyFeature.trim()) {
        const updatedFeatures = [...safetyFeatures, newSafetyFeature.trim()];
        setValue("safetyFeatures", updatedFeatures);
        setNewSafetyFeature("");
    }
  };

  const handleRemoveSafetyFeature = (index: number) => {
      const updatedFeatures = safetyFeatures.filter((_, i) => i !== index);
      setValue("safetyFeatures", updatedFeatures);
  };

  return (
    <form
      id="add-product-form"
      onSubmit={handleSubmit(handleFormSubmit)}
      className={`flex gap-[16px] w-full items-start relative ${mutation.isPending ? "opacity-70 pointer-events-none" : ""}`}
    >
      {mutation.isPending && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2 bg-white p-4 rounded-lg shadow-lg border border-brand-gray-100">
            <div className="w-6 h-6 border-2 border-brand-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-brand-black-950">
              {isEdit ? "Updating Product..." : "Saving Product..."}
            </p>
          </div>
        </div>
      )}
      {/* Left Column */}
      <div className="flex flex-col gap-[16px] w-[70%]">
        {/* Product Information */}
        <div className="bg-white p-[16px] rounded-[8px] shadow-sm flex flex-col gap-[16px]">
          <p className="text-[16px] font-medium leading-[1.5] text-brand-black-950">
            Product Information
          </p>

          {/* Title */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[14px] font-medium text-brand-black-950">
              Name
            </label>
            <input
              {...register("name")}
              type="text"
              placeholder="Enter product name"
              className={`bg-white border ${errors.name ? "border-red-500" : "border-brand-gray-125"} rounded-[8px] px-[12px] py-[7px] text-[14px] text-brand-black-950 focus:outline-none focus:border-brand-orange-500`}
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>

          {/* URL Slug */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[14px] font-medium text-brand-black-950">
              URL Slug
            </label>
            <input
              {...register("slug")}
              type="text"
              placeholder="product-url-slug"
              onChange={(e) => {
                setSlugManuallyEdited(true);
                setValue("slug", e.target.value, { shouldValidate: false });
              }}
              className={`bg-white border ${errors.slug ? "border-red-500" : "border-brand-gray-125"} rounded-[8px] px-[12px] py-[7px] text-[14px] text-brand-black-950 focus:outline-none focus:border-brand-orange-500`}
            />
            <p className="text-brand-gray-500 text-xs">Auto-generated from name. Edit to customize.</p>
            {errors.slug && <p className="text-red-500 text-xs">{errors.slug.message}</p>}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[14px] font-medium text-brand-black-950">
              Description
            </label>
            <TextEditor
              value={description}
              onChange={(value: string) => setValue("description", value)}
              error={errors.description?.message}
            />
          </div>

          <div className="grid grid-cols-1 gap-[8px]">
            <div className="flex flex-col gap-[6px]">
              <label className="text-[14px] font-medium text-brand-black-950">
                Meta Title (SEO)
              </label>
              <input
                {...register("metaTitle")}
                type="text"
                placeholder="SEO title for search engines"
                className={`bg-white border ${errors.metaTitle ? "border-red-500" : "border-brand-gray-125"} rounded-[8px] px-[12px] py-[7px] text-[14px] text-brand-black-950 focus:outline-none focus:border-brand-orange-500`}
              />
              {errors.metaTitle && <p className="text-red-500 text-xs">{errors.metaTitle.message}</p>}
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className="text-[14px] font-medium text-brand-black-950">
                Meta Description (SEO)
              </label>
              <textarea
                {...register("metaDescription")}
                rows={3}
                placeholder="SEO description for search engines"
                className={`bg-white border ${errors.metaDescription ? "border-red-500" : "border-brand-gray-125"} rounded-[8px] px-[12px] py-[7px] text-[14px] text-brand-black-950 focus:outline-none focus:border-brand-orange-500`}
              />
              {errors.metaDescription && <p className="text-red-500 text-xs">{errors.metaDescription.message}</p>}
            </div>

          </div>

           {/* Age Range */}
           <div className="flex gap-[8px]">
            <div className="flex-1 flex flex-col gap-[6px]">
                <label className="text-[14px] font-medium text-brand-black-950">Min Age (Years)</label>
                <input
                    {...register("ageRange.min")}
                    type="number"
                    className="bg-white border border-brand-gray-125 rounded-[8px] px-[12px] py-[7px] text-[14px] focus:outline-none focus:border-brand-orange-500"
                />
                 {errors.ageRange?.min && <p className="text-red-500 text-xs">{errors.ageRange.min.message}</p>}
            </div>
            <div className="flex-1 flex flex-col gap-[6px]">
                <label className="text-[14px] font-medium text-brand-black-950">Max Age (Years)</label>
                <input
                    {...register("ageRange.max")}
                    type="number"
                    className="bg-white border border-brand-gray-125 rounded-[8px] px-[12px] py-[7px] text-[14px] focus:outline-none focus:border-brand-orange-500"
                />
                {errors.ageRange?.max && <p className="text-red-500 text-xs">{errors.ageRange.max.message}</p>}
            </div>
           </div>

           {/* Dimensions */}
           <div className="flex gap-[8px]">
            <div className="flex-1 flex flex-col gap-[6px]">
                <label className="text-[14px] font-medium text-brand-black-950">Length (Ft)</label>
                <input
                    {...register("dimensions.length")}
                    type="number"
                    className="bg-white border border-brand-gray-125 rounded-[8px] px-[12px] py-[7px] text-[14px] focus:outline-none focus:border-brand-orange-500"
                />
            </div>
            <div className="flex-1 flex flex-col gap-[6px]">
                <label className="text-[14px] font-medium text-brand-black-950">Width (Ft)</label>
                <input
                    {...register("dimensions.width")}
                    type="number"
                    className="bg-white border border-brand-gray-125 rounded-[8px] px-[12px] py-[7px] text-[14px] focus:outline-none focus:border-brand-orange-500"
                />
            </div>
            <div className="flex-1 flex flex-col gap-[6px]">
                <label className="text-[14px] font-medium text-brand-black-950">Height (Ft)</label>
                <input
                    {...register("dimensions.height")}
                    type="number"
                    className="bg-white border border-brand-gray-125 rounded-[8px] px-[12px] py-[7px] text-[14px] focus:outline-none focus:border-brand-orange-500"
                />
            </div>
           </div>
           {errors.dimensions && <p className="text-red-500 text-xs">All dimensions are required</p>}

           {/* Internal size — not shown to customers */}
           <div className="flex flex-col gap-[6px]">
             <label className="text-[14px] font-medium text-brand-black-950">
               Size (internal)
             </label>
             <input
               {...register("size")}
               type="text"
               placeholder="e.g. 27ft x 9.5ft x 11ft"
               className="bg-white border border-brand-gray-125 rounded-[8px] px-[12px] py-[7px] text-[14px] focus:outline-none focus:border-brand-orange-500"
             />
             <p className="text-[12px] text-brand-gray-500">
               Length x Width x Height. Not displayed to customers — it is used to
               order products (large/small) and to power the Size filter. Filled in
               automatically from the dimensions above.
             </p>
             {errors.size && (
               <p className="text-red-500 text-xs">{errors.size.message as string}</p>
             )}
           </div>


          {/* Sensitive Product Checkbox */}
          <div className="flex gap-[8px] items-center py-[6px]">
             <Checkbox 
                id="isSensitive"
                checked={isSensitive} 
                onCheckedChange={(checked) => setValue("isSensitive", checked as boolean)}
            />
             <label htmlFor="isSensitive" className="text-[14px] font-normal leading-[20px] text-brand-ink-950 cursor-pointer">
              Mark as sensitive product (Requires Warranty/Deposit Details)
            </label>
          </div>

          {/* Sensitive Product Details */}
          {isSensitive && (
            <div className="flex flex-col gap-[6px]">
              <label className="text-[14px] font-medium text-brand-black-950">
                Sensitive Product Warranty Details
              </label>
              <TextEditor
                value={sensitiveDetails}
                onChange={(value: string) => setValue("sensitiveDetails", value)}
              />
            </div>
          )}
          
           {/* Safety Features */}
           <div className="flex flex-col gap-[6px]">
                <label className="text-[14px] font-medium text-brand-black-950">
                  Safety Features{" "}
                  <span className="font-normal text-brand-gray-500">
                    (optional)
                  </span>
                </label>
                <p className="text-[12px] text-brand-gray-500">
                  Add short safety notes shown on the product page — for example
                  &ldquo;PIPA certified&rdquo;, &ldquo;Safety mats
                  included&rdquo; or &ldquo;Fully insured&rdquo;. Type a note and
                  press Enter.
                </p>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newSafetyFeature} 
                        onChange={(e) => setNewSafetyFeature(e.target.value)}
                        placeholder="e.g. PIPA certified"
                        className="flex-1 bg-white border border-brand-gray-125 rounded-[8px] px-[12px] py-[7px] text-[14px] focus:outline-none focus:border-brand-orange-500"
                        onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddSafetyFeature(); }}}
                    />
                    <button type="button" onClick={handleAddSafetyFeature} className="bg-brand-gray-100 hover:bg-brand-gray-200 p-2 rounded-md">
                        <Plus className="w-5 h-5 text-brand-black-950" />
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    {safetyFeatures.map((feature, index) => (
                        <div key={index} className="bg-brand-orange-50 border border-brand-orange-200 text-brand-orange-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                            {feature}
                            <button type="button" onClick={() => handleRemoveSafetyFeature(index)}>
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
           </div>
        </div>

        <div className="bg-white p-[16px] rounded-[8px] shadow-sm flex flex-col gap-[12px]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[16px] font-medium leading-[1.5] text-brand-black-950">
              Product Certificates (Image/PDF)
            </p>
            <label className="inline-flex cursor-pointer items-center rounded-[8px] border border-brand-gray-200 bg-brand-gray-50 px-3 py-1.5 text-[13px] font-medium text-brand-black-950 hover:bg-brand-gray-100">
              Upload Certificate
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleCertificatesChange}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-[12px] text-brand-gray-500">
            Upload up to 5 files. Supported formats: image and PDF.
          </p>
          {certificates.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {certificates.map((certificate, index) => {
                const name =
                  certificate instanceof File
                    ? certificate.name
                    : `Certificate ${index + 1}`;
                const isPdf = isPdfCertificate(certificate);
                return (
                  <div
                    key={`${name}-${index}`}
                    className="flex items-center justify-between rounded-[8px] border border-brand-gray-150 bg-brand-gray-25 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-brand-gray-500" />
                      <span className="truncate text-[13px] text-brand-black-950">
                        {name} {isPdf ? "(PDF)" : "(Image)"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCertificate(index)}
                      className="ml-3 rounded-[6px] p-1 text-brand-gray-500 hover:bg-brand-gray-100 hover:text-brand-black-950"
                      aria-label={`Remove certificate ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[13px] text-brand-gray-500">No certificate uploaded yet.</p>
          )}
        </div>

        {/* Images */}
        <ImageUpload 
            title="Cover Image (Required)" 
            images={coverImage} 
            onImagesChange={setCoverImage} 
            maxImages={1} 
            showImageNumbers={false}
        />
        <div className="bg-white p-[16px] rounded-[8px] shadow-sm flex flex-col gap-[8px]">
          <label className="text-[14px] font-medium text-brand-black-950">
            Cover Image Alt Text (SEO)
          </label>
          <input
            {...register("imageCoverAltText")}
            type="text"
            placeholder="Alt text for selected cover image"
            className={`bg-white border ${errors.imageCoverAltText ? "border-red-500" : "border-brand-gray-125"} rounded-[8px] px-[12px] py-[7px] text-[14px] text-brand-black-950 focus:outline-none focus:border-brand-orange-500`}
          />
          {errors.imageCoverAltText && <p className="text-red-500 text-xs">{errors.imageCoverAltText.message}</p>}
        </div>

        <ImageUpload 
            title="Product Gallery Images" 
            images={galleryImages} 
            onImagesChange={setGalleryImages} 
            maxImages={5} 
        />
        {galleryImages.length > 0 && (
          <div className="bg-white p-[16px] rounded-[8px] shadow-sm flex flex-col gap-[10px]">
            <p className="text-[14px] font-medium text-brand-black-950">
              Gallery Image Alt Texts (SEO)
            </p>
            {galleryImages.map((_, index) => (
              <div key={index} className="flex flex-col gap-[6px]">
                <label className="text-[13px] font-medium text-brand-black-950">
                  Image {index + 1} Alt Text
                </label>
                <input
                  {...register(`imageAltTexts.${index}` as const)}
                  type="text"
                  placeholder={`Alt text for gallery image ${index + 1}`}
                  className="bg-white border border-brand-gray-125 rounded-[8px] px-[12px] py-[7px] text-[14px] text-brand-black-950 focus:outline-none focus:border-brand-orange-500"
                />
              </div>
            ))}
          </div>
        )}

        {/* Location */}
        <div className="bg-white p-[16px] rounded-[8px] shadow-sm flex flex-col gap-[16px]">
          <p className="text-[16px] font-medium text-brand-black-950">Product Location</p>

          {/* Single control: the postcode districts this product covers.
              Country/state are no longer shown; they are submitted as defaults
              so a location created here still has a region. */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[14px] font-medium text-brand-black-950">
              Location <span className="text-red-500">*</span>
            </label>
            <Controller
              control={control}
              name="location.postcodes"
              render={({ field }) => (
                <LocationPostcodePicker
                  values={Array.isArray(field.value) ? field.value : []}
                  onChange={(next) => field.onChange(next)}
                  locations={(locations as any[]).map((loc, i) => ({
                    id: loc.id ?? String(i),
                    name: loc.name ?? "",
                    postcode: loc.city ?? "",
                    state: loc.state ?? "",
                  }))}
                  country={watch("location.country")}
                  state={watch("location.state")}
                />
              )}
            />
            <p className="text-[12px] text-brand-gray-500">
              Tick every postcode this product covers. Use the search box to
              filter, create a new one, or delete one with the bin icon.
            </p>
            {errors.location?.postcodes && (
              <p className="text-red-500 text-xs">
                {errors.location.postcodes.message as string}
              </p>
            )}
          </div>
        </div>

        {/* SEO Advanced */}
        <div className="bg-white p-[16px] rounded-[8px] shadow-sm flex flex-col gap-[16px]">
          <p className="text-[16px] font-medium text-brand-black-950">SEO Advanced</p>

          <div className="flex flex-col gap-[6px]">
            <label className="text-[14px] font-medium text-brand-black-950">
              Canonical URL
            </label>
            <input
              {...register("canonicalUrl")}
              type="text"
              placeholder="https://example.com/products/my-product"
              className={`bg-white border ${errors.canonicalUrl ? "border-red-500" : "border-brand-gray-125"} rounded-[8px] px-[12px] py-[7px] text-[14px] text-brand-black-950 focus:outline-none focus:border-brand-orange-500`}
            />
            <p className="text-brand-gray-500 text-xs">Optional. Override the default canonical URL for this product.</p>
            {errors.canonicalUrl && <p className="text-red-500 text-xs">{errors.canonicalUrl.message}</p>}
          </div>

          <div className="flex flex-col gap-[6px]">
            <label className="text-[14px] font-medium text-brand-black-950">
              Custom Schema (JSON-LD)
            </label>
            <textarea
              {...register("customJsonLd")}
              rows={5}
              placeholder='{"@context": "https://schema.org", ...}'
              className={`bg-white border ${errors.customJsonLd ? "border-red-500" : "border-brand-gray-125"} rounded-[8px] px-[12px] py-[7px] text-[14px] text-brand-black-950 font-mono focus:outline-none focus:border-brand-orange-500`}
            />
            <p className="text-brand-gray-500 text-xs">Optional. Add custom JSON-LD structured data for this product.</p>
            {errors.customJsonLd && <p className="text-red-500 text-xs">{errors.customJsonLd.message}</p>}
          </div>
        </div>

      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-[16px] w-[30%]">
        {/* Status & Organization */}
        <div className="bg-white p-[16px] rounded-[8px] shadow-sm flex flex-col gap-[16px]">
          <p className="text-[16px] font-medium text-brand-black-950">Organization</p>
          
           {/* Categories (multi-select) */}
           <div className="flex flex-col gap-[6px]">
            <label className="text-[14px] font-medium text-brand-black-950">
              Categories
            </label>
            <div className="max-h-[180px] overflow-y-auto rounded-[8px] border border-brand-gray-125 bg-white p-2 flex flex-col gap-1">
              {categories.length === 0 ? (
                <p className="text-[13px] text-brand-gray-500 px-1 py-1">
                  No categories available.
                </p>
              ) : (
                categories.map((cat) => {
                  const id = String(cat.id);
                  const checked = selectedCategories.includes(id);
                  return (
                    <label
                      key={id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[14px] text-brand-black-950 hover:bg-brand-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-brand-gray-300"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...selectedCategories, id]
                            : selectedCategories.filter((c) => c !== id);
                          setValue("categories", next, {
                            shouldValidate: true,
                          });
                        }}
                      />
                      {cat.name}
                    </label>
                  );
                })
              )}
            </div>
            {errors.categories && (
              <p className="text-red-500 text-xs">
                {typeof errors.categories.message === "string"
                  ? errors.categories.message
                  : "Select at least one category"}
              </p>
            )}
          </div>

          {/* Difficulty */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[14px] font-medium text-brand-black-950">Difficulty</label>
            <Select
              onValueChange={(value) => setValue("difficulty", value as any)}
              value={watch("difficulty")}
            >
              <SelectTrigger className="w-full bg-white border border-brand-gray-125 rounded-[8px] h-[38px]">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="difficult">Difficult</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pricing & Fees */}
        <div className="bg-white p-[16px] rounded-[8px] shadow-sm flex flex-col gap-[16px]">
          <p className="text-[16px] font-medium text-brand-black-950">Pricing & Fees</p>

          <div className="flex flex-col gap-[6px]">
            <label className="text-[14px] font-medium text-brand-black-950">Rental Price</label>
            <div className="relative">
              <Euro className="absolute left-[12px] top-[50%] translate-y-[-50%] w-[18px] h-[18px] text-brand-zinc-400" />
              <input
                {...register("price")}
                type="number"
                className="bg-white border border-brand-gray-125 rounded-[8px] pl-[36px] pr-[12px] py-[7px] text-[14px] w-full focus:outline-none focus:border-brand-orange-500"
              />
            </div>
             {errors.price && <p className="text-red-500 text-xs">{errors.price.message}</p>}
          </div>

          <input {...register("stock")} type="hidden" value={1} />

          <div className="flex flex-col gap-[6px]">
            <label className="text-[14px] font-medium text-brand-black-950">Delivery Fee</label>
            <input
                {...register("deliveryTimeFee")}
                type="number"
                className="bg-white border border-brand-gray-125 rounded-[8px] px-[12px] py-[7px] text-[14px] w-full focus:outline-none focus:border-brand-orange-500"
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label className="text-[14px] font-medium text-brand-black-950">Collection Fee</label>
            <input
                {...register("collectionTimeFee")}
                type="number"
                className="bg-white border border-brand-gray-125 rounded-[8px] px-[12px] py-[7px] text-[14px] w-full focus:outline-none focus:border-brand-orange-500"
            />
          </div>
        </div>
        
        {/* Availability & QA */}
         <div className="bg-white p-[16px] rounded-[8px] shadow-sm flex flex-col gap-[16px]">
            <p className="text-[16px] font-medium text-brand-black-950">Availability & QA</p>
            
            <div className="flex flex-col gap-[6px]">
                <label className="text-[14px] font-medium text-brand-black-950">Available From</label>
                <input
                    {...register("availableFrom")}
                    type="date"
                    className="bg-white border border-brand-gray-125 rounded-[8px] px-[12px] py-[7px] text-[14px] w-full focus:outline-none focus:border-brand-orange-500"
                />
            </div>

            <div className="flex flex-col gap-[6px]">
                <label className="text-[14px] font-medium text-brand-black-950">Available Until</label>
                <input
                    {...register("availableUntil")}
                    type="date"
                    className="bg-white border border-brand-gray-125 rounded-[8px] px-[12px] py-[7px] text-[14px] w-full focus:outline-none focus:border-brand-orange-500"
                />
            </div>

            <div className="flex items-center gap-[8px] py-2">
                 <Checkbox 
                    id="isCertified"
                    checked={watch("qualityAssurance.isCertified")}
                    onCheckedChange={(checked) => setValue("qualityAssurance.isCertified", checked as boolean)}
                 />
                 <label htmlFor="isCertified" className="text-[14px] font-medium text-brand-black-950 cursor-pointer">
                    Is Certified?
                 </label>
            </div>
            
            <div className="flex flex-col gap-[6px]">
                <label className="text-[14px] font-medium text-brand-black-950">Certification</label>
                <input
                    {...register("qualityAssurance.certification")}
                    type="text"
                    className="bg-white border border-brand-gray-125 rounded-[8px] px-[12px] py-[7px] text-[14px] w-full focus:outline-none focus:border-brand-orange-500"
                />
            </div>
             <div className="flex flex-col gap-[6px]">
                <label className="text-[14px] font-medium text-brand-black-950">Warranty Period</label>
                <input
                    {...register("qualityAssurance.warrantyPeriod")}
                    type="text"
                    className="bg-white border border-brand-gray-125 rounded-[8px] px-[12px] py-[7px] text-[14px] w-full focus:outline-none focus:border-brand-orange-500"
                />
            </div>
         </div>
      </div>

      <SuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        title={isEdit ? "Product Updated" : "Product Created"}
        message={isEdit ? "The product details have been successfully updated." : "The new product has been successfully added to your inventory."}
        onConfirm={() => {
            if (!isEdit) router.push("/admin/inventory");
            if (onSubmit) onSubmit({} as any);
        }}
      />
    </form>
  );
};

export default AddProductForm;
