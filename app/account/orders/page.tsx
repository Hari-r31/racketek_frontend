"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Package, ChevronRight, ChevronLeft } from "lucide-react";
import api from "@/lib/api";
import { PaginatedOrders } from "@/types";
import { formatDate, formatPrice, getStatusColor } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "",            label: "All Orders"  },
  { value: "pending",     label: "Pending"     },
  { value: "paid",        label: "Paid"        },
  { value: "processing",  label: "Processing"  },
  { value: "shipped",     label: "Shipped"     },
  { value: "delivered",   label: "Delivered"   },
  { value: "cancelled",   label: "Cancelled"   },
];

export default function OrdersPage() {
  const [page,   setPage]   = useState(1);
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery<PaginatedOrders>({
    queryKey: ["orders", page, status],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), per_page: "10" });
      if (status) params.set("status", status);
      return api.get(`/orders?${params.toString()}`).then(r => r.data);
    },
  });

  return (
    <div className="card">
      {/* ── Header + filters ───────────────────────────────────────────── */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-gray-900 text-xl">My Orders</h2>
          {data?.total !== undefined && (
            <span className="text-sm text-gray-400 font-medium">{data.total} order{data.total !== 1 ? "s" : ""}</span>
          )}
        </div>
        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                status === f.value
                  ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                  : "bg-white text-gray-700 border-gray-200 hover:border-brand-400 hover:text-brand-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Column headers ─────────────────────────────────────────────── */}
      <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
        <span>Order</span>
        <span className="w-28 text-center">Status</span>
        <span className="w-28 text-center">Date</span>
        <span className="w-24 text-right">Total</span>
      </div>

      {/* ── Loading skeleton ────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="divide-y divide-gray-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 sm:p-5 animate-pulse flex justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-100 rounded w-40" />
                <div className="h-3 bg-gray-100 rounded w-24" />
              </div>
              <div className="h-5 bg-gray-100 rounded w-20" />
            </div>
          ))}
        </div>

      /* ── Empty state ──────────────────────────────────────────────────── */
      ) : !data?.items?.length ? (
        <div className="p-12 text-center">
          <Package size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="font-bold text-gray-700 mb-2">No orders found</h3>
          <p className="text-gray-400 text-sm mb-6">
            {status ? `No orders with status "${status}"` : "You haven't placed any orders yet"}
          </p>
          <Link href="/products" className="btn-primary text-sm">Start Shopping</Link>
        </div>

      /* ── Order list ────────────────────────────────────────────────────── */
      ) : (
        <>
          <div className="divide-y divide-gray-50">
            {data?.items.map(order => (
              <Link
                key={order.id}
                href={`/account/orders/${order.order_number}`}
                className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 sm:px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                {/* Order number + items */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-sm text-gray-900">{order.order_number}</p>
                    {/* Mobile status badge */}
                    <span className={`sm:hidden badge ${getStatusColor(order.status)}`}>
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}</p>
                </div>

                {/* Status — desktop */}
                <div className="hidden sm:flex w-28 justify-center">
                  <span className={`badge ${getStatusColor(order.status)}`}>
                    {order.status.replace("_", " ")}
                  </span>
                </div>

                {/* Date — desktop */}
                <p className="hidden sm:block w-28 text-center text-xs text-gray-500">
                  {formatDate(order.created_at)}
                </p>

                {/* Total + chevron */}
                <div className="flex items-center gap-2 justify-end">
                  <p className="font-black text-gray-900 text-sm">{formatPrice(order.total_amount)}</p>
                  <ChevronRight size={15} className="text-gray-300 shrink-0" />
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data && data.total_pages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} /> Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: data.total_pages }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === data.total_pages)
                  .reduce<(number | "…")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…"
                      ? <span key={`e${i}`} className="text-gray-400 text-xs px-1">…</span>
                      : <button key={p} onClick={() => setPage(p as number)}
                          className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${page === p ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                          {p}
                        </button>
                  )}
              </div>
              <button
                onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
