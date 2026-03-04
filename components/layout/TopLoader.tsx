"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * TopLoader — thin progress bar + spinning ring on route change.
 * Drop this into app/layout.tsx (or the root layout) once only.
 */
export default function TopLoader() {
  const pathname   = usePathname();
  const [active,   setActive]   = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPath   = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    // Start loading
    setProgress(0);
    setActive(true);

    // Simulate incremental progress
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 85) { clearInterval(timerRef.current!); return 85; }
        return p + Math.random() * 12;
      });
    }, 120);

    // Complete after short delay (real navigation finishes quickly)
    const done = setTimeout(() => {
      clearInterval(timerRef.current!);
      setProgress(100);
      setTimeout(() => setActive(false), 350);
    }, 600);

    return () => {
      clearInterval(timerRef.current!);
      clearTimeout(done);
    };
  }, [pathname]);

  if (!active && progress === 0) return null;

  return (
    <>
      {/* Thin top progress bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          height: "3px",
          background: "transparent",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #16a34a, #22c55e, #86efac)",
            boxShadow: "0 0 8px #22c55e",
            borderRadius: "0 2px 2px 0",
            transition: progress === 100 ? "width 0.2s ease, opacity 0.3s ease" : "width 0.15s ease",
            opacity: active ? 1 : 0,
          }}
        />
      </div>

      {/* Spinner ring in top-right corner */}
      {active && progress < 100 && (
        <div
          style={{
            position: "fixed",
            top: "14px",
            right: "18px",
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="animate-spin">
            <circle cx="9" cy="9" r="7" stroke="#e5e7eb" strokeWidth="2.5" />
            <path d="M9 2 A7 7 0 0 1 16 9" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </>
  );
}
