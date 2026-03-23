"use client";
/**
 * GoogleLoginButton
 * =================
 * Renders the official Google Sign-In button using the GSI SDK via
 * renderGoogleButton() from lib/auth.ts.
 *
 * On success:
 *  1. Extracts the raw id_token (never decoded here)
 *  2. POSTs to POST /api/v1/auth/oauth/google
 *  3. Stores access_token + refresh_token via authStore
 *  4. Calls optional onSuccess(tokenResponse) callback
 *
 * On failure: shows a toast and calls optional onError(err) callback.
 *
 * Props:
 *  onSuccess  - called after full login (store updated)
 *  onError    - called if any step fails
 *  className  - wrapper div class
 */

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { renderGoogleButton } from "@/lib/auth";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/context/AuthContext";
import { TokenResponse } from "@/types";

interface Props {
  onSuccess?: (data: TokenResponse) => void;
  onError?:   (err: Error) => void;
  className?: string;
  /** Shown while the button is mounting / the GSI script is loading */
  loadingLabel?: string;
}

export default function GoogleLoginButton({
  onSuccess,
  onError,
  className = "",
  loadingLabel = "Loading Google Sign-In…",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef   = useRef<(() => void) | null>(null);

  const { setUser }  = useAuthStore();
  const { syncUser } = useAuth();

  const [mounting, setMounting] = useState(true);
  const [busy,     setBusy]     = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let alive = true;

    const init = async () => {
      const cleanup = await renderGoogleButton(
        containerRef.current!,
        // ── onToken: called by GSI when user consents ──────────────────
        async (idToken: string) => {
          if (!alive) return;
          setBusy(true);
          try {
            const res = await api.post<TokenResponse>("/auth/oauth/google", {
              id_token: idToken,
            });

            const data = res.data;

            // Store access_token + user (refresh_token is httpOnly cookie set by backend)
            setUser(data.user, data.access_token);
            // Sync context so AuthProvider reflects new user immediately
            syncUser(data.user);

            if (data.is_new_user) {
              toast.success(`Welcome to Racketek, ${data.user.full_name.split(" ")[0]}! 🎉`);
            } else {
              toast.success(`Welcome back, ${data.user.full_name.split(" ")[0]}! 👋`);
            }

            onSuccess?.(data);
          } catch (err: any) {
            const message =
              err?.response?.data?.detail ||
              "Google login failed. Please try again.";
            toast.error(message);
            const e = new Error(message);
            onError?.(e);
          } finally {
            if (alive) setBusy(false);
          }
        },
        // ── onError: called by renderGoogleButton on hard failures ──────
        (err: Error) => {
          if (!alive) return;

          // User dismissal / skip is not a real error — show nothing
          if (
            err.message.startsWith("google_sign_in_skipped") ||
            err.message.startsWith("google_sign_in_dismissed")
          ) {
            return;
          }

          toast.error(err.message || "Google Sign-In failed");
          onError?.(err);
        }
      );

      cleanupRef.current = cleanup;
      if (alive) setMounting(false);
    };

    init();

    return () => {
      alive = false;
      cleanupRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* The GSI SDK renders its button into this div */}
      <div ref={containerRef} className="w-full" />

      {/* Mounting skeleton — matches GSI button height */}
      {mounting && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white border border-gray-300 text-sm text-gray-500 animate-pulse h-10">
          {loadingLabel}
        </div>
      )}

      {/* Busy overlay while we're calling the backend */}
      {busy && !mounting && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/80 backdrop-blur-sm">
          <div className="w-5 h-5 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
