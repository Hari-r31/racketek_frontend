"use client";
import { useEffect } from "react";
import { useThemeStore } from "@/store/uiStore";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    // Disable transitions briefly to prevent flash on initial paint
    root.style.setProperty("transition", "none");
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    // Re-enable transitions after paint
    window.requestAnimationFrame(() => {
      root.style.removeProperty("transition");
    });
  }, [theme]);

  return <>{children}</>;
}
