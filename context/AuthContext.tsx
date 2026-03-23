"use client";
/**
 * AuthContext
 * ===========
 * Single source of truth for authentication state.
 *
 * On every app load (or page reload) it calls GET /users/profile to verify
 * the stored access_token is still valid. If the token is expired, the 401
 * interceptor in api.ts attempts a refresh automatically. If refresh also
 * fails, the user is logged out and redirected to /auth/login.
 *
 * Components should consume this via useAuth() — do NOT read authStore
 * directly for auth-gating decisions; always prefer this context which
 * reflects the server-verified state.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { User } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Server-verified user. null = logged out or still loading. */
  user: User | null;
  /** true while the initial /users/profile call is in flight */
  isLoading: boolean;
  /** true after the initial hydration has resolved (success OR failure) */
  isReady: boolean;
  /** true only when user is non-null AND isReady */
  isAuthenticated: boolean;
  /** Call after a successful login to sync context immediately */
  syncUser: (user: User) => void;
  /** Clears all auth state and tokens (also clears httpOnly cookie via backend) */
  logout: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const store = useAuthStore();

  const [user, setUser]         = useState<User | null>(store.user);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isReady, setReady]     = useState<boolean>(false);

  // On mount: verify session against the backend.
  // The api interceptor handles 401 → refresh → retry automatically.
  // If it still fails after refresh, the interceptor clears cookies and
  // redirects; we just log out the local state here too.
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      // No token at all → skip the network call
      const { Cookies } = await import("js-cookie").then((m) => ({
        Cookies: m.default,
      }));
      const token = Cookies.get("access_token");

      if (!token) {
        store.logout(); // clear any stale Zustand persist state
        if (!cancelled) {
          setUser(null);
          setLoading(false);
          setReady(true);
        }
        return;
      }

      try {
        const res = await api.get<User>("/users/profile");
        if (!cancelled) {
          store.updateUser(res.data); // keep Zustand in sync
          setUser(res.data);
        }
      } catch {
        // Token invalid even after refresh attempt — clean slate
        store.logout();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setReady(true);
        }
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncUser = useCallback((u: User) => {
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    // Tell the backend to clear the httpOnly refresh_token cookie.
    // Fire-and-forget: if it fails the cookie will just expire naturally.
    try {
      await api.post("/auth/logout");
    } catch {}
    store.logout();
    setUser(null);
  }, [store]);

  const value: AuthContextValue = {
    user,
    isLoading,
    isReady,
    isAuthenticated: !!user && isReady,
    syncUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
