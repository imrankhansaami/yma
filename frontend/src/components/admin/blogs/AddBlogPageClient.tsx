"use client";

import { ArrowLeft, CircleCheck, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AddBlogForm } from "@/components/admin/blogs/AddBlogForm";
import { useAdminToast } from "@/components/ui/admin-toast";
import { AddBlogFormData } from "@/lib/validation/addBlogSchema";
import { createBlog } from "@/services/blog.service";
import { selectUser, useAuthStore } from "@/store/useAuthStore";

type SubmitType = "draft" | "publish";

export default function AddBlogPageClient() {
  const [submitType, setSubmitType] = useState<SubmitType>("publish");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notify } = useAdminToast();
  const user = useAuthStore(selectUser);
  const router = useRouter();

  const appendAuthorImage = async (
    formData: FormData,
    photo?: string | null
  ) => {
    if (!photo) return;

    if (photo.startsWith("data:")) {
      const res = await fetch(photo);
      const blob = await res.blob();
      formData.append(
        "authorImage",
        new File([blob], "author-image", { type: blob.type || "image/png" })
      );
      return;
    }

    if (/^https?:\/\//i.test(photo)) {
      try {
        const res = await fetch(photo);
        const blob = await res.blob();
        formData.append(
          "authorImage",
          new File([blob], "author-image", { type: blob.type || "image/png" })
        );
        return;
      } catch {
        formData.append("authorImage", photo);
        return;
      }
    }

    formData.append("authorImage", photo);
  };

  const handleSubmit = async (
    data: AddBlogFormData & { image?: File | null },
    mode: SubmitType
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("subtitle", data.subtitle);
      formData.append("description", data.description);
      formData.append("metaTitle", data.metaTitle || "");
      formData.append("metaDescription", data.metaDescription || "");
      formData.append("imageAltText", data.imageAltText || "");
      if (data.image) {
        formData.append("images", data.image);
      }
      const authorName = user?.name || "Admin";
      formData.append("authorName", authorName);
      await appendAuthorImage(formData, user?.photo ?? null);
      formData.append("status", mode === "publish" ? "published" : "draft");
      formData.append("isPublished", mode === "publish" ? "true" : "false");

      const created = await createBlog(formData);
      notify({
        title: mode === "publish" ? "Blog published" : "Draft saved",
        message: created?.title
          ? `"${created.title}" is ready.`
          : "Your blog is ready.",
      });
      if (mode === "publish") {
        router.push("/admin/blogs");
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to create blog.";
      notify({ title: "Blog creation failed", message, variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            form="add-blog-form"
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
            form="add-blog-form"
            onClick={() => setSubmitType("publish")}
            data-submit-type="publish"
            disabled={isSubmitting}
            className="bg-brand-orange-500 h-[36px] px-[16px] py-[8px] rounded-[8px] flex items-center gap-[8px] hover:bg-brand-orange-530 transition-colors"
          >
            <CircleCheck className="w-[16px] h-[16px] text-brand-gray-50" />
            <span className="text-[14px] font-medium leading-[20px] text-brand-gray-50">
              {isSubmitting && submitType === "publish"
                ? "Publishing..."
                : "Publish Blog"}
            </span>
          </button>
        </div>
      </div>

      <AddBlogForm onSubmit={handleSubmit} submitType={submitType} />
    </div>
  );
}
