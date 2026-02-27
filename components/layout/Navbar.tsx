"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart, Search, Menu, X, Heart, User,
  ChevronDown, Package, LogOut, Settings, Zap, ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUIStore, useCartStore } from "@/store/uiStore";
import { motion, AnimatePresence } from "framer-motion";
import { getInitials } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Category } from "@/types";

const SPORT_EMOJI: Record<string, string> = {
  badminton:"🏸", cricket:"🏏", running:"🏃", football:"⚽",
  tennis:"🎾", fitness:"🏋️", sportswear:"👕",
};

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { count } = useCartStore();
  const [search, setSearch] = useState("");
  const [userMenu, setUserMenu] = useState(false);
  const [megaOpen, setMegaOpen] = useState<string | null>(null);
  const megaRef = useRef<HTMLDivElement>(null);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["root-categories"],
    queryFn: () => api.get("/categories").then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });

  // Close mega menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?search=${encodeURIComponent(search)}`);
      setSearch("");
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
    setUserMenu(false);
  };

  const activeCategory = categories?.find(c => c.slug === megaOpen);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      {/* Promo bar */}
      <div className="bg-brand-600 text-white text-xs text-center py-1.5 px-4">
        🏆 Free shipping on orders above ₹999 &nbsp;|&nbsp; Use code <strong>SPORT10</strong> for 10% off
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-black text-brand-600 tracking-tight leading-none block">RACKETEK</span>
              <span className="text-[9px] text-gray-400 font-semibold tracking-widest leading-none hidden sm:block">OUTLET</span>
            </div>
          </Link>

          {/* Desktop sport nav with mega menu */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center" ref={megaRef}>
            {(categories || []).map((cat) => (
              <div key={cat.slug} className="relative">
                <button
                  onMouseEnter={() => setMegaOpen(cat.slug)}
                  onClick={() => setMegaOpen(megaOpen === cat.slug ? null : cat.slug)}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    megaOpen === cat.slug
                      ? "bg-brand-50 text-brand-700"
                      : "text-gray-700 hover:text-brand-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{SPORT_EMOJI[cat.slug] || "🏅"}</span>
                  {cat.name}
                  <ChevronDown size={12} className={`transition-transform ${megaOpen === cat.slug ? "rotate-180" : ""}`} />
                </button>
              </div>
            ))}

            {/* Mega dropdown panel */}
            <AnimatePresence>
              {megaOpen && activeCategory && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  onMouseLeave={() => setMegaOpen(null)}
                  className="absolute top-full left-0 right-0 mt-0 bg-white shadow-xl border-t-2 border-brand-600 z-50"
                  style={{ position: "fixed", top: "auto", marginTop: 0, left: 0, right: 0 }}
                >
                  <div className="max-w-7xl mx-auto px-8 py-6">
                    <div className="flex gap-8">
                      {/* Sport overview */}
                      <Link
                        href={`/products?category=${activeCategory.slug}`}
                        onClick={() => setMegaOpen(null)}
                        className="w-44 shrink-0 bg-gradient-to-br from-brand-600 to-brand-800 text-white rounded-xl p-5 flex flex-col justify-between hover:brightness-110 transition-all"
                      >
                        <span className="text-4xl">{SPORT_EMOJI[activeCategory.slug] || "🏅"}</span>
                        <div className="mt-3">
                          <p className="font-black text-lg leading-tight">{activeCategory.name}</p>
                          <p className="text-xs text-white/70 mt-1">View all products</p>
                          <div className="flex items-center gap-1 mt-3 text-xs font-semibold">
                            Shop Now <ChevronRight size={10} />
                          </div>
                        </div>
                      </Link>

                      {/* Sub-categories grid */}
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Browse by type</p>
                        <div className="grid grid-cols-3 gap-2">
                          {(activeCategory.children || []).map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/products?category=${sub.slug}`}
                              onClick={() => setMegaOpen(null)}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-gray-700 font-medium hover:bg-brand-50 hover:text-brand-700 transition-colors group"
                            >
                              <span className="w-1.5 h-1.5 bg-brand-400 rounded-full group-hover:bg-brand-600 transition-colors" />
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </nav>

          {/* Search + icons */}
          <div className="flex items-center gap-2">
            {/* Search bar */}
            <form onSubmit={handleSearch} className="hidden sm:flex items-center">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-40 lg:w-52 border border-gray-200 bg-gray-50 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white pr-9 transition-all"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600">
                  <Search size={14} />
                </button>
              </div>
            </form>

            {/* Wishlist */}
            {isAuthenticated && (
              <Link href="/account/wishlist" className="text-gray-500 hover:text-brand-600 transition-colors p-1.5">
                <Heart size={19} />
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart" className="relative text-gray-500 hover:text-brand-600 transition-colors p-1.5">
              <ShoppingCart size={19} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="flex items-center gap-1.5 text-gray-700 hover:text-brand-600 transition-colors ml-1"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                    {getInitials(user?.full_name || "U")}
                  </div>
                  <ChevronDown size={13} className={`transition-transform text-gray-400 ${userMenu ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {userMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900 truncate">{user?.full_name}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {user?.role}
                        </span>
                      </div>
                      <Link href="/account" onClick={() => setUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <User size={14} className="text-gray-400" /> My Account
                      </Link>
                      <Link href="/account/orders" onClick={() => setUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Package size={14} className="text-gray-400" /> My Orders
                      </Link>
                      {(user?.role === "admin" || user?.role === "super_admin" || user?.role === "staff") && (
                        <Link href="/admin" onClick={() => setUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-600 font-semibold hover:bg-brand-50 transition-colors">
                          <Settings size={14} /> Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-gray-100 mt-1" />
                      <button onClick={handleLogout}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full">
                        <LogOut size={14} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link href="/auth/login" className="text-sm font-semibold text-gray-700 hover:text-brand-600 transition-colors hidden sm:block">
                  Login
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm py-2 px-4 rounded-lg">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button className="lg:hidden text-gray-600 p-1.5 ml-1" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-gray-200 bg-white overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1 max-h-[75vh] overflow-y-auto">
              {/* Mobile search */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products..." className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 pr-9" />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={15} /></button>
                </div>
              </form>

              {/* Sport categories mobile */}
              {(categories || []).map((cat) => (
                <div key={cat.slug}>
                  <Link href={`/products?category=${cat.slug}`} onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-2.5 px-3 text-sm font-bold text-gray-800 hover:text-brand-600 rounded-lg hover:bg-gray-50">
                    <span>{SPORT_EMOJI[cat.slug] || "🏅"}</span> {cat.name}
                  </Link>
                  {(cat.children || []).length > 0 && (
                    <div className="ml-8 space-y-0.5 mb-1">
                      {(cat.children || []).slice(0, 4).map((sub) => (
                        <Link key={sub.id} href={`/products?category=${sub.slug}`} onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 py-1.5 text-xs text-gray-500 hover:text-brand-600">
                          <span className="w-1 h-1 bg-gray-300 rounded-full" /> {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {!isAuthenticated && (
                <div className="flex gap-2 pt-3 border-t border-gray-100 mt-3">
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center border border-brand-600 text-brand-600 font-semibold py-2.5 rounded-xl text-sm">
                    Login
                  </Link>
                  <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center bg-brand-600 text-white font-semibold py-2.5 rounded-xl text-sm">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
