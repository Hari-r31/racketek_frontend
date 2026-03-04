"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Truck, Search, Package, MapPin, Phone } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface OrderTracking {
  order_number: string;
  status: string;
  created_at: string;
  estimated_delivery: string;
  items: { product_name: string; quantity: number }[];
  shipping_address: {
    full_name: string;
    address_line1: string;
    city: string;
    state: string;
    pincode: string;
  };
}

const STATUS_STEPS = ["pending","processing","shipped","out_for_delivery","delivered"];
const STATUS_LABELS: Record<string, string> = {
  pending:           "Order Placed",
  processing:        "Processing",
  shipped:           "Shipped",
  out_for_delivery:  "Out for Delivery",
  delivered:         "Delivered",
  cancelled:         "Cancelled",
  refunded:          "Refunded",
};

export default function TrackOrderPage() {
  const { isAuthenticated } = useAuthStore();
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = orderNumber.trim().toUpperCase();
    if (!q) return;
    setLoading(true);
    setOrder(null);
    setNotFound(false);
    try {
      const { data } = await api.get(`/orders/${q}`);
      setOrder(data);
    } catch {
      setNotFound(true);
      toast.error("Order not found. Please check your order number.");
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <ChevronRight size={11} />
            <span className="text-gray-800 font-medium">Track Order</span>
          </nav>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Truck size={26} className="text-brand-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-500 text-sm">Enter your order number to see real-time delivery status.</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleTrack} className="mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                placeholder="e.g. RKT-20250101-ABCD"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !orderNumber.trim()}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl transition-colors text-sm flex items-center gap-2 shrink-0"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Truck size={15} />}
              Track
            </button>
          </div>
        </form>

        {/* Login prompt */}
        {!isAuthenticated && (
          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-6 text-center text-sm text-brand-700">
            <p className="font-semibold mb-1">Have an account?</p>
            <p className="text-brand-600 text-xs mb-3">Login to automatically see all your orders and their status.</p>
            <Link href="/auth/login" className="inline-flex items-center gap-1.5 bg-brand-600 text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-brand-700 transition-colors">
              Login to My Account
            </Link>
          </div>
        )}

        {/* Not found */}
        {notFound && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-2xl mb-2">🔍</p>
            <p className="font-black text-gray-900 mb-1">Order Not Found</p>
            <p className="text-sm text-gray-500 mb-4">We couldn't find an order with that number. Please double-check and try again.</p>
            <Link href="/account/support" className="text-sm text-brand-600 font-semibold hover:underline">
              Contact Support
            </Link>
          </div>
        )}

        {/* Order result */}
        {order && (
          <div className="space-y-5">
            {/* Status header */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Order Number</p>
                  <p className="font-black text-gray-900 text-lg">{order.order_number}</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide ${
                  order.status === "delivered" ? "bg-green-100 text-green-700" :
                  order.status === "cancelled" ? "bg-red-100 text-red-700" :
                  order.status === "shipped" || order.status === "out_for_delivery" ? "bg-blue-100 text-blue-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>

              {/* Progress bar */}
              {!["cancelled","refunded"].includes(order.status) && (
                <div className="mt-2">
                  <div className="flex justify-between mb-3">
                    {STATUS_STEPS.map((s, i) => (
                      <div key={s} className="flex flex-col items-center gap-1" style={{ width: `${100 / STATUS_STEPS.length}%` }}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                          i <= stepIndex
                            ? "bg-brand-600 border-brand-600 text-white"
                            : "bg-white border-gray-200 text-gray-400"
                        }`}>
                          {i < stepIndex ? "✓" : i + 1}
                        </div>
                        <span className={`text-[9px] font-bold text-center leading-tight ${i <= stepIndex ? "text-brand-600" : "text-gray-400"}`}>
                          {STATUS_LABELS[s]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="relative h-1.5 bg-gray-200 rounded-full mx-3.5 -mt-1">
                    <div
                      className="absolute h-full bg-brand-600 rounded-full transition-all duration-500"
                      style={{ width: stepIndex >= 0 ? `${(stepIndex / (STATUS_STEPS.length - 1)) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="border border-gray-200 rounded-2xl p-5">
              <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2"><Package size={15} className="text-brand-600" /> Items in this Order</h3>
              <ul className="space-y-2">
                {order.items.map((item, i) => (
                  <li key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700">{item.product_name}</span>
                    <span className="text-gray-400 font-medium">× {item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Address */}
            {order.shipping_address && (
              <div className="border border-gray-200 rounded-2xl p-5">
                <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2"><MapPin size={15} className="text-brand-600" /> Delivery Address</h3>
                <p className="text-sm text-gray-700 font-semibold">{order.shipping_address.full_name}</p>
                <p className="text-sm text-gray-500">{order.shipping_address.address_line1}</p>
                <p className="text-sm text-gray-500">{order.shipping_address.city}, {order.shipping_address.state} – {order.shipping_address.pincode}</p>
              </div>
            )}

            {/* Need help */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-center">
              <p className="text-sm text-gray-600 mb-3">Having an issue with this order?</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href="/account/orders" className="text-sm font-bold text-brand-600 hover:underline">View in My Orders</Link>
                <span className="text-gray-300">·</span>
                <Link href="/account/support" className="text-sm font-bold text-gray-600 hover:text-brand-600 flex items-center gap-1"><Phone size={12} /> Contact Support</Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick links */}
        {!order && !notFound && (
          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-4">You can also view all orders from your account dashboard.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/account/orders" className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                <Package size={14} /> My Orders
              </Link>
              <Link href="/account/support" className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                <Phone size={14} /> Support
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
