import axios, {
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";
import { tokenStore } from "./tokenStore";

const baseURL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:3000/api";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) {
    const headers = (config.headers ?? new AxiosHeaders()) as AxiosHeaders;
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;
  try {
    const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${baseURL}/auth/refresh`,
      { refreshToken: refresh },
    );
    tokenStore.set(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    tokenStore.clear();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
    const status = error.response?.status;
    const url = original?.url ?? "";

    // Skip refresh for the auth endpoints themselves
    if (
      status === 401 &&
      original &&
      !original._retried &&
      !url.includes("/auth/login") &&
      !url.includes("/auth/refresh")
    ) {
      original._retried = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        const headers = (original.headers ?? new AxiosHeaders()) as AxiosHeaders;
        headers.set("Authorization", `Bearer ${newToken}`);
        original.headers = headers;
        return api.request(original);
      }
      // refresh failed — bounce to login
      if (typeof window !== "undefined" && !window.location.pathname.endsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
