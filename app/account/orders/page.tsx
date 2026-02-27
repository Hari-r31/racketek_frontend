"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Package, ChevronRight, ChevronLeft } from "lucide-react";
import api from "@/lib/api";
import { PaginatedOrders, OrderStatus } from "@/types";
import { formatDate, formatPrice, getStatusColor } from "@/lib/utils";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery<PaginatedOrders>({
    queryKey: ["orders", page, status],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), per_page: "10" });
      if (status) params.set("status", status);
      return api.get(`/orders?${params.toString()}`).then((r) => r.data);
    },
  });

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-100">
        <h2 className="font-black text-gray-900 text-xl mb-4">My Orders</h2>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                status === f.value
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="divide-y">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 animate-pulse flex justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-40" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
              <div className="h-5 bg-gray-200 rounded w-20" />
            </div>
          ))}
        </div>
      ) : data?.items?.length === 0 ? (
        <div className="p-12 text-center">
          <Package size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="font-bold text-gray-700 mb-2">No orders found</h3>
          <p className="text-gray-400 text-sm mb-6">
            {status ? "No orders with this status" : "You haven't placed any orders yet"}
          </p>
          <Link href="/products" className="btn-primary text-sm">Start Shopping</Link>
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-50">
            {data?.items.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.order_number}`}
                className="flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-gray-900">{order.order_number}</p>
                    <span className={`badge ${getStatusColor(order.status)}`}>
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(order.created_at)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {order.items?.length || 0} item(s)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-black text-gray-900">{formatPrice(order.total_amount)}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 shrink-0" />
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data && data.total_pages > 1 && (
            <div className="flex items-center justify-center gap-4 p-4 border-t border-gray-100">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span className="text-sm text-gray-600">
                {page} / {data.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
