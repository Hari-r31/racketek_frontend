/**
 * lib/api.ts
 * ==========
 * Axios instance pre-configured for the Racketek backend.
 *
 * Token model
 * -----------
 * access_token  — stored in memory only (authStore Zustand, NOT localStorage).
 *                 Read from the js-cookie "access_token" set by authStore.setUser().
 *                 Attached to every request as Authorization: Bearer <token>.
 *
 * refresh_token — NEVER stored in frontend JS. It lives exclusively in an
 *                 httpOnly cookie set by the backend. The browser sends it
 *                 automatically on requests to /api/v1/auth/* (same path
 *                 the backend scoped the cookie to).
 *
 * Refresh flow (401 handling)
 * ---------------------------
 * 1. Request returns 401.
 * 2. Interceptor calls POST /auth/refresh with withCredentials: true.
 *    → Browser automatically includes the httpOnly refresh_token cookie.
 *    → Backend verifies it and returns a new access_token in the body
 *      + rotates the httpOnly cookie.
 * 3. New access_token is stored via authStore.setUser() (cookie + Zustand).
 * 4. Original request is retried.
 * 5. If /auth/refresh also returns 401, all auth state is cleared and the
 *    user is redirected to /auth/login.
 */

import axios, { AxiosInstance } from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  // withCredentials must be true for the browser to send the httpOnly
  // refresh_token cookie on requests to the same origin.
  withCredentials: true,
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Attach the access_token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ──────────────────────────────────────────────────────
// On 401: attempt a silent token refresh, then retry the original request once.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Only retry once. Skip if the failing request IS the refresh call
    // (prevents infinite retry loops).
    const isRefreshEndpoint = original?.url?.includes("/auth/refresh");
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !isRefreshEndpoint
    ) {
      original._retry = true;

      try {
        // POST /auth/refresh — no body needed.
        // The browser sends the httpOnly refresh_token cookie automatically
        // because withCredentials: true is set on the instance.
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Store the new access_token in a JS-accessible cookie so the
        // request interceptor above can read it on the retry.
        Cookies.set("access_token", data.access_token, {
          expires: 1,
          sameSite: "strict",
        });

        // Retry the original request with the new token
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        // Refresh failed — clear all auth state and redirect to login
        Cookies.remove("access_token");

        // Dynamically import authStore to avoid circular dependency at
        // module evaluation time.
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
