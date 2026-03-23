/**
 * lib/api.ts
 *
 * C7 FIX: access_token is NO LONGER stored in or read from a js-cookie.
 *   - Token is read from Zustand store memory via useAuthStore.getState().getToken()
 *   - On 401: POST /auth/refresh is called (browser sends httpOnly cookie automatically)
 *   - New access_token from refresh response is stored back into Zustand memory only
 *   - No Cookies.set / Cookies.remove calls anywhere in this file
 *
 * Token model (after fix)
 * -----------------------
 * access_token  → Zustand memory (authStore._accessToken). Lost on tab close/reload.
 *                 Re-issued transparently via the 401 refresh flow.
 * refresh_token → httpOnly backend cookie. Never touched by frontend JS.
 */

import axios, { AxiosInstance } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  // Required so the browser sends the httpOnly refresh_token cookie
  // on same-origin requests to /api/v1/auth/*
  withCredentials: true,
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Read the access_token from Zustand memory (never from a cookie).
api.interceptors.request.use((config) => {
  // Dynamic import avoided here — we use getState() directly which is sync.
  // The store module is always loaded before any API call is made because
  // AuthProvider mounts before any data-fetching component.
  try {
    const { useAuthStore } = require("@/store/authStore");
    const token = useAuthStore.getState().getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // store not yet initialized (SSR or very early render) — skip header
  }
  return config;
});

// ── Response interceptor ──────────────────────────────────────────────────────
// On 401: attempt a silent token refresh, then retry the original request once.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    const isRefreshEndpoint = original?.url?.includes("/auth/refresh");
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !isRefreshEndpoint
    ) {
      original._retry = true;

      try {
        // POST /auth/refresh — no body needed.
        // The browser sends the httpOnly refresh_token cookie automatically.
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // C7 FIX: store new access_token in Zustand memory only — no cookie
        const { useAuthStore } = await import("@/store/authStore");
        useAuthStore.getState().setToken(data.access_token);
        // Also sync user data if returned
        if (data.user) {
          useAuthStore.getState().updateUser(data.user);
        }

        // Retry original request with new token
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        // Refresh failed — clear all auth state and redirect to login
        try {
          const { useAuthStore } = await import("@/store/authStore");
          useAuthStore.getState().logout();
        } catch {}

        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
