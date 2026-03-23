"use client";
/**
 * authStore.ts
 *
 * C7 FIX: access_token is stored in Zustand memory ONLY.
 *   - No js-cookie, no localStorage, no sessionStorage.
 *   - The token lives in the Zustand store for the lifetime of the tab.
 *   - On page reload it is gone; AuthContext.hydrate() calls POST /auth/refresh
 *     (which uses the httpOnly refresh_token cookie the browser sends automatically)
 *     to obtain a fresh access_token without any user interaction.
 *   - XSS can no longer steal the access_token because it is not in any
 *     browser-accessible storage.
 *
 * Token storage model (after fix)
 * --------------------------------
 * access_token  → Zustand memory only (this file).
 *                 Read by api.ts request interceptor.
 *                 Lost on page reload — re-issued via refresh flow.
 *
 * refresh_token → httpOnly cookie set EXCLUSIVELY by the backend.
 *                 The frontend never reads or stores it.
 *                 The browser sends it automatically on /api/v1/auth/* requests.
 *
 * persist middleware: only persists { user, isAuthenticated } to localStorage.
 * access_token is explicitly excluded from persistence via `partialize`.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";

interface AuthState {
  user:            User | null;
  isAuthenticated: boolean;
  /** In-memory only — NOT persisted, NOT stored in any cookie */
  _accessToken:    string | null;

  setUser:     (user: User, accessToken: string) => void;
  logout:      () => void;
  updateUser:  (updates: Partial<User>) => void;
  getToken:    () => string | null;
  setToken:    (token: string) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      isAuthenticated: false,
      _accessToken:    null,   // never persisted (excluded in partialize below)

      setUser: (user, accessToken) => {
        // C7 FIX: token goes into Zustand memory — never into a cookie
        set({ user, isAuthenticated: true, _accessToken: accessToken });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, _accessToken: null });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      getToken: () => get()._accessToken,

      setToken: (token) => set({ _accessToken: token }),

      refreshUser: async () => {
        try {
          const api = (await import("@/lib/api")).default;
          const res = await api.get("/users/profile");
          set({ user: res.data });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: "racketek-auth",
      // C7 FIX: _accessToken is explicitly excluded from localStorage persistence.
      // Only user identity metadata is persisted so the UI can show the correct
      // user name/avatar immediately on reload while the refresh flow runs.
      partialize: (state) => ({
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
        // _accessToken intentionally omitted
      }),
    }
  )
);
