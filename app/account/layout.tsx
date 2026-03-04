"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  User, Lock, ShoppingBag, Heart, MapPin,
  Headphones, RotateCcw, Shield, LogOut,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import TopBar    from "@/components/home/TopBar";
import Navbar    from "@/components/layout/Navbar";
import Footer    from "@/components/layout/Footer";
import ScrollToTop  from "@/components/ui/ScrollToTop";
import ThemeProvider from "@/components/providers/ThemeProvider";

const NAV = [
  { href: "/account",           label: "Profile",   icon: User,       exact: true },
  { href: "/account/security",  label: "Security",  icon: Lock },
  { href: "/account/orders",    label: "Orders",    icon: ShoppingBag },
  { href: "/account/wishlist",  label: "Wishlist",  icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/support",   label: "Support",   icon: Headphones },
  { href: "/account/returns",   label: "Returns",   icon: RotateCcw },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const pathname = usePathname();
  const router   = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push("/auth/login?next=/account");
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) return null;

  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <TopBar />
        <Navbar />

        <main className="flex-1">
          {/* Account header */}
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

              {/* User info row */}
              <div className="flex items-center justify-between py-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xl font-black shadow-md shrink-0 overflow-hidden">
                    {user.profile_image
                      ? <img src={user.profile_image} alt={user.full_name} className="w-14 h-14 object-cover" />
                      : getInitials(user.full_name)}
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-gray-900 leading-tight">{user.full_name}</h1>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.is_email_verified ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                          <Shield size={9} /> Verified
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-orange-500 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                          ⚠ Unverified
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full capitalize">
                        {user.role?.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { logout(); router.push("/"); }}
                  className="hidden sm:flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-semibold border border-red-100 hover:border-red-300 px-3 py-2 rounded-xl transition-all"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>

              {/* Tab navigation — no toggle here, it lives in the navbar */}
              <nav className="flex gap-0.5 -mb-px overflow-x-auto no-scrollbar">
                {NAV.map(({ href, label, icon: Icon, exact }) => {
                  const active = exact ? pathname === href : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                        active
                          ? "border-brand-600 text-brand-600"
                          : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                      }`}
                    >
                      <Icon size={14} />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Page content */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>

        <Footer />
        <ScrollToTop />
      </div>
    </ThemeProvider>
  );
}
