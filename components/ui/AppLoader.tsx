/**
 * AppLoader — reusable loading states used throughout the app
 *
 * Usage:
 *   import { Skeleton, CardSkeleton, TableSkeleton, SpinCenter } from "@/components/ui/AppLoader";
 */

// ── Base Skeleton block ───────────────────────────────────────────────────────
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-lg ${className}`}
      aria-hidden="true"
    />
  );
}

// ── Full-page centred spinner ─────────────────────────────────────────────────
export function SpinCenter({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] gap-3 py-16">
      <svg viewBox="0 0 40 40" className="w-10 h-10 animate-spin" fill="none">
        <circle cx="20" cy="20" r="16" stroke="#e5e7eb" strokeWidth="4" />
        <path d="M20 4 A16 16 0 0 1 36 20" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <p className="text-sm font-medium text-gray-400">{label}</p>
    </div>
  );
}

// ── Product card skeletons ────────────────────────────────────────────────────
export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="p-4 space-y-2.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Admin table skeleton ──────────────────────────────────────────────────────
export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-gray-50">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-3.5">
          {[...Array(cols)].map((_, j) => (
            <Skeleton key={j} className={`h-4 flex-1 ${j === cols - 1 ? "max-w-[80px]" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Full admin page skeleton ──────────────────────────────────────────────────
export function PageSkeleton() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Fake sidebar */}
      <div className="w-56 shrink-0 bg-gray-900 h-screen flex flex-col p-4 gap-2.5">
        <div className="h-10 bg-gray-800 rounded-xl mb-3 animate-pulse" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-9 bg-gray-800 rounded-xl animate-pulse" style={{ opacity: 1 - i * 0.07 }} />
        ))}
      </div>
      {/* Fake content */}
      <div className="flex-1 p-6 space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Skeleton className="h-12 rounded-none" />
          <TableSkeleton rows={8} cols={5} />
        </div>
      </div>
    </div>
  );
}

// ── Hero banner skeleton ──────────────────────────────────────────────────────
export function HeroSkeleton() {
  return <Skeleton className="w-full aspect-[16/7] rounded-none" />;
}

// ── Storefront category row skeleton ─────────────────────────────────────────
export function CategoryRowSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden px-4 py-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="shrink-0 flex flex-col items-center gap-2">
          <Skeleton className="w-16 h-16 rounded-2xl" />
          <Skeleton className="h-3 w-14" />
        </div>
      ))}
    </div>
  );
}

// ── Inline paragraph skeleton ─────────────────────────────────────────────────
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5">
      {[...Array(lines)].map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? "w-3/5" : "w-full"}`} />
      ))}
    </div>
  );
}
