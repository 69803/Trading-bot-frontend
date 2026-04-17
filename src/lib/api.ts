import axios from "axios";
import { API_URL } from "@/config/constants";

const api = axios.create({ baseURL: API_URL });

// Request interceptor: attach Bearer token + X-Account-Mode from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    let token = localStorage.getItem("access_token");

    // Fallback: if access_token key is missing, read from Zustand auth-storage
    if (!token) {
      try {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          token = parsed?.state?.token ?? null;
          // Sync it back so future requests don't need the fallback
          if (token) localStorage.setItem("access_token", token);
        }
      } catch {
        // ignore parse errors
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("AUTH HEADER ATTACHED: YES", config.url);
    } else {
      console.log("AUTH HEADER ATTACHED: NO", config.url);
    }

    // Attach account mode header — read from Zustand persisted state
    let accountMode = "paper";
    try {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        accountMode = parsed?.state?.accountMode ?? "paper";
      }
    } catch {
      // default to paper on parse error — never accidentally use live
    }
    config.headers["X-Account-Mode"] = accountMode;
  }
  return config;
});

// Response interceptor: on 401, attempt token refresh; on failure, redirect to login
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (
      err.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== "undefined"
    ) {
      const refreshToken = localStorage.getItem("refresh_token");

      // No refresh token → go to login
      if (!refreshToken) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("auth-storage");
        window.location.href = "/login";
        return Promise.reject(err);
      }

      if (isRefreshing) {
        // Queue requests while refresh is in flight
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const resp = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const { access_token, refresh_token: newRefresh } = resp.data;

        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", newRefresh);

        // Sync new tokens into Zustand auth-storage so reloads don't use stale tokens
        try {
          const authStorage = localStorage.getItem("auth-storage");
          const parsed = authStorage ? JSON.parse(authStorage) : { state: {}, version: 0 };
          parsed.state.token = access_token;
          parsed.state.refreshToken = newRefresh;
          localStorage.setItem("auth-storage", JSON.stringify(parsed));
        } catch {
          // ignore — explicit keys are already updated above
        }

        processQueue(null, access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("auth-storage");
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;
