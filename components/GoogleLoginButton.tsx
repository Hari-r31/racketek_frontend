"use client";
/**
 * GoogleLoginButton
 * =================
 * Renders the official Google Sign-In button using the GSI SDK via
 * renderGoogleButton() from lib/auth.ts.
 *
 * On success:
 *  1. Receives the raw id_token from GSI (never decoded here)
 *  2. POSTs to POST /api/v1/auth/oauth/google
 *  3. Stores access_token via authStore
 *  4. Calls optional onSuccess(tokenResponse) callback
 *
 * Render stability
 * ----------------
 * The GSI SDK is initialized once per page (enforced in lib/auth.ts).
 * This component's useEffect runs once on mount ([] dependency array).
 * onSuccess/onError props are read via refs so the effect never needs
 * to re-run when parent re-renders with new callback references.
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

  // Keep latest callbacks in refs so the mount-only useEffect always
  // invokes the current version without needing to re-run.
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef   = useRef(onError);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onErrorRef.current   = onError;   }, [onError]);

  const setUser  = useAuthStore((s) => s.setUser);
  const { syncUser } = useAuth();

  const [mounting, setMounting] = useState(true);
  const [busy,     setBusy]     = useState(false);

  // Mount once — initialize GSI and render the button
  useEffect(() => {
    if (!containerRef.current) return;

    let alive = true;

    const init = async () => {
      const cleanup = await renderGoogleButton(
        containerRef.current!,

        // ── onToken: invoked by GSI with the raw id_token ──────────────
        async (idToken: string) => {
          if (!alive) return;
          setBusy(true);
          try {
            const res = await api.post<TokenResponse>("/auth/oauth/google", {
              id_token: idToken,
            });

            const data = res.data;

            // Store access_token (refresh_token is set as httpOnly cookie by backend)
            setUser(data.user, data.access_token);
            // Sync AuthContext immediately so consumers reflect the new user
            syncUser(data.user, data.access_token);

            if (data.is_new_user) {
              toast.success(`Welcome to Racketek, ${data.user.full_name.split(" ")[0]}! 🎉`);
            } else {
              toast.success(`Welcome back, ${data.user.full_name.split(" ")[0]}! 👋`);
            }

            onSuccessRef.current?.(data);
          } catch (err: any) {
            const message =
              err?.response?.data?.detail ||
              "Google login failed. Please try again.";
            toast.error(message);
            onErrorRef.current?.(new Error(message));
          } finally {
            if (alive) setBusy(false);
          }
        },

        // ── onError: invoked by renderGoogleButton on hard failures ─────
        (err: Error) => {
          if (!alive) return;

          // Dismissal/skip is not an error — don't show a toast
          if (
            err.message.startsWith("google_sign_in_skipped") ||
            err.message.startsWith("google_sign_in_dismissed")
          ) {
            return;
          }

          toast.error(err.message || "Google Sign-In failed");
          onErrorRef.current?.(err);
        }
      );

      cleanupRef.current = cleanup;
      if (alive) setMounting(false);
    };

    init();

    return () => {
      alive = false;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []); // Empty array: mount once, never re-run

  return (
    <div className={`relative ${className}`}>
      {/* GSI SDK renders its button into this div */}
      <div ref={containerRef} className="w-full" />

      {/* Skeleton shown while the GSI script loads */}
      {mounting && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white border border-gray-300 text-sm text-gray-500 animate-pulse h-10">
          {loadingLabel}
        </div>
      )}

      {/* Overlay while backend call is in flight */}
      {busy && !mounting && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/80 backdrop-blur-sm">
          <div className="w-5 h-5 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
