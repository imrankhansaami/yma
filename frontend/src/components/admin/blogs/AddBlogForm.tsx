"use client";

import TextEditor from "@/components/admin/inventory/TextEditor";
import { AddBlogFormData, addBlogSchema } from "@/lib/validation/addBlogSchema";
import { yupResolver } from "@hookform/resolvers/yup";
import { ImagePlus, X } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type SubmitType = "draft" | "publish";

type AddBlogFormProps = {
  onSubmit: (
    data: AddBlogFormData & { image?: File | null },
    mode: SubmitType
  ) => void;
  submitType: SubmitType;
  initialData?: Partial<AddBlogFormData>;
  initialImage?: StaticImageData | string | null;
  formId?: string;
};

export const AddBlogForm = ({
  onSubmit,
  submitType,
  initialData,
  initialImage = null,
  formId = "add-blog-form",
}: AddBlogFormProps) => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<StaticImageData | string | null>(
    initialImage
  );

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    !!(initialData?.slug)
  );

  const defaultValues = useMemo(
    () => ({
      title: initialData?.title ?? "",
      subtitle: initialData?.subtitle ?? "",
      description: initialData?.description ?? "",
      metaTitle: initialData?.metaTitle ?? "",
      metaDescription: initialData?.metaDescription ?? "",
      imageAltText: initialData?.imageAltText ?? "",
      slug: initialData?.slug ?? "",
      canonicalUrl: initialData?.canonicalUrl ?? "",
      customJsonLd: initialData?.customJsonLd ?? "",
    }),
    [initialData]
  );

  const form = useForm<AddBlogFormData>({
    resolver: yupResolver(addBlogSchema),
    defaultValues,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    control,
    watch,
    setValue,
  } = form;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const watchedTitle = watch("title");

  // Auto-generate slug from title (only if user hasn't manually edited it)
  useEffect(() => {
    if (slugManuallyEdited) return;
    const generated = (watchedTitle || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setValue("slug", generated, { shouldValidate: false });
  }, [watchedTitle, slugManuallyEdited, setValue]);

  useEffect(() => {
    if (image) return;
    setImage(null);
    setPreview(initialImage);
  }, [image, initialImage]);

  const handleImageChange = (file: File | null) => {
    setImage(file);
    if (
      preview &&
      typeof preview === "string" &&
      preview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(preview);
    }
    setPreview(file ? URL.createObjectURL(file) : initialImage);
  };

  const clearImage = () => {
    if (
      preview &&
      typeof preview === "string" &&
      preview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setImage(null);
  };

  const handleFormSubmit = (
    data: AddBlogFormData,
    event?: React.BaseSyntheticEvent
  ) => {
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)
      ?.submitter as HTMLElement | null;
    const mode =
      submitter?.getAttribute("data-submit-type") ?? submitType;
    onSubmit({ ...data, image }, mode as SubmitType);
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex flex-col mx-auto gap-[16px] w-[40rem]"
    >
      <div className="bg-white p-[16px] rounded-[8px] shadow-[0px_1px_3px_0px_var(--alpha-slate-900-10),0px_1px_2px_0px_var(--alpha-slate-900-6)] flex flex-col gap-[14px]">
        <p className="text-[16px] font-medium leading-[1.5] text-brand-black-950">
          Blog Information
        </p>

        <div className="flex flex-col gap-[6px]">
          <label className="text-[14px] font-medium leading-[1.55] text-brand-black-950">
            Title
          </label>
          <input
            {...register("title")}
            type="text"
            placeholder="Enter blog title"
            className={`bg-white border ${
              errors.title ? "border-red-500" : "border-brand-gray-125"
            } rounded-[8px] px-[12px] py-[7px] text-[14px] font-normal leading-[1.55] text-brand-black-950 placeholder:text-brand-gray-500 focus:outline-none focus:border-brand-orange-500`}
          />
          {errors.title && (
            <p className="text-[14px] font-normal leading-[1.55] text-brand-red-700">
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-[6px]">
          <label className="text-[14px] font-medium leading-[1.55] text-brand-black-950">
            URL Slug
          </label>
          <input
            {...register("slug")}
            type="text"
            placeholder="blog-url-slug"
            onChange={(e) => {
              setSlugManuallyEdited(true);
              setValue("slug", e.target.value, { shouldValidate: false });
            }}
            className={`bg-white border ${
              errors.slug ? "border-red-500" : "border-brand-gray-125"
            } rounded-[8px] px-[12px] py-[7px] text-[14px] font-normal leading-[1.55] text-brand-black-950 placeholder:text-brand-gray-500 focus:outline-none focus:border-brand-orange-500`}
          />
          <p className="text-[12px] font-normal leading-[1.5] text-brand-gray-430">
            Auto-generated from title. Edit to customize.
          </p>
          {errors.slug && (
            <p className="text-[14px] font-normal leading-[1.55] text-brand-red-700">
              {errors.slug.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-[6px]">
          <label className="text-[14px] font-medium leading-[1.55] text-brand-black-950">
            Subtitle
          </label>
          <input
            {...register("subtitle")}
            type="text"
            placeholder="Enter blog subtitle here"
            className={`bg-white border ${
              errors.subtitle ? "border-red-500" : "border-brand-gray-125"
            } rounded-[8px] px-[12px] py-[7px] text-[14px] font-normal leading-[1.55] text-brand-black-950 placeholder:text-brand-gray-500 focus:outline-none focus:border-brand-orange-500`}
          />
          {errors.subtitle && (
            <p className="text-[14px] font-normal leading-[1.55] text-brand-red-700">
              {errors.subtitle.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-[6px]">
          <label className="text-[14px] font-medium leading-[1.55] text-brand-black-950">
            Description
          </label>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <TextEditor
                value={field.value || ""}
                onChange={(value: string) => field.onChange(value)}
                error={errors.description?.message}
                placeholder="Write product description here"
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-[6px]">
          <label className="text-[14px] font-medium leading-[1.55] text-brand-black-950">
            Meta Title (SEO)
          </label>
          <input
            {...register("metaTitle")}
            type="text"
            placeholder="Enter SEO title"
            className={`bg-white border ${
              errors.metaTitle ? "border-red-500" : "border-brand-gray-125"
            } rounded-[8px] px-[12px] py-[7px] text-[14px] font-normal leading-[1.55] text-brand-black-950 placeholder:text-brand-gray-500 focus:outline-none focus:border-brand-orange-500`}
          />
          {errors.metaTitle && (
            <p className="text-[14px] font-normal leading-[1.55] text-brand-red-700">
              {errors.metaTitle.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-[6px]">
          <label className="text-[14px] font-medium leading-[1.55] text-brand-black-950">
            Meta Description (SEO)
          </label>
          <textarea
            {...register("metaDescription")}
            rows={3}
            placeholder="Enter SEO description"
            className={`bg-white border ${
              errors.metaDescription ? "border-red-500" : "border-brand-gray-125"
            } rounded-[8px] px-[12px] py-[7px] text-[14px] font-normal leading-[1.55] text-brand-black-950 placeholder:text-brand-gray-500 focus:outline-none focus:border-brand-orange-500`}
          />
          {errors.metaDescription && (
            <p className="text-[14px] font-normal leading-[1.55] text-brand-red-700">
              {errors.metaDescription.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-[6px]">
          <label className="text-[14px] font-medium leading-[1.55] text-brand-black-950">
            Image Alt Text (SEO)
          </label>
          <input
            {...register("imageAltText")}
            type="text"
            placeholder="Enter alt text for blog image"
            className={`bg-white border ${
              errors.imageAltText ? "border-red-500" : "border-brand-gray-125"
            } rounded-[8px] px-[12px] py-[7px] text-[14px] font-normal leading-[1.55] text-brand-black-950 placeholder:text-brand-gray-500 focus:outline-none focus:border-brand-orange-500`}
          />
          {errors.imageAltText && (
            <p className="text-[14px] font-normal leading-[1.55] text-brand-red-700">
              {errors.imageAltText.message}
            </p>
          )}
        </div>
      </div>

      {/* SEO Advanced */}
      <div className="bg-white p-[16px] rounded-[8px] shadow-[0px_1px_3px_0px_var(--alpha-slate-900-10),0px_1px_2px_0px_var(--alpha-slate-900-6)] flex flex-col gap-[14px]">
        <p className="text-[16px] font-medium leading-[1.5] text-brand-black-950">
          SEO Advanced
        </p>

        <div className="flex flex-col gap-[6px]">
          <label className="text-[14px] font-medium leading-[1.55] text-brand-black-950">
            Canonical URL
          </label>
          <input
            {...register("canonicalUrl")}
            type="text"
            placeholder="https://example.com/blog/my-post"
            className={`bg-white border ${
              errors.canonicalUrl ? "border-red-500" : "border-brand-gray-125"
            } rounded-[8px] px-[12px] py-[7px] text-[14px] font-normal leading-[1.55] text-brand-black-950 placeholder:text-brand-gray-500 focus:outline-none focus:border-brand-orange-500`}
          />
          <p className="text-[12px] font-normal leading-[1.5] text-brand-gray-430">
            Optional. Override the default canonical URL for this blog post.
          </p>
          {errors.canonicalUrl && (
            <p className="text-[14px] font-normal leading-[1.55] text-brand-red-700">
              {errors.canonicalUrl.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-[6px]">
          <label className="text-[14px] font-medium leading-[1.55] text-brand-black-950">
            Custom Schema (JSON-LD)
          </label>
          <textarea
            {...register("customJsonLd")}
            rows={5}
            placeholder='{"@context": "https://schema.org", ...}'
            className={`bg-white border ${
              errors.customJsonLd ? "border-red-500" : "border-brand-gray-125"
            } rounded-[8px] px-[12px] py-[7px] text-[14px] font-mono leading-[1.55] text-brand-black-950 placeholder:text-brand-gray-500 focus:outline-none focus:border-brand-orange-500`}
          />
          <p className="text-[12px] font-normal leading-[1.5] text-brand-gray-430">
            Optional. Add custom JSON-LD structured data for this blog post.
          </p>
          {errors.customJsonLd && (
            <p className="text-[14px] font-normal leading-[1.55] text-brand-red-700">
              {errors.customJsonLd.message}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white p-[16px] rounded-[8px] shadow-[0px_1px_3px_0px_var(--alpha-slate-900-10),0px_1px_2px_0px_var(--alpha-slate-900-6)] flex flex-col gap-[14px]">
        <p className="text-[16px] font-medium leading-[1.5] text-brand-black-950">
          Add Product Images
        </p>

        <label className="relative border border-dashed border-brand-gray-150 rounded-[10px] w-full aspect-square flex items-center justify-center cursor-pointer hover:bg-brand-gray-70 transition-colors overflow-hidden bg-white">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
          />
          {preview ? (
            <>
              <Image
                src={preview}
                alt="Featured image"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearImage();
                }}
                className="absolute top-2 right-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand-slate-900 shadow-md hover:bg-white"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-[6px]">
              <ImagePlus className="w-[32px] h-[32px] text-brand-gray-500" />
              <div className="bg-brand-indigo-50 px-[8px] py-[1.5px] rounded-[6px]">
                <span className="text-[12px] font-medium leading-[1.6] text-brand-blue-500">
                  Add Image
                </span>
              </div>
              <p className="text-[12px] font-normal leading-[1.5] text-brand-gray-430">
                Featured Image
              </p>
            </div>
          )}
        </label>
      </div>
    </form>
  );
};
