"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag,
  BarChart2, Warehouse, LogOut, Store, ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !["admin", "super_admin"].includes(user?.role || "")) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-gray-300 flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-800">
          <Link href="/admin" className="block">
            <span className="text-xl font-black text-white">RACKETEK</span>
            <span className="text-brand-400 text-xs ml-1 block">Admin Panel</span>
          </Link>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-800 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <Store size={16} /> View Store
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors w-full"
          >
            <LogOut size={16} /> Logout
          </button>
          <div className="px-3 py-2">
            <p className="text-xs text-gray-600 truncate">{user?.email}</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
