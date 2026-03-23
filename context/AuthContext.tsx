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
 *
 * Render stability notes
 * ----------------------
 * useAuthStore() is called with INDIVIDUAL selectors (not the whole store
 * object). Selecting the whole store object causes a new reference on every
 * state update, which makes useCallback re-create logout on every render,
 * which triggers re-renders in all consumers — an infinite cascade.
 * Individual selectors return stable references that only change when that
 * specific slice of state changes.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
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
  // Select INDIVIDUAL stable actions — NOT the whole store object.
  // Selecting the whole store returns a new object reference on every render,
  // which makes useCallback dependencies unstable and causes infinite loops.
  const storeLogout     = useAuthStore((s) => s.logout);
  const storeUpdateUser = useAuthStore((s) => s.updateUser);
  const persistedUser   = useAuthStore((s) => s.user);

  const [user, setUser]         = useState<User | null>(persistedUser);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isReady, setReady]     = useState<boolean>(false);

  // Keep a ref to storeLogout so the hydrate closure below never stales.
  const storeLogoutRef = useRef(storeLogout);
  useEffect(() => { storeLogoutRef.current = storeLogout; }, [storeLogout]);

  const storeUpdateUserRef = useRef(storeUpdateUser);
  useEffect(() => { storeUpdateUserRef.current = storeUpdateUser; }, [storeUpdateUser]);

  // ── Hydration: verify session against backend on mount ──────────────────
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      // Lazy-import js-cookie to avoid SSR issues
      const Cookies = (await import("js-cookie")).default;
      const token = Cookies.get("access_token");

      if (!token) {
        // No token — clear any stale persisted state and mark ready
        storeLogoutRef.current();
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
          storeUpdateUserRef.current(res.data);
          setUser(res.data);
        }
      } catch {
        // Token invalid even after refresh attempt — clean slate
        storeLogoutRef.current();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setReady(true);
        }
      }
    };

    hydrate();
    return () => { cancelled = true; };
  }, []); // Empty array: run once on mount only

  // ── syncUser: called by login/OAuth flows to update context immediately ──
  const syncUser = useCallback((u: User) => {
    setUser(u);
  }, []); // No dependencies — setUser is always stable

  // ── logout: clears backend cookie + local state ──────────────────────────
  const logout = useCallback(async () => {
    // Tell the backend to clear the httpOnly refresh_token cookie.
    // Fire-and-forget: if it fails the cookie expires naturally.
    try {
      await api.post("/auth/logout");
    } catch {}
    storeLogoutRef.current();
    setUser(null);
  }, []); // Stable — uses ref, not storeLogout directly

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
