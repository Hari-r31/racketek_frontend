"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user, accessToken, refreshToken) => {
        Cookies.set("access_token", accessToken, { expires: 1 });
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
    }),
    {
      name: "racketek-auth",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
