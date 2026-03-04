"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * PageLoader — thin branded progress bar + corner spinner.
 * Fires on EVERY route change (pathname OR searchParams change).
 * Placed inside <Suspense> in app/layout.tsx.
 */
export default function PageLoader() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [visible,  setVisible]  = useState(false);
  const [done,     setDone]     = useState(false);

  const timerRef    = useRef<ReturnType<typeof setInterval>  | null>(null);
  const completeRef = useRef<ReturnType<typeof setTimeout>   | null>(null);
  const hideRef     = useRef<ReturnType<typeof setTimeout>   | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current)    clearInterval(timerRef.current);
    if (completeRef.current) clearTimeout(completeRef.current);
    if (hideRef.current)     clearTimeout(hideRef.current);
  }, []);

  const start = useCallback(() => {
    clear();
    setDone(false);
    setVisible(true);
    setProgress(8);

    let p = 8;
    timerRef.current = setInterval(() => {
      // easing: fast early, slows toward 85
      const step = p < 25 ? 9 : p < 50 ? 5 : p < 70 ? 2.5 : p < 83 ? 0.8 : 0;
      p = Math.min(p + step, 85);
      setProgress(p);
    }, 90);

    completeRef.current = setTimeout(() => {
      clear();
      setProgress(100);
      setDone(true);
      hideRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
        setDone(false);
      }, 450);
    }, 300);
  }, [clear]);

  useEffect(() => {
    start();
    return clear;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <>
      {/* ── Thin progress bar ─────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
        style={{ height: 3 }}
      >
        {/* Track */}
        <div className="absolute inset-0 bg-transparent" />
        {/* Fill */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, bottom: 0,
            width: `${progress}%`,
            background: "linear-gradient(90deg, #15803d, #22c55e, #86efac)",
            boxShadow: "0 0 12px 1px rgba(34,197,94,0.6)",
            borderRadius: "0 3px 3px 0",
            transition: done
              ? "width 0.15s ease-in, opacity 0.35s ease 0.15s"
              : "width 0.12s linear",
            opacity: done ? 0 : 1,
          }}
        >
          {/* Leading glow orb */}
          <span
            style={{
              position: "absolute", right: -6, top: "50%", transform: "translateY(-50%)",
              width: 12, height: 12, borderRadius: "50%",
              background: "#22c55e",
              filter: "blur(5px)",
              opacity: 0.8,
            }}
          />
        </div>
      </div>

      {/* ── Corner spinner ────────────────────────────────────────────────── */}
      {!done && (
        <div
          aria-label="Loading…"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-[9999] pointer-events-none"
          style={{
            width: 34, height: 34,
            borderRadius: "50%",
            border: "2.5px solid rgba(34,197,94,0.15)",
            borderTop: "2.5px solid #22c55e",
            animation: "spin 0.7s linear infinite",
          }}
        />
      )}

      {/* Keyframes injected once */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
