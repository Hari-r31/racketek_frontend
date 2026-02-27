"use client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Heart, MapPin, User, LogOut, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { formatDate, formatPrice, getStatusColor } from "@/lib/utils";
import { PaginatedOrders } from "@/types";

export default function AccountDashboard() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const { data: ordersData } = useQuery<PaginatedOrders>({
    queryKey: ["orders", 1],
    queryFn: () => api.get("/orders?per_page=5").then((r) => r.data),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    router.push("/auth/login");
    return null;
  }

  const recentOrders = ordersData?.items?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="card p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xl font-black">
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-black text-gray-900 text-lg">{user?.full_name}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            {user?.phone && <p className="text-gray-400 text-xs">{user.phone}</p>}
          </div>
        </div>
        <button
          onClick={() => { logout(); router.push("/"); }}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Orders", value: ordersData?.total || 0, icon: Package, color: "bg-blue-50 text-blue-600" },
          { label: "Wishlist Items", value: "—", icon: Heart, color: "bg-red-50 text-red-600" },
          { label: "Saved Addresses", value: "—", icon: MapPin, color: "bg-green-50 text-green-600" },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 text-center">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <stat.icon size={18} />
            </div>
            <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="font-black text-gray-900">Recent Orders</h3>
          <Link href="/account/orders" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
            View all <ChevronRight size={12} />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <Package size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No orders yet</p>
            <Link href="/products" className="btn-primary text-sm mt-4 inline-block">Start Shopping</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.order_number}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-sm text-gray-800">{order.order_number}</p>
                  <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${getStatusColor(order.status)}`}>{order.status}</span>
                  <span className="font-bold text-sm">{formatPrice(order.total_amount)}</span>
                  <ChevronRight size={14} className="text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
