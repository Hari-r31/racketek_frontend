"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";

const PIE_COLORS = ["#ea580c", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);

  const { data: revenue } = useQuery({
    queryKey: ["admin-analytics-revenue", days],
    queryFn: () => api.get(`/admin/analytics/revenue?days=${days}`).then((r) => r.data),
  });

  const { data: products } = useQuery({
    queryKey: ["admin-analytics-products"],
    queryFn: () => api.get("/admin/analytics/products?limit=10").then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-analytics-categories"],
    queryFn: () => api.get("/admin/analytics/categories").then((r) => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ["admin-analytics-summary"],
    queryFn: () => api.get("/admin/analytics/summary").then((r) => r.data),
  });

  const handleExport = () => {
    window.open(`/api/v1/admin/analytics/export/csv?days=${days}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Analytics</h1>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="input w-auto text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
            <p className="text-2xl font-black text-gray-900">{formatPrice(summary.total_revenue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500 mb-1">Total Orders</p>
            <p className="text-2xl font-black text-gray-900">{summary.total_orders}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500 mb-1">Avg Order Value</p>
            <p className="text-2xl font-black text-gray-900">{formatPrice(summary.avg_order_value)}</p>
          </div>
        </div>
      )}

      {/* Revenue Over Time */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-black text-gray-800 mb-5">Daily Revenue (Last {days} days)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={revenue || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => [formatPrice(v), "Revenue"]} />
            <Bar dataKey="revenue" fill="#ea580c" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-black text-gray-800 mb-4">Top Products by Revenue</h3>
          <div className="space-y-3">
            {(products || []).map((p: any, i: number) => (
              <div key={p.product_id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 truncate">{p.product_name}</span>
                    <span className="text-sm font-bold text-gray-900 ml-2">{formatPrice(p.revenue)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${Math.min((p.revenue / (products?.[0]?.revenue || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{p.units_sold} units</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-black text-gray-800 mb-4">Revenue by Category</h3>
          {categories?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ category, percent }) =>
                    `${category} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {(categories || []).map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatPrice(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No category data yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
