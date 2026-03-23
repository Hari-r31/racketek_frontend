"use client";
/**
 * AuthContext
 *
 * C7 FIX: All js-cookie references removed.
 *   - Hydration no longer reads "access_token" from a cookie.
 *   - Instead it calls POST /auth/refresh immediately on mount.
 *     The browser sends the httpOnly refresh_token cookie automatically.
 *     If refresh succeeds, the new access_token is stored in Zustand memory.
 *   - If refresh fails, the user is logged out (no valid session).
 *
 * Why this is safe:
 *   - The refresh_token cookie is httpOnly — JS cannot read it.
 *   - The access_token never touches any browser storage.
 *   - XSS can no longer steal either token.
 *
 * Hydration flow (on every app load / page reload):
 *   1. AuthProvider mounts → calls POST /auth/refresh with withCredentials.
 *   2. Backend reads httpOnly cookie, verifies refresh token, returns new access_token.
 *   3. access_token stored in Zustand memory (authStore._accessToken).
 *   4. GET /users/profile called to get fresh user data.
 *   5. isReady = true — app renders authenticated content.
 *
 *   If the user has no valid session (never logged in, or refresh token expired):
 *   Step 2 returns 401 → logout() called → isReady = true, user = null.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import axios from "axios";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { User } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface AuthContextValue {
  user:            User | null;
  isLoading:       boolean;
  isReady:         boolean;
  isAuthenticated: boolean;
  syncUser:        (user: User, accessToken: string) => void;
  logout:          () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const storeLogout     = useAuthStore((s) => s.logout);
  const storeSetUser    = useAuthStore((s) => s.setUser);
  const storeUpdateUser = useAuthStore((s) => s.updateUser);
  const storeSetToken   = useAuthStore((s) => s.setToken);
  const persistedUser   = useAuthStore((s) => s.user);

  const [user, setUser]         = useState<User | null>(persistedUser);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isReady, setReady]     = useState<boolean>(false);

  const storeLogoutRef     = useRef(storeLogout);
  const storeSetUserRef    = useRef(storeSetUser);
  const storeUpdateUserRef = useRef(storeUpdateUser);
  const storeSetTokenRef   = useRef(storeSetToken);

  useEffect(() => { storeLogoutRef.current     = storeLogout;     }, [storeLogout]);
  useEffect(() => { storeSetUserRef.current    = storeSetUser;    }, [storeSetUser]);
  useEffect(() => { storeUpdateUserRef.current = storeUpdateUser; }, [storeUpdateUser]);
  useEffect(() => { storeSetTokenRef.current   = storeSetToken;   }, [storeSetToken]);

  // ── Hydration: restore session via refresh token on every mount ───────────
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        // C7 FIX: attempt refresh — browser sends httpOnly cookie automatically.
        // No cookie read in JS. If the user has a valid session this succeeds.
        const refreshRes = await axios.post<{ access_token: string; user: User }>(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (!cancelled) {
          const { access_token, user: refreshedUser } = refreshRes.data;
          // Store token in Zustand memory (not in any cookie/localStorage)
          storeSetTokenRef.current(access_token);

          // Fetch fresh profile to ensure we have the latest user data
          try {
            const profileRes = await api.get<User>("/users/profile");
            if (!cancelled) {
              storeUpdateUserRef.current(profileRes.data);
              setUser(profileRes.data);
            }
          } catch {
            // Profile fetch failed but refresh succeeded — use data from refresh response
            if (!cancelled && refreshedUser) {
              storeUpdateUserRef.current(refreshedUser);
              setUser(refreshedUser);
            }
          }
        }
      } catch {
        // Refresh failed — no valid session
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
  }, []);

  // ── syncUser: called by login/OAuth flows to update context immediately ──
  const syncUser = useCallback((u: User, accessToken: string) => {
    storeSetUserRef.current(u, accessToken);
    setUser(u);
  }, []);

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    storeLogoutRef.current();
    setUser(null);
  }, []);

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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
