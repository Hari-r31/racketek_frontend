"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import ScrollToTop from "@/components/ui/ScrollToTop";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ThemeProvider from "@/components/providers/ThemeProvider";
import { useThemeStore } from "@/store/uiStore";
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag,
  BarChart2, Warehouse, LogOut, Store, Layout, Settings,
  FolderTree, HeadphonesIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const NAV = [
  { href: "/admin",             label: "Dashboard",  icon: LayoutDashboard, exact: true },
  { href: "/admin/homepage",    label: "Homepage",   icon: Layout },
  { href: "/admin/products",    label: "Products",   icon: Package },
  { href: "/admin/orders",      label: "Orders",     icon: ShoppingBag },
  { href: "/admin/users",       label: "Users",      icon: Users },
  { href: "/admin/coupons",     label: "Coupons",    icon: Tag },
  { href: "/admin/analytics",   label: "Analytics",  icon: BarChart2 },
  { href: "/admin/inventory",   label: "Inventory",  icon: Warehouse },
  { href: "/admin/categories",  label: "Categories", icon: FolderTree },
  { href: "/admin/support",     label: "Support",    icon: HeadphonesIcon },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark    = theme === "dark";

  useEffect(() => {
    if (!isAuthenticated || !["admin", "super_admin", "staff"].includes(user?.role || "")) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, user, router]);

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <ThemeProvider>
      <div
        className="flex min-h-screen"
        style={{ backgroundColor: isDark ? "rgb(20 20 31)" : "rgb(249 250 251)" }}
      >
        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside
          className="w-56 flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto transition-colors duration-300"
          style={{
            backgroundColor: isDark ? "#0f0f1a" : "#111827",
            borderRight: isDark ? "1px solid #1e1e35" : "none",
          }}
        >
          {/* Logo */}
          <div className="px-4 py-5 border-b border-gray-800">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
                <Settings size={14} className="text-white" />
              </div>
              <div>
                <span className="text-sm font-black text-white block leading-tight">RacketOutlet</span>
                <span className="text-[10px] text-brand-400 font-semibold">Admin Panel</span>
              </div>
            </Link>
          </div>

          {/* Nav links */}
          <nav className="flex-1 py-3 px-2 space-y-0.5">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon size={15} className="shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-3 border-t border-gray-800 space-y-1">
            {/* Theme toggle row — synced with navbar across entire app */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-800/60 border border-gray-700/50">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-semibold tracking-wide">
                  {isDark ? "🌙 Dark" : "☀️ Light"}
                </span>
              </div>
              <ThemeToggle />
            </div>

            <Link
              href="/"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <Store size={14} /> View Store
            </Link>
            <button
              onClick={() => { logout(); router.push("/"); }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors w-full text-left"
            >
              <LogOut size={14} /> Logout
            </button>
            <div className="px-3 py-2">
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              <p className="text-[10px] text-brand-500 font-semibold capitalize mt-0.5">
                {user?.role?.replace("_", " ")}
              </p>
            </div>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <main
          className="flex-1 overflow-auto transition-colors duration-300"
          style={{ backgroundColor: isDark ? "rgb(20 20 31)" : "rgb(249 250 251)" }}
        >
          <div className="p-6">{children}</div>
        </main>

        <ScrollToTop />
      </div>
    </ThemeProvider>
  );
}
