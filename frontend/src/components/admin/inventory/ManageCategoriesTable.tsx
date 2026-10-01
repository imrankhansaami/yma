"use client";

import { Check, Edit3, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

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
  deleteCategory,
  fetchCategories,
  updateCategory,
  type Category,
} from "@/services/category.service";

type CategoryRow = {
  id: string;
  name: string;
  createdAt?: string;
};

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

type ManageCategoriesTableProps = {
  searchQuery: string;
  refreshKey?: number;
};

const toCategoryRow = (category: Category, index: number): CategoryRow => ({
  id: String(category.id ?? index),
  name: category.name ?? "Untitled",
  createdAt: category.createdAt,
});

const formatCreatedAt = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "MMM d, yyyy");
};

export function ManageCategoriesTable({
  searchQuery,
  refreshKey = 0,
}: ManageCategoriesTableProps) {
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CategoryRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { notify } = useAdminToast();

  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCategories();
        if (!isMounted) return;
        setCategories(data.map(toCategoryRow));
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message ?? "Failed to load categories");
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    loadCategories();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const openDeleteModal = (category: CategoryRow) => {
    setPendingDelete(category);
    setDeleteOpen(true);
  };

  const startEdit = (category: CategoryRow) => {
    setEditingCategoryId(category.id);
    setEditName(category.name);
  };

  const cancelEdit = () => {
    setEditingCategoryId(null);
    setEditName("");
    setIsUpdating(false);
  };

  const handleUpdateCategory = async (categoryId: string) => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      notify({
        title: "Update failed",
        message: "Category name is required.",
        variant: "error",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await updateCategory(categoryId, { name: trimmedName });
      setCategories((prev) =>
        prev.map((row) =>
          row.id === categoryId ? { ...row, name: updated.name } : row,
        ),
      );
      notify({
        title: "Category updated",
        message: `"${updated.name}" was updated successfully.`,
      });
      cancelEdit();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Unable to update category";
      notify({ title: "Update failed", message, variant: "error" });
      setIsUpdating(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!pendingDelete?.id) return;
    setIsDeleting(true);
    try {
      await deleteCategory(pendingDelete.id);
      notify({
        title: "Category deleted",
        message: `"${pendingDelete.name}" was removed.`,
      });
      setCategories((prev) => prev.filter((row) => row.id !== pendingDelete.id));
      setDeleteOpen(false);
      setPendingDelete(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Unable to delete category";
      notify({ title: "Delete failed", message, variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage, searchQuery]);

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((row) => row.name.toLowerCase().includes(query));
  }, [categories, searchQuery]);

  const totalResults = filteredCategories.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedCategories = filteredCategories.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  return (
    <section className="w-full">
      <Card className="rounded-xl border border-brand-gray-150 shadow-[0px_1px_2px_0px_var(--alpha-ink-900-5)]">
        <div className="overflow-hidden rounded-xl -mt-4">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b border-brand-gray-150 bg-white">
                <TableHead className="w-[60%] px-4 py-3 text-[12px] font-medium text-brand-gray-500">
                  Category
                </TableHead>
                <TableHead className="w-[30%] px-4 py-3 text-[12px] font-medium text-brand-gray-500">
                  Created at
                </TableHead>
                <TableHead className="w-[10%] px-4 py-3 text-[12px] font-medium text-brand-gray-500">
                  {/* Action col */}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-brand-gray-150">
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="px-4 py-6 text-sm text-brand-gray-500"
                  >
                    Loading categories...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="px-4 py-6 text-sm text-brand-gray-500"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : paginatedCategories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="px-4 py-6 text-sm text-brand-gray-500"
                  >
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCategories.map((row) => (
                  <TableRow key={row.id} className="border-brand-gray-150">
                    <TableCell className="px-4 py-4">
                      {editingCategoryId === row.id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 w-full max-w-[280px] rounded-md border border-brand-gray-200 px-2 text-sm focus:outline-none focus:border-brand-orange-500"
                          autoFocus
                        />
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-brand-gray-110 px-1.5 py-0.5 text-xs font-medium text-brand-black-950">
                          {row.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-brand-black-950">
                      {formatCreatedAt(row.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {editingCategoryId === row.id ? (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              disabled={isUpdating}
                              className="h-8 w-8 rounded-lg border-brand-gray-125 bg-white text-brand-black-950"
                              aria-label={`Save ${row.name}`}
                              onClick={() => handleUpdateCategory(row.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              disabled={isUpdating}
                              className="h-8 w-8 rounded-lg border-brand-gray-125 bg-white text-brand-black-950"
                              aria-label="Cancel edit"
                              onClick={cancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg border-brand-gray-125 bg-white text-brand-black-950"
                              aria-label={`Edit ${row.name}`}
                              onClick={() => startEdit(row)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg border-brand-gray-125 bg-white text-brand-black-950"
                              aria-label={`Delete ${row.name}`}
                              onClick={() => openDeleteModal(row)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <TableFooter
          totalResults={totalResults}
          showingCount={paginatedCategories.length}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          onRowsPerPageChange={(value) => setRowsPerPage(value)}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          variant="compact"
        />
      </Card>

      <ConfirmDeleteModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Category"
        itemLabel={pendingDelete?.name}
        isLoading={isDeleting}
        onConfirm={handleDeleteCategory}
      />
    </section>
  );
}
