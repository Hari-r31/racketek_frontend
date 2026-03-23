"use client";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, ShoppingBag, Users, Package,
  AlertTriangle, Sun, Moon,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { DashboardSummary } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useThemeStore } from "@/store/uiStore";

/* ── Stat card ─────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: any; color: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/* ── Animated theme toggle pill (larger, dashboard-style) ──────────────── */
function DashboardThemeToggle() {
  const { theme, toggle } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={`
        relative flex items-center gap-2 px-3 py-1.5 rounded-full border
        font-semibold text-xs transition-all duration-300 select-none
        ${isDark
          ? "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
        }
      `}
    >
      {/* Animated icon */}
      <span className="relative w-4 h-4 flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span key="moon"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0,   opacity: 1, scale: 1 }}
              exit={{    rotate:  90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Moon size={14} className="text-indigo-400" />
            </motion.span>
          ) : (
            <motion.span key="sun"
              initial={{ rotate: 90,  opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0,   opacity: 1, scale: 1 }}
              exit={{    rotate: -90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Sun size={14} className="text-amber-500" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      {/* Sliding pill indicator + label */}
      <span>{isDark ? "Dark" : "Light"}</span>

      {/* Tiny dot indicator */}
      <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${isDark ? "bg-indigo-400" : "bg-amber-400"}`} />
    </button>
  );
}

/* ── Dashboard page ─────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { data, isLoading } = useQuery<DashboardSummary>({
    queryKey: ["admin-dashboard"],
    queryFn: () => api.get("/admin/dashboard").then((r) => r.data),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  const stats = [
    {
      label: "Total Revenue",
      value: formatPrice(data?.total_revenue || 0),
      icon: TrendingUp, color: "bg-brand-600",
      sub: `This month: ${formatPrice(data?.monthly_revenue || 0)}`,
    },
    {
      label: "Total Orders",
      value: data?.total_orders || 0,
      icon: ShoppingBag, color: "bg-blue-600",
      sub: `This month: ${data?.monthly_orders || 0}`,
    },
    {
      label: "Total Users",
      value: data?.total_users || 0,
      icon: Users, color: "bg-purple-600",
      sub: `Avg order: ${formatPrice(data?.avg_order_value || 0)}`,
    },
    {
      label: "Products",
      value: data?.total_products || 0,
      icon: Package, color: "bg-green-600",
      sub: `${data?.low_stock_count || 0} low stock / ${data?.out_of_stock_count || 0} out`,
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Page header with synced theme toggle ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening.</p>
        </div>

        {/* ★ Theme toggle — synced with navbar & entire app ★ */}
        <DashboardThemeToggle />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Low stock alert */}
      {(data?.low_stock_count || 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {data?.low_stock_count} product(s) are running low on stock
            </p>
            <p className="text-xs text-amber-600">Check inventory to restock</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-black text-gray-800 mb-5">Revenue (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.revenue_chart || []}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="recharts-cartesian-grid" stroke="var(--chart-grid, #f0f0f0)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatPrice(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-black text-gray-800 mb-4">Top Products</h3>
          <div className="space-y-3">
            {(data?.top_products || []).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.sold_count} sold</p>
                </div>
                <span className="text-sm font-bold text-gray-900 shrink-0">{formatPrice(p.price)}</span>
              </div>
            ))}
            {!data?.top_products?.length && (
              <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
