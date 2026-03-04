"use client";
/**
 * NavigationLoader
 * ─────────────────────────────────────────────────────────────────────────────
 * Shows a loading overlay IMMEDIATELY when any internal link is clicked,
 * BEFORE Next.js even starts navigation. Hides once pathname changes.
 *
 * This solves the "2-5 second blank screen" problem in Next.js App Router
 * where the PageLoader (pathname-based) only fires AFTER navigation completes.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export default function NavigationLoader() {
  const pathname   = usePathname();
  const prevPath   = useRef(pathname);
  const [loading,  setLoading]  = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef     = useRef<number | null>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef    = useRef<ReturnType<typeof setTimeout>  | null>(null);

  /* ── Show loader immediately ─────────────────────────────────────────────── */
  const startLoading = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (hideRef.current)  clearTimeout(hideRef.current);
    if (rafRef.current)   cancelAnimationFrame(rafRef.current);

    setLoading(true);
    setProgress(15);

    let p = 15;
    timerRef.current = setInterval(() => {
      p += p < 30 ? 8 : p < 55 ? 4 : p < 75 ? 2 : p < 85 ? 0.5 : 0;
      p  = Math.min(p, 85);
      setProgress(p);
    }, 80);
  }, []);

  /* ── Hide loader with completion animation ───────────────────────────────── */
  const stopLoading = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    hideRef.current = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 400);
  }, []);

  /* ── Intercept ALL anchor clicks ──────────────────────────────────────────── */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Only internal links (starts with / or same origin)
      const isInternal =
        href.startsWith("/") ||
        href.startsWith(window.location.origin);

      // Skip hash-only, tel:, mailto:, target=_blank
      const isSpecial =
        href.startsWith("#") ||
        href.startsWith("tel:") ||
        href.startsWith("mailto:") ||
        anchor.target === "_blank";

      if (isInternal && !isSpecial) {
        // Don't show for same page
        const targetPath = href.startsWith("/") ? href.split("?")[0] : new URL(href).pathname;
        if (targetPath !== pathname) {
          startLoading();
        }
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname, startLoading]);

  /* ── Stop loading once pathname actually changes ─────────────────────────── */
  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      stopLoading();
    }
  }, [pathname, stopLoading]);

  if (!loading) return null;

  return (
    <>
      {/* Thin progress bar */}
      <div
        aria-hidden="true"
        style={{
          position:  "fixed",
          top:       0,
          left:      0,
          right:     0,
          height:    "3px",
          zIndex:    99999,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            height:     "100%",
            width:      `${progress}%`,
            background: "linear-gradient(90deg,#15803d,#22c55e,#86efac)",
            boxShadow:  "0 0 10px 1px rgba(34,197,94,0.7)",
            borderRadius: "0 2px 2px 0",
            transition: progress >= 100
              ? "width 0.15s ease, opacity 0.3s ease 0.1s"
              : "width 0.1s linear",
            opacity: progress >= 100 ? 0 : 1,
          }}
        >
          {/* Glow orb */}
          <span style={{
            position:  "absolute",
            right:     -5,
            top:       "50%",
            transform: "translateY(-50%)",
            width:     10,
            height:    10,
            borderRadius: "50%",
            background: "#22c55e",
            filter:    "blur(4px)",
          }} />
        </div>
      </div>

      {/* Corner spinner */}
      {progress < 100 && (
        <div
          aria-label="Loading page…"
          style={{
            position:  "fixed",
            bottom:    20,
            right:     20,
            zIndex:    99999,
            width:     30,
            height:    30,
            borderRadius: "50%",
            border:    "2.5px solid rgba(34,197,94,0.18)",
            borderTop: "2.5px solid #22c55e",
            animation: "nav-spin 0.65s linear infinite",
            pointerEvents: "none",
          }}
        />
      )}
      <style>{`@keyframes nav-spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
