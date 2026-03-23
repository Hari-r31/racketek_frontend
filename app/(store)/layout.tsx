"use client";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

import Navbar          from "@/components/layout/Navbar";
import Footer          from "@/components/layout/Footer";
import AnnouncementBar      from "@/components/home/AnnouncementBar";
import WhatsAppButton       from "@/components/home/WhatsAppButton";
import ScrollToTop          from "@/components/ui/ScrollToTop";
import WishlistInitializer  from "@/components/providers/WishlistInitializer";
import CartInitializer      from "@/components/providers/CartInitializer";
import ThemeProvider        from "@/components/providers/ThemeProvider";
import Link            from "next/link";
import { ShieldOff }   from "lucide-react";

function BlockedWall() {
  const { logout } = useAuthStore();
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldOff size={36} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-3">Account Suspended</h1>
          <p className="text-gray-500 leading-relaxed mb-6">
            Your account has been suspended. You cannot browse or shop on Racketek Outlet at this time.
            <br /><br />
            If you believe this is a mistake, please contact our support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="mailto:support@racketek.com"
              className="inline-flex items-center justify-center gap-2 bg-brand-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-700 transition-colors"
            >
              Contact Support
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 font-bold px-6 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[rgb(var(--surface-2))] transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  const { data: homepage } = useQuery({
    queryKey: ["homepage"],
    queryFn: () => api.get("/homepage").then(r => r.data.sections),
    staleTime: 1000 * 60 * 5,
  });

  // Periodically re-validate blocked status when logged in
  const { data: profile } = useQuery({
    queryKey: ["profile-status"],
    queryFn: () => api.get("/users/profile").then(r => r.data),
    enabled: isAuthenticated,
    staleTime: 60_000,
    refetchInterval: 2 * 60 * 1000, // re-check every 2 min
    retry: false,
  });

  // Show blocked wall if:
  // - user is logged in AND
  // - the latest profile fetch confirms is_active = false
  const isBlocked = isAuthenticated && profile && profile.is_active === false;

  if (isBlocked) return <BlockedWall />;

  const s = homepage || {};

  return (
    <ThemeProvider>
      <WishlistInitializer />
      <CartInitializer />
      <div className="flex flex-col min-h-screen">
        <AnnouncementBar data={s.announcement_bar} />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppButton />
        <ScrollToTop />
      </div>
    </ThemeProvider>
  );
}
