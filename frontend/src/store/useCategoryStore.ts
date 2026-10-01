"use client";

import { create } from "zustand";

import {
  Category,
  fetchCategories,
} from "@/services/category.service";

type CategoryState = {
  categories: Category[];
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
  loadCategories: () => Promise<void>;
  findCategoryId: (names: string[]) => string | number | null;
};

const normalize = (s?: string | null) => (s ?? "").trim().toLowerCase();

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,
  hasLoaded: false,

  loadCategories: async () => {
    const { hasLoaded, loading } = get();
    if (hasLoaded || loading) return;

    set({ loading: true, error: null });
    try {
      const categories = await fetchCategories();
      set({ categories, hasLoaded: true });
    } catch (err: any) {
      set({ error: err?.message ?? "Failed to load categories" });
    } finally {
      set({ loading: false });
    }
  },

  findCategoryId: (names: string[]) => {
    const target = names.map(normalize);
    const match = get().categories.find((c) =>
      target.includes(normalize(c.name))
    );
    return match ? match.id : null;
  },
}));
