"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatBlogDate,
  getBlogHeroImage,
  getBlogIdLabel,
  getBlogStatusLabel,
  type BlogStatusLabel,
} from "@/lib/blogs";
import { cn } from "@/lib/utils";
import { RichText } from "@/components/common/RichText";
import type { ApiBlog } from "@/services/blog.service";
import { CircleCheck, Edit3, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type BlogDetailsModalProps = {
  open: boolean;
  blog: ApiBlog | null;
  onOpenChange: (open: boolean) => void;
  onRequestDelete?: (blog: ApiBlog) => void;
};

const statusStyles: Record<
  BlogStatusLabel,
  { text: string; dot: string; border: string; bg: string }
> = {
  Published: {
    text: "text-brand-emerald-700",
    dot: "bg-brand-emerald-400",
    border: "border-brand-gray-300",
    bg: "bg-brand-green-50",
  },
  Draft: {
    text: "text-brand-gray-650",
    dot: "bg-brand-zinc-400",
    border: "border-brand-gray-300",
    bg: "bg-brand-gray-90",
  },
};

export function BlogDetailsModal({
  open,
  blog,
  onOpenChange,
  onRequestDelete,
}: BlogDetailsModalProps) {
  const router = useRouter();

  const handleClose = (value: boolean) => {
    if (!value) {
      onOpenChange(false);
    }
  };

  if (!blog) return null;

  const statusLabel = getBlogStatusLabel(blog);
  const statusStyle = statusStyles[statusLabel];
  const blogId = getBlogIdLabel(blog);
  const blogImage = getBlogHeroImage(blog);
  const createdAt = formatBlogDate(blog.createdAt);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "w-[70vw] max-w-[70vw] sm:w-[70vw] sm:max-w-[70vw] max-h-[90vh] font-inter p-0 gap-0",
          "overflow-hidden rounded-2xl border border-slate-200 flex flex-col"
        )}
      >
        <DialogClose asChild>
          <button
            type="button"
            className="absolute right-0 flex h-9 w-9 items-center justify-center rounded-full text-brand-black-950 hover:bg-white hover:shadow-sm focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-slate-300"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogClose>

        {/* Header */}
        <DialogHeader className="border-b border-slate-200 pt-5 pb-6">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 pb-4 bg-brand-gray-50 -mt-6 pt-6">
            <div className="space-y-0.5">
              <DialogTitle className="text-lg font-semibold leading-none tracking-[0.01em] text-slate-900">
                Blog Details
              </DialogTitle>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-8 text-slate-900 px-6">
            <div className="space-y-[2px]">
              <div className="text-sm text-slate-500">Blog ID</div>
              <div className="text-sm font-semibold mt-2 text-slate-900">
                {blogId ? `#${blogId}` : "-"}
              </div>
            </div>

            <div className="space-y-[2px]">
              <div className="text-sm text-slate-500">Status</div>
              <div className="mt-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[12px] font-semibold shadow-[0px_1px_2px_var(--alpha-ink-900-5)]",
                    statusStyle.text,
                    statusStyle.border
                  )}
                >
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", statusStyle.dot)}
                  />
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className="space-y-[2px]">
              <div className="text-sm text-slate-500">Created at</div>
              <div className="text-sm font-medium mt-2 text-slate-900">
                {createdAt}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
            {blogImage && (
              <div className="relative w-full h-[560px]">
                <Image
                  src={blogImage}
                  alt={blog.imageAltText || blog.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 800px, 100vw"
                  priority
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-1 mb-5">
              <h2 className="text-2xl font-semibold leading-[28px] text-brand-black-950">
                {blog.title}
              </h2>
              <p className=" leading-[20px] text-brand-black-950">
                {blog.subtitle || blog.description || "-"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-lg font-semibold text-brand-ink-900">
                Description
              </p>
              <div className="text-[13px] leading-[20px] text-brand-slate-700 prose prose-sm max-w-none">
                {blog.description ? (
                  <RichText
                    html={blog.description}
                    className="text-[13px] leading-[20px] text-brand-slate-700"
                  />
                ) : (
                  "No description provided."
                )}
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 bg-brand-gray-50 p-4">
              <p className="text-lg font-semibold text-brand-ink-900">
                SEO Details
              </p>

              <div className="space-y-1">
                <p className="text-sm font-medium text-brand-slate-700">Meta Title</p>
                <p className="text-sm text-brand-slate-600 break-words">
                  {blog.metaTitle || "-"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-brand-slate-700">Meta Description</p>
                <p className="text-sm text-brand-slate-600 break-words">
                  {blog.metaDescription || "-"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-brand-slate-700">Image Alt Text</p>
                <p className="text-sm text-brand-slate-600 break-words">
                  {blog.imageAltText || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
          <Button
            variant="outline"
            className="h-9 rounded-lg border-slate-200 bg-white px-3 text-[12px] font-medium text-black shadow-none text-sm"
            onClick={() => (blog ? onRequestDelete?.(blog) : null)}
          >
            <Trash2 className=" h-4 w-4" />
            Delete Blog
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-9 rounded-lg border-slate-200 bg-white px-3 text-[12px] font-medium text-black shadow-none text-sm"
              onClick={() => {
                const editId = blog._id ?? blog.id;
                if (editId) {
                  router.push(`/admin/blogs/edit-blog/${editId}`);
                }
              }}
            >
              <Edit3 className=" h-4 w-4" />
              Edit Blog
            </Button>
            {statusLabel === "Draft" && (
              <Button className="h-9 rounded-lg px-3 text-[12px] font-medium text-white text-sm bg-brand-orange-500 hover:bg-brand-orange-650">
                <CircleCheck />
                Publish Blog
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
