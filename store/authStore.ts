"use client";
/**
 * authStore.ts
 * ============
 * Zustand store for authentication state.
 *
 * Token storage model
 * -------------------
 * access_token  → js-cookie "access_token" (JS-readable, 1-day expiry)
 *                 Read by api.ts request interceptor for Authorization header.
 * refresh_token → httpOnly cookie set EXCLUSIVELY by the backend.
 *                 The frontend never stores, reads, or touches it.
 *                 The browser sends it automatically on /api/v1/auth/* requests.
 *
 * setUser() no longer accepts a refresh_token parameter.
 * The backend's Set-Cookie header handles the refresh_token entirely.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import { User } from "@/types";

interface AuthState {
  user:            User | null;
  isAuthenticated: boolean;
  setUser:     (user: User, accessToken: string) => void;
  logout:      () => void;
  updateUser:  (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      isAuthenticated: false,

      setUser: (user, accessToken) => {
        // Store access_token in a JS-accessible cookie.
        // sameSite: "strict" prevents it being sent on cross-origin requests.
        Cookies.set("access_token", accessToken, {
          expires: 1,
          sameSite: "strict",
        });
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        // Clear access_token from JS cookie.
        // The httpOnly refresh_token cookie is cleared by the backend
        // via POST /auth/logout (Set-Cookie: refresh_token=; Max-Age=0).
        Cookies.remove("access_token");
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      // Re-fetch latest user data from server and sync to store.
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
      partialize: (state) => ({
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
