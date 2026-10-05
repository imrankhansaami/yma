"use client";

import { ArrowLeft, CircleCheck, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { AddBlogForm } from "@/components/admin/blogs/AddBlogForm";
import { useAdminToast } from "@/components/ui/admin-toast";
import { AddBlogFormData } from "@/lib/validation/addBlogSchema";
import { fetchBlogById, updateBlog } from "@/services/blog.service";

type SubmitType = "draft" | "publish";

export default function EditBlogPageClient() {
  const params = useParams<{ id: string }>();
  const blogId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const [submitType, setSubmitType] = useState<SubmitType>("publish");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notify } = useAdminToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: blog, isLoading } = useQuery({
    queryKey: ["admin-blog", blogId],
    queryFn: () => fetchBlogById(blogId ?? ""),
    enabled: Boolean(blogId),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-[16px] w-full py-[16px]">
        <div className="flex items-center justify-between w-full">
          <div className="h-[36px] w-[190px] rounded-[8px] bg-slate-100" />
          <div className="flex items-center gap-[8px]">
            <div className="h-[36px] w-[140px] rounded-[8px] bg-slate-100" />
            <div className="h-[36px] w-[140px] rounded-[8px] bg-slate-100" />
          </div>
        </div>

        <div className="bg-white p-[16px] rounded-[8px] shadow-[0px_1px_3px_0px_var(--alpha-slate-900-10),0px_1px_2px_0px_var(--alpha-slate-900-6)] flex flex-col gap-[14px]">
          <div className="h-[20px] w-[140px] rounded bg-slate-100" />
          <div className="flex flex-col gap-[6px]">
            <div className="h-[16px] w-[80px] rounded bg-slate-100" />
            <div className="h-[38px] w-full rounded-[8px] bg-slate-100" />
          </div>
          <div className="flex flex-col gap-[6px]">
            <div className="h-[16px] w-[90px] rounded bg-slate-100" />
            <div className="h-[38px] w-full rounded-[8px] bg-slate-100" />
          </div>
          <div className="flex flex-col gap-[6px]">
            <div className="h-[16px] w-[110px] rounded bg-slate-100" />
            <div className="h-[140px] w-full rounded-[8px] bg-slate-100" />
          </div>
        </div>

        <div className="bg-white p-[16px] rounded-[8px] shadow-[0px_1px_3px_0px_var(--alpha-slate-900-10),0px_1px_2px_0px_var(--alpha-slate-900-6)] flex flex-col gap-[14px]">
          <div className="h-[20px] w-[160px] rounded bg-slate-100" />
          <div className="w-full aspect-square rounded-[10px] bg-slate-100" />
        </div>
      </div>
    );
  }

  const handleSubmit = async (
    data: AddBlogFormData & { image?: File | null },
    mode: SubmitType
  ) => {
    if (!blogId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("subtitle", data.subtitle);
      formData.append("description", data.description);
      formData.append("metaTitle", data.metaTitle || "");
      formData.append("metaDescription", data.metaDescription || "");
      formData.append("imageAltText", data.imageAltText || "");
      formData.append("slug", data.slug || "");
      formData.append("canonicalUrl", data.canonicalUrl || "");
      formData.append("customJsonLd", data.customJsonLd || "");
      if (data.image) {
        formData.append("images", data.image);
      }
      formData.append("status", mode === "publish" ? "published" : "draft");
      formData.append("isPublished", mode === "publish" ? "true" : "false");

      const updated = await updateBlog(blogId, formData);
      notify({
        title: "Blog updated",
        message: updated?.title
          ? `"${updated.title}" was updated successfully.`
          : "Blog updated successfully.",
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      router.push("/admin/blogs");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to update blog.";
      notify({ title: "Update failed", message, variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoading && !blog) {
    return (
      <div className="flex flex-col gap-4 w-full py-[16px]">
        <Link
          href="/admin/blogs"
          className="bg-white border border-brand-gray-260 h-[36px] px-[16px] py-[8px] rounded-[8px] shadow-[0px_1px_2px_0px_var(--alpha-black-5)] flex items-center gap-[8px] hover:bg-brand-gray-110 transition-colors w-fit"
        >
          <ArrowLeft className="w-[16px] h-[16px] text-brand-ink-950" />
          <span className="text-[14px] font-medium leading-[20px] text-brand-ink-950">
            Blogs Management
          </span>
        </Link>
        <div className="bg-white border border-dashed border-brand-gray-150 rounded-[10px] p-6 text-brand-ink-950 shadow-sm">
          <p className="text-[16px] font-medium">Blog not found</p>
          <p className="text-[14px] text-brand-slate-600">
            We couldn&apos;t find a blog with that ID. Please return to the
            blogs list and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[16px] w-full py-[16px]">
      <div className="flex items-center justify-between w-full">
        <Link
          href="/admin/blogs"
          className="bg-white border border-brand-gray-260 h-[36px] px-[16px] py-[8px] rounded-[8px] shadow-[0px_1px_2px_0px_var(--alpha-black-5)] flex items-center gap-[8px] hover:bg-brand-gray-110 transition-colors"
        >
          <ArrowLeft className="w-[16px] h-[16px] text-brand-ink-950" />
          <span className="text-[14px] font-medium leading-[20px] text-brand-ink-950">
            Blogs Management
          </span>
        </Link>

        <div className="flex items-center gap-[8px]">
          <button
            type="submit"
            form="edit-blog-form"
            onClick={() => setSubmitType("draft")}
            data-submit-type="draft"
            disabled={isSubmitting}
            className="bg-white border border-brand-gray-260 h-[36px] px-[16px] py-[8px] rounded-[8px] shadow-[0px_1px_2px_0px_var(--alpha-black-5)] flex items-center gap-[8px] hover:bg-brand-gray-110 transition-colors"
          >
            <Save className="w-[16px] h-[16px] text-brand-ink-950" />
            <span className="text-[14px] font-medium leading-[20px] text-brand-ink-950">
              Save as Draft
            </span>
          </button>

          <button
            type="submit"
            form="edit-blog-form"
            onClick={() => setSubmitType("publish")}
            data-submit-type="publish"
            disabled={isSubmitting}
            className="bg-brand-orange-500 h-[36px] px-[16px] py-[8px] rounded-[8px] flex items-center gap-[8px] hover:bg-brand-orange-530 transition-colors"
          >
            <CircleCheck className="w-[16px] h-[16px] text-brand-gray-50" />
            <span className="text-[14px] font-medium leading-[20px] text-brand-gray-50">
              {isSubmitting && submitType === "publish"
                ? "Updating..."
                : "Update Blog"}
            </span>
          </button>
        </div>
      </div>

      <AddBlogForm
        onSubmit={handleSubmit}
        submitType={submitType}
        initialData={{
          title: blog?.title ?? "",
          subtitle: blog?.subtitle ?? "",
          description: blog?.description ?? "",
          metaTitle: blog?.metaTitle ?? "",
          metaDescription: blog?.metaDescription ?? "",
          imageAltText: blog?.imageAltText ?? "",
          slug: blog?.slug ?? "",
          canonicalUrl: blog?.canonicalUrl ?? "",
          customJsonLd: blog?.customJsonLd ?? "",
        }}
        initialImage={blog?.images?.[0] ?? null}
        formId="edit-blog-form"
      />
    </div>
  );
}
