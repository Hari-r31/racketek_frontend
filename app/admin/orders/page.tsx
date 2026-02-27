"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import api from "@/lib/api";
import { formatDate, formatPrice, getStatusColor } from "@/lib/utils";

const ORDER_STATUSES = [
  "pending", "paid", "processing", "shipped",
  "out_for_delivery", "delivered", "cancelled", "returned", "refunded",
];

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", page, status, search],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), per_page: "20" });
      if (status) p.set("status", status);
      if (search) p.set("search", search);
      return api.get(`/admin/orders?${p.toString()}`).then((r) => r.data);
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ orderId, newStatus }: { orderId: number; newStatus: string }) =>
      api.put(`/admin/orders/${orderId}/status`, { status: newStatus }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-gray-900">Order Management</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search order number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-8 w-52 text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="input w-auto text-sm"
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-4 py-3 font-semibold text-gray-600">Order</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Customer</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Total</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              [...Array(10)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data?.items?.map((order: any) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">{order.order_number}</td>
                <td className="px-4 py-3 text-gray-600">
                  <div>
                    <p>{order.user?.full_name || "—"}</p>
                    <p className="text-xs text-gray-400">{order.user?.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDate(order.created_at)}</td>
                <td className="px-4 py-3 font-bold text-gray-900">{formatPrice(order.total_amount)}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${getStatusColor(order.status)}`}>
                    {order.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus.mutate({ orderId: order.id, newStatus: e.target.value })}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replace("_", " ")}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {data?.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {((page - 1) * 20) + 1} – {Math.min(page * 20, data.total)} of {data.total}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 border rounded-lg disabled:opacity-40">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages} className="p-1.5 border rounded-lg disabled:opacity-40">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
