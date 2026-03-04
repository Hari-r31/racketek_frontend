/**
 * Shared loading primitives used everywhere in the app.
 * Import from "@/components/ui/loaders"
 */
import React from "react";

/* ── Skeleton base ──────────────────────────────────────────────────────────── */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
  );
}

/* ── Skeleton variants ──────────────────────────────────────────────────────── */
export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 && lines > 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-5 space-y-4 ${className}`}>
      <Skeleton className="h-5 w-1/3" />
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonProductCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="aspect-square w-full skeleton-shimmer" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 w-2/3 skeleton-shimmer rounded" />
        <div className="h-4 w-full skeleton-shimmer rounded" />
        <div className="h-4 w-3/4 skeleton-shimmer rounded" />
        <div className="h-5 w-1/3 skeleton-shimmer rounded mt-1" />
        <div className="h-9 w-full skeleton-shimmer rounded-lg mt-2" />
      </div>
    </div>
  );
}

export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 rounded" />
        </td>
      ))}
    </tr>
  );
}

/* ── Spinner ────────────────────────────────────────────────────────────────── */
export function Spinner({
  size = 24,
  color = "#22c55e",
  className = "",
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
      aria-label="Loading"
    >
      <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.15" strokeWidth="3" />
      <path
        d="M12 3 A9 9 0 0 1 21 12"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Full-page loading overlay ──────────────────────────────────────────────── */
export function PageSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-gray-400">
      <Spinner size={40} />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

/* ── Inline loading state for buttons ──────────────────────────────────────── */
export function BtnSpinner() {
  return (
    <span
      className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin opacity-70"
      aria-hidden="true"
    />
  );
}

/* ── Section-level loading card ─────────────────────────────────────────────── */
export function LoadingCard({ label = "Loading…", className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 flex items-center justify-center py-16 gap-3 text-gray-400 ${className}`}>
      <Spinner size={22} />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

/* ── Skeleton grid for product listings ─────────────────────────────────────── */
export function SkeletonProductGrid({ count = 8, cols = 4 }: { count?: number; cols?: number }) {
  const gridClass: Record<number, string> = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  };
  return (
    <div className={`grid ${gridClass[cols] || "grid-cols-4"} gap-5`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  );
}

/* ── Admin table skeleton ───────────────────────────────────────────────────── */
export function SkeletonTable({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} cols={cols} />
      ))}
    </>
  );
}

/* ── Hero skeleton ──────────────────────────────────────────────────────────── */
export function SkeletonHero() {
  return (
    <div className="relative w-full bg-gray-200 animate-pulse" style={{ minHeight: 520 }}>
      <div className="absolute inset-0 flex flex-col justify-end px-8 sm:px-16 pb-16 gap-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-12 w-40 mt-2" />
      </div>
    </div>
  );
}
