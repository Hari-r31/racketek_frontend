"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Package, Truck, MapPin, ChevronLeft, XCircle, ExternalLink } from "lucide-react";
import api from "@/lib/api";
import { Order } from "@/types";
import { formatDate, formatPrice, getStatusColor } from "@/lib/utils";
import toast from "react-hot-toast";

const ORDER_STEPS = [
  { key: "pending",          label: "Order Placed"       },
  { key: "paid",             label: "Payment Confirmed"  },
  { key: "processing",       label: "Processing"         },
  { key: "shipped",          label: "Shipped"            },
  { key: "out_for_delivery", label: "Out for Delivery"   },
  { key: "delivered",        label: "Delivered"          },
];

const STEP_KEYS = ORDER_STEPS.map((s) => s.key);

export default function OrderDetailPage() {
  const { order_number } = useParams<{ order_number: string }>();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["order", order_number],
    queryFn: () => api.get(`/orders/${order_number}`).then((r) => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) =>
      api.post(`/orders/${order_number}/cancel`, { reason }),
    onSuccess: () => {
      toast.success("Order cancelled");
      qc.invalidateQueries({ queryKey: ["order", order_number] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Cannot cancel"),
  });

  if (isLoading) {
    return (
      <div className="card p-8 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-32 bg-gray-200 rounded" />
      </div>
    );
  }
  if (!order) return <div className="card p-8 text-center text-gray-500">Order not found</div>;

  const currentStep = STEP_KEYS.indexOf(order.status);
  const isCancellable = ["pending", "paid"].includes(order.status);
  const isCancelledOrReturned = ["cancelled", "returned", "refunded"].includes(order.status);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/account/orders" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft size={20} />
          </Link>
          <h2 className="font-black text-gray-900 text-lg">{order.order_number}</h2>
          <span className={`badge ${getStatusColor(order.status)}`}>
            {order.status.replace(/_/g, " ")}
          </span>
        </div>
        <p className="text-gray-500 text-sm ml-8">Placed on {formatDate(order.created_at)}</p>
        {order.estimated_delivery && (
          <p className="text-sm text-gray-500 ml-8 flex items-center gap-1 mt-1">
            <Truck size={14} className="text-brand-500" />
            Estimated delivery:{" "}
            <span className="font-medium text-gray-800">{formatDate(order.estimated_delivery)}</span>
          </p>
        )}
      </div>

      {/* BUG 4 FIX — AWB Tracking Info Panel */}
      {(order.awb_number || order.tracking_url) && (
        <div className="card p-5 border-brand-200 border bg-brand-50/30">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Truck size={15} className="text-brand-600" />
            Shipment Tracking
          </h3>
          <div className="space-y-2 text-sm">
            {order.awb_number && (
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-32 shrink-0">AWB Number:</span>
                <span className="font-mono font-bold text-gray-900 bg-white border border-gray-200 px-2.5 py-1 rounded-lg">
                  {order.awb_number}
                </span>
              </div>
            )}
            {order.tracking_url && (
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-32 shrink-0">Track Package:</span>
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-semibold hover:underline"
                >
                  Track on Courier Site
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Tracker */}
      {!isCancelledOrReturned && (
        <div className="card p-5">
          <h3 className="font-bold text-gray-700 text-sm mb-5">Order Progress</h3>
          <div className="flex items-center">
            {ORDER_STEPS.map((step, idx) => (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      idx <= currentStep
                        ? "bg-brand-600 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {idx < currentStep ? "✓" : idx + 1}
                  </div>
                  <p className="text-xs text-center text-gray-500 mt-1 w-16 leading-tight">{step.label}</p>
                </div>
                {idx < ORDER_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 transition-colors ${
                      idx < currentStep ? "bg-brand-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-700">Order Items ({order.items?.length})</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-800">{item.product_name}</p>
                {item.variant_name && (
                  <p className="text-xs text-gray-400">{item.variant_name}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatPrice(item.total_price)}</p>
                <p className="text-xs text-gray-400">{formatPrice(item.unit_price)} each</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Summary + Cancel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Pricing */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-700 text-sm mb-4">Price Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>−{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>
                {order.shipping_cost === 0 ? (
                  <span className="text-green-600">FREE</span>
                ) : (
                  formatPrice(order.shipping_cost)
                )}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>GST (18%)</span>
              <span>{formatPrice(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between font-black text-base border-t border-gray-100 pt-2">
              <span>Total</span>
              <span className="text-brand-600">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="card p-5 space-y-3">
          <h3 className="font-bold text-gray-700 text-sm mb-4">Actions</h3>

          {isCancellable && (
            <button
              onClick={() => {
                const reason = prompt("Reason for cancellation (optional):");
                if (reason !== null) cancelMutation.mutate(reason || "Customer request");
              }}
              disabled={cancelMutation.isLoading}
              className="w-full flex items-center justify-center gap-2 border border-red-300 text-red-600 rounded-lg py-2.5 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <XCircle size={16} /> Cancel Order
            </button>
          )}

          {order.status === "delivered" && (
            <Link
              href={`/account/returns?order=${order.order_number}`}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Request Return
            </Link>
          )}

          <Link
            href="/account/support"
            className="w-full flex items-center justify-center gap-2 border border-brand-300 text-brand-600 rounded-lg py-2.5 text-sm font-medium hover:bg-brand-50 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
