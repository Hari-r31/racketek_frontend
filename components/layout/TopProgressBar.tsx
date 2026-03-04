"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * TopProgressBar — thin green progress bar at top of page during navigation.
 * Inspired by YouTube / GitHub style. Zero dependencies beyond Next.js.
 */
export default function TopProgressBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth]     = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPath = useRef(pathname);

  const start = () => {
    setVisible(true);
    setWidth(0);
    // Quickly jump to 15%, then crawl to 85%
    setTimeout(() => setWidth(15), 30);
    setTimeout(() => setWidth(40), 200);
    setTimeout(() => setWidth(65), 600);
    setTimeout(() => setWidth(85), 1200);
  };

  const finish = () => {
    setWidth(100);
    setTimeout(() => { setVisible(false); setWidth(0); }, 350);
  };

  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      finish();
    }
  }, [pathname]);

  // Intercept Next.js link clicks to start the bar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href === pathname) return;
      start();
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      style={{
        position:    "fixed",
        top:         0,
        left:        0,
        height:      "3px",
        width:       `${width}%`,
        zIndex:      9999,
        transition:  width === 100 ? "width 0.2s ease" : "width 0.4s ease",
        background:  "linear-gradient(90deg, #16a34a, #22c55e)",
        boxShadow:   "0 0 8px #22c55e80",
        borderRadius: "0 2px 2px 0",
      }}
    />
  );
}
