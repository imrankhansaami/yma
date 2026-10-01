"use client";

import api from "@/api/api";
import type { AuthTokens, AuthUser, LoginResponse } from "@/types/auth";
import { create } from "zustand";

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  tokens?: AuthTokens | null;
  lastCheckedAt?: number | null;

  setFromLogin: (payload: LoginResponse) => void;
  setFromRefresh: (payload: { user: AuthUser; tokens: AuthTokens }) => void;
  setOAuthAccessToken: (accessToken: string) => void;

  checkAuth: () => Promise<boolean>;

  logout: (opts?: { server?: boolean }) => Promise<void>;

  updateUser: (patch: Partial<AuthUser>) => void;

  reset: () => void;
};

const persistTokens = false;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  tokens: null,
  lastCheckedAt: null,

  setFromLogin: (payload) => {
    const data = payload?.data ?? (payload as unknown as { user?: AuthUser; tokens?: AuthTokens });
    const user = (data as LoginResponse["data"])?.user;
    const tokens = (data as LoginResponse["data"])?.tokens;
    if (!user?._id && !user?.id) {
      throw new Error("Login response did not include a user");
    }
    set({
      user,
      isAuthenticated: Boolean(user?._id || user?.id),
      tokens: persistTokens ? tokens ?? null : null,
      lastCheckedAt: Date.now(),
    });
  },

  setFromRefresh: ({ user, tokens }) => {
    set({
      user,
      isAuthenticated: Boolean(user?._id),
      tokens: persistTokens ? tokens ?? null : null,
      lastCheckedAt: Date.now(),
    });
  },

  setOAuthAccessToken: (accessToken) => {
    set((state) => ({
      tokens: {
        ...(state.tokens ?? {}),
        accessToken,
      },
      lastCheckedAt: Date.now(),
    }));
  },

  checkAuth: async () => {
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await api.get("/auth/me", { withCredentials: true });
          const user: AuthUser | undefined = res?.data?.data?.user ?? res?.data?.user;
          if (user && user._id) {
            set({ user, isAuthenticated: true, lastCheckedAt: Date.now() });
            return true;
          }
        } catch {
          // try refresh fallback below
        }

        try {
          await api.post("/auth/refresh", undefined, { withCredentials: true });
          const retryRes = await api.get("/auth/me", { withCredentials: true });
          const retryUser: AuthUser | undefined =
            retryRes?.data?.data?.user ?? retryRes?.data?.user;
          if (retryUser && retryUser._id) {
            set({
              user: retryUser,
              isAuthenticated: true,
              lastCheckedAt: Date.now(),
            });
            return true;
          }
        } catch {
          // keep retrying below
        }

        await sleep(250);
      }
    } catch {
      // no-op
    }

    set({
      user: null,
      isAuthenticated: false,
      tokens: null,
      lastCheckedAt: Date.now(),
    });
    return false;
  },

  logout: async (opts) => {
    try {
      if (opts?.server !== false) {
        await api.post("/auth/logout", undefined, {
          withCredentials: true,
        });
      }
    } catch {
    } finally {
      if (typeof document !== "undefined") {
        const hostname = window.location.hostname;
        document.cookie.split(";").forEach((cookie) => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.slice(0, eqPos) : cookie;
          const trimmedName = name.trim();
          document.cookie = `${trimmedName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${trimmedName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${hostname}`;
          document.cookie = `${trimmedName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${hostname}`;
        });
      }
      get().reset();
    }
  },

  updateUser: (patch) => {
    const current = get().user;
    if (!current) return;
    set({ user: { ...current, ...patch } });
  },

  reset: () => {
    set({
      user: null,
      isAuthenticated: false,
      tokens: null,
      lastCheckedAt: Date.now(),
    });
  },
}));

export const selectUser = (s: AuthState) => s.user;
export const selectIsAuthenticated = (s: AuthState) => s.isAuthenticated;
export const selectAuthCheckingStale =
  (maxAgeMs = 60_000) =>
  (s: AuthState) =>
    !s.lastCheckedAt || Date.now() - (s.lastCheckedAt ?? 0) > maxAgeMs;

export function setAuthFromLoginResponse(loginResponse: LoginResponse) {
  useAuthStore.getState().setFromLogin(loginResponse);
}
