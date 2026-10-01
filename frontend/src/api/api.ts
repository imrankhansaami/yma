import { useAuthStore } from "@/store/useAuthStore";
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

const REFRESH_URL = "/auth/refresh";
const NO_REFRESH_ON_401 = [
  REFRESH_URL,
  "/auth/login",
  "/auth/register",
  "/auth/me",
];

let isRefreshing = false;
let refreshSubscribers: Array<() => void> = [];

const subscribeTokenRefresh = (cb: () => void) => {
  refreshSubscribers.push(cb);
};
const onRefreshSuccess = () => {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
};

interface RetriableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

const refreshClient = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const token = useAuthStore.getState().tokens?.accessToken;
  if (token && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error?.config as RetriableRequestConfig | undefined;
    const status = error?.response?.status;

    if (status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    const reqUrl = originalRequest.url ?? "";

    if (NO_REFRESH_ON_401.some((p) => reqUrl.includes(p))) {
      // await handleLogout();
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      // await handleLogout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh(() => resolve(api(originalRequest)));
      });
    }
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await refreshClient.post(REFRESH_URL);
      const refreshedUser = (refreshResponse.data as any)?.data?.user;
      const refreshedTokens = (refreshResponse.data as any)?.data?.tokens;
      if (refreshedUser && refreshedTokens) {
        useAuthStore.getState().setFromRefresh({
          user: refreshedUser,
          tokens: refreshedTokens,
        });
      }
      isRefreshing = false;
      onRefreshSuccess();
      return api(originalRequest);
    } catch (e) {
      isRefreshing = false;
      refreshSubscribers = [];
      // await handleLogout();
      return Promise.reject(e);
    }
  },
);

export default api;
