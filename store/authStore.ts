"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import { User } from "@/types";

interface AuthState {
  user:            User | null;
  isAuthenticated: boolean;
  setUser:    (user: User, accessToken: string, refreshToken: string) => void;
  logout:     () => void;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      isAuthenticated: false,

      setUser: (user, accessToken, refreshToken) => {
        Cookies.set("access_token",  accessToken,  { expires: 1 });
        Cookies.set("refresh_token", refreshToken, { expires: 7 });
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      // Re-fetch latest user data from server and sync to store
      refreshUser: async () => {
        try {
          const { default: api } = await import("@/lib/api");
          const res = await api.get("/users/profile");
          set({ user: res.data });
        } catch {
          // Token expired or invalid — log out silently
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
