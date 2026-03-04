"use client";
/**
 * ThemeToggle — compact pill-shaped toggle.
 * Works for EVERYONE (authenticated or not).
 * State lives in useThemeStore (Zustand + localStorage persist),
 * so every instance — navbar, mobile drawer, admin sidebar, dashboard — is in sync.
 */
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/store/uiStore";

export default function ThemeToggle() {
  const { theme, toggle } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`
        relative flex items-center w-[50px] h-[26px] rounded-full p-[3px]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1
        transition-colors duration-300
        ${isDark
          ? "bg-indigo-600/80 border border-indigo-500/50"
          : "bg-amber-100  border border-amber-200"
        }
      `}
    >
      {/* ── Track icons (decorative, always visible) ── */}
      <span className="absolute left-[5px] top-1/2 -translate-y-1/2 pointer-events-none">
        <Sun
          size={10}
          className={`transition-opacity duration-300 text-amber-500
            ${isDark ? "opacity-40" : "opacity-0"}`}
        />
      </span>
      <span className="absolute right-[5px] top-1/2 -translate-y-1/2 pointer-events-none">
        <Moon
          size={10}
          className={`transition-opacity duration-300 text-indigo-300
            ${isDark ? "opacity-0" : "opacity-40"}`}
        />
      </span>

      {/* ── Sliding thumb ── */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 700, damping: 35 }}
        className={`
          relative z-10 w-5 h-5 rounded-full shadow-md flex items-center justify-center
          ${isDark ? "bg-gray-900 ml-auto" : "bg-white ml-0"}
        `}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="moon"
              initial={{ rotate: -120, opacity: 0, scale: 0.3 }}
              animate={{ rotate: 0,    opacity: 1, scale: 1   }}
              exit={{    rotate:  120, opacity: 0, scale: 0.3 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Moon size={11} className="text-indigo-400" />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ rotate: 120,  opacity: 0, scale: 0.3 }}
              animate={{ rotate: 0,    opacity: 1, scale: 1   }}
              exit={{    rotate: -120, opacity: 0, scale: 0.3 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Sun size={11} className="text-amber-500" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
}
