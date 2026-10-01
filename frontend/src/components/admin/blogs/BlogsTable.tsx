"use client";

import { Edit3, Eye, RefreshCcw, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BlogDetailsModal } from "@/components/admin/blogs/BlogDetailsModal";
import { BlogsEmptyState } from "@/components/admin/blogs/BlogsEmptyState";
import { TableFooter } from "@/components/admin/shared/TableFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { useAdminToast } from "@/components/ui/admin-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatBlogDate,
  getBlogHeroImage,
  getBlogIdLabel,
  getBlogStatusLabel,
  type BlogStatusLabel,
} from "@/lib/blogs";
import { cn } from "@/lib/utils";
import { deleteBlog, type ApiBlog } from "@/services/blog.service";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

const statusStyles: Record<
  BlogStatusLabel,
  { text: string; dot: string; border: string }
> = {
  Published: {
    text: "text-brand-green-550",
    dot: "bg-brand-green-550",
    border: "border-brand-gray-300",
  },
  Draft: {
    text: "text-brand-gray-650",
    dot: "bg-brand-zinc-400",
    border: "border-brand-gray-300",
  },
};

type BlogsTableProps = {
  blogs: ApiBlog[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  searchTerm?: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onDeleted?: () => void;
  onRowsPerPageChange: (value: number) => void;
  onPageChange: (page: number) => void;
};

export function BlogsTable({
  blogs,
  totalResults,
  currentPage,
  totalPages,
  rowsPerPage,
  searchTerm,
  isLoading,
  isError,
  onRetry,
  onDeleted,
  onRowsPerPageChange,
  onPageChange,
}: BlogsTableProps) {
  const router = useRouter();
  const [selectedBlog, setSelectedBlog] = useState<ApiBlog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ApiBlog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { notify } = useAdminToast();

  const handleView = (blog: ApiBlog) => {
    setSelectedBlog(blog);
    setDetailsOpen(true);
  };

  const openDeleteModal = (blog: ApiBlog) => {
    setPendingDelete(blog);
    setDeleteOpen(true);
  };

  const handleDeleteBlog = async (blog: ApiBlog) => {
    const blogId = blog._id ?? blog.id;
    if (!blogId) return;
    setIsDeleting(true);
    try {
      await deleteBlog(blogId);
      notify({
        title: "Blog deleted",
        message: `"${blog.title}" was removed.`,
      });
      setDeleteOpen(false);
      setPendingDelete(null);
      onDeleted?.();
      onRetry?.();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to delete blog";
      notify({ title: "Delete failed", message, variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isLoading && !isError && blogs.length === 0 && !searchTerm) {
    return <BlogsEmptyState />;
  }

  return (
    <>
      <Card className="rounded-2xl border border-slate-200 shadow-sm">
        <div className="overflow-hidden rounded-2xl -mt-4">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b border-slate-200">
                <TableHead className="w-[14%] px-5 py-2 text-[12px] font-medium text-brand-gray-500">
                  Blogs ID
                </TableHead>
                <TableHead className="w-[46%] px-4 py-2 text-[12px] font-medium text-brand-gray-500">
                  Blogs Title
                </TableHead>
                <TableHead className="w-[15%] px-5 py-2 text-[12px] font-medium text-brand-gray-500">
                  Status
                </TableHead>
                <TableHead className="w-[15%] px-5 py-2 text-[12px] font-medium text-brand-gray-500">
                  Created at
                </TableHead>
                <TableHead className="w-[10%] px-5 py-2 text-center text-[12px] font-medium text-brand-gray-500">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-slate-200">
              {isLoading ? (
                Array.from({ length: Math.min(rowsPerPage, 6) }).map(
                  (_, index) => (
                    <TableRow
                      key={`skeleton-${index}`}
                      className="border-slate-200"
                    >
                      {Array.from({ length: 5 }).map((__, cellIndex) => (
                        <TableCell
                          key={`skeleton-cell-${cellIndex}`}
                          className="px-5 py-3"
                        >
                          <div className="h-4 w-full max-w-[180px] rounded bg-slate-100" />
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                )
              ) : isError ? (
                <TableRow className="border-slate-200">
                  <TableCell
                    colSpan={5}
                    className="px-5 py-10 text-center"
                  >
                    <div className="flex flex-col items-center gap-3 text-sm text-brand-gray-650">
                      <p>Couldn&apos;t load blogs right now.</p>
                      {onRetry && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onRetry}
                          className="h-8 rounded-md border-slate-200 bg-white text-brand-black-950"
                        >
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : blogs.length === 0 ? (
                <TableRow className="border-slate-200">
                  <TableCell
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-brand-gray-650"
                  >
                    No blogs found for &quot;{searchTerm}&quot;.
                  </TableCell>
                </TableRow>
              ) : (
                blogs.map((blog) => {
                  const blogId = getBlogIdLabel(blog);
                  const blogStatus = getBlogStatusLabel(blog);
                  const blogImage = getBlogHeroImage(blog);
                  const createdAt = formatBlogDate(blog.createdAt);
                  const canEdit = Boolean(blog._id || blog.id);
                  return (
                    <TableRow
                      key={blog._id ?? blog.id ?? blog.slug ?? blog.title}
                      className="border-slate-200 hover:bg-brand-gray-25"
                    >
                      <TableCell className="px-5 py-3 text-[13px] font-medium text-brand-black-950">
                        {blogId ? `#${blogId}` : "-"}
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="relative h-10 w-10 overflow-hidden rounded-md border border-slate-200 bg-white">
                            {blogImage && (
                              <Image
                                src={blogImage}
                                alt={blog.imageAltText || blog.title}
                                fill
                                className="object-cover"
                                sizes="36px"
                                priority={false}
                              />
                            )}
                          </div>
                          <p className="truncate text-[13px] text-brand-black-950">
                            {blog.title}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="px-5 py-3">
                        <StatusPill status={blogStatus} />
                      </TableCell>

                      <TableCell className="px-5 py-3 text-[13px] text-brand-slate-600">
                        {createdAt}
                      </TableCell>

                      <TableCell className="px-5 py-3">
                        <div className="flex items-center justify-center gap-4">
                          <IconButton
                            label="View"
                            onClick={() => handleView(blog)}
                            icon={<Eye className="h-[16px] w-[16px]" />}
                          />
                          <IconButton
                            label="Edit"
                            onClick={() => {
                              if (canEdit) {
                                router.push(
                                  `/admin/blogs/edit-blog/${blog._id ?? blog.id}`
                                );
                              }
                            }}
                            icon={<Edit3 className="h-[16px] w-[16px]" />}
                          />
                          <IconButton
                            label="Delete"
                            icon={<Trash2 className="h-[16px] w-[16px]" />}
                            variant="danger"
                            onClick={() => openDeleteModal(blog)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <TableFooter
          totalResults={totalResults}
          showingCount={blogs.length}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          onRowsPerPageChange={onRowsPerPageChange}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          variant="compact"
        />
      </Card>

      <BlogDetailsModal
        open={detailsOpen}
        blog={selectedBlog}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) {
            setSelectedBlog(null);
          }
        }}
        onRequestDelete={(blog) => {
          setDetailsOpen(false);
          openDeleteModal(blog);
        }}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Blog"
        itemLabel={pendingDelete?.title || "this blog"}
        confirmLabel="Delete Blog"
        isLoading={isDeleting}
        onConfirm={() =>
          pendingDelete ? handleDeleteBlog(pendingDelete) : null
        }
      />
    </>
  );
}

function StatusPill({ status }: { status: BlogStatusLabel }) {
  const isPublished = status === "Published";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px] font-semibold shadow-[0px_1px_2px_var(--alpha-ink-900-5)]",
        statusStyles[status].text,
        statusStyles[status].border
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", statusStyles[status].dot)}
      />
      {isPublished ? "Published" : "Draft"}
    </span>
  );
}

function IconButton({
  icon,
  label,
  variant = "default",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  variant?: "default" | "danger";
  onClick?: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "h-9 w-9 rounded-lg border-slate-200 bg-white text-brand-zinc-600 shadow-none hover:bg-brand-gray-110",
        variant === "danger" &&
          "text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
      )}
    >
      {icon}
    </Button>
  );
}
