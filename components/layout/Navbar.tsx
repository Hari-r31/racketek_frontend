"use client";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  ShoppingCart, Search, Menu, X, Heart, User,
  ChevronDown, Package, LogOut, Settings, ChevronRight,
  MoreHorizontal, Home, Tag, Layers,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUIStore, useCartStore, useThemeStore } from "@/store/uiStore";
import { motion, AnimatePresence } from "framer-motion";
import { getInitials } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Category } from "@/types";
import Image from "next/image";
import ThemeToggle from "@/components/ui/ThemeToggle";

const SPORT_EMOJI: Record<string, string> = {
  badminton: "🏸", cricket: "🏏", running: "🏃", football: "⚽",
  tennis: "🎾", fitness: "🏋️", cycling: "🚴", swimming: "🏊",
  basketball: "🏀", "table-tennis": "🏓", volleyball: "🏐",
  hockey: "🏑", boxing: "🥊", squash: "🎯", sportswear: "👕",
};

const MAX_VIS = 7;

let _setNavLoading: ((v: boolean) => void) | null = null;
export function triggerNavLoad() { _setNavLoading?.(true); }

interface Suggestion {
  type: "product" | "brand" | "category";
  label: string;
  slug: string | null;
  brand: string | null;
}

const SUGGESTION_ICONS = { product: Search, brand: Tag, category: Layers } as const;

/* ─────────────────────────────── SEARCH BOX ────────────────────────────── */
function SearchBox({
  value, onChange, onSubmit, onSelectSuggestion, placeholder = "Search products…", className = "",
}: {
  value: string; onChange: (v: string) => void; onSubmit: (e: React.FormEvent) => void;
  onSelectSuggestion: (s: Suggestion) => void; placeholder?: string; className?: string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSugg, setShowSugg]       = useState(false);
  const [focused, setFocused]         = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || value.trim().length < 2) { setSuggestions([]); setShowSugg(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/products/suggestions?q=${encodeURIComponent(value.trim())}&limit=8`
        );
        if (res.ok) { const data: Suggestion[] = await res.json(); setSuggestions(data); setShowSugg(data.length > 0 && focused); }
      } catch { /* silent */ }
    }, 220);
  }, [value, focused]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowSugg(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <form onSubmit={(e) => { setShowSugg(false); onSubmit(e); }}>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" value={value} onChange={e => onChange(e.target.value)}
            onFocus={() => { setFocused(true); if (suggestions.length > 0) setShowSugg(true); }}
            onBlur={() => setFocused(false)}
            onKeyDown={e => { if (e.key === "Escape") setShowSugg(false); }}
            placeholder={placeholder} autoComplete="off"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all" />
          {value && (
            <button type="button" onClick={() => { onChange(""); setSuggestions([]); setShowSugg(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
      </form>
      <AnimatePresence>
        {showSugg && suggestions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[500] max-h-72 overflow-y-auto">
            {(["product", "brand", "category"] as const).map(type => {
              const group = suggestions.filter(s => s.type === type);
              if (!group.length) return null;
              const Icon = SUGGESTION_ICONS[type];
              const label = type === "product" ? "Products" : type === "brand" ? "Brands" : "Categories";
              return (
                <div key={type}>
                  <p className="px-4 pt-2.5 pb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                  {group.map((s, i) => (
                    <button key={i} type="button"
                      onMouseDown={e => { e.preventDefault(); setShowSugg(false); onSelectSuggestion(s); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors text-left">
                      <Icon size={13} className="text-gray-400 shrink-0" />
                      <span className="flex-1 truncate">
                        {s.label.split(new RegExp(`(${value.trim()})`, "gi")).map((part, pi) =>
                          part.toLowerCase() === value.trim().toLowerCase()
                            ? <mark key={pi} className="bg-brand-100 text-brand-700 font-bold rounded px-0.5">{part}</mark>
                            : <span key={pi}>{part}</span>
                        )}
                      </span>
                      {s.type === "brand" && <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">Brand</span>}
                      {s.type === "category" && <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">Category</span>}
                    </button>
                  ))}
                </div>
              );
            })}
            <div className="border-t border-gray-50 px-4 py-2.5">
              <button type="button"
                onMouseDown={e => { e.preventDefault(); setShowSugg(false); onSubmit(new Event("submit") as any); }}
                className="flex items-center gap-2 text-xs font-bold text-brand-600 hover:text-brand-700">
                <Search size={11} /> Search for &ldquo;{value}&rdquo;
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────── MEGA MENU (desktop) ───────────────────────────── */
const MegaMenu = memo(function MegaMenu({ category, onClose }: { category: Category; onClose: () => void }) {
  return (
    <div className="w-full py-6 px-6 xl:px-10">
      <div className="flex gap-8 max-w-screen-2xl mx-auto">
        <Link href={`/products?category=${category.slug}`} onClick={onClose}
          className="w-44 shrink-0 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl p-5 text-white flex flex-col justify-between hover:brightness-110 transition-all group">
          <span className="text-5xl leading-none">{SPORT_EMOJI[category.slug] ?? "🏅"}</span>
          <div className="mt-4">
            <p className="font-black text-xl leading-tight">{category.name}</p>
            <p className="text-xs text-white/70 mt-1">Browse all</p>
            <div className="flex items-center gap-1 mt-3 text-xs font-bold group-hover:gap-2 transition-all">Shop All <ChevronRight size={11} /></div>
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Browse by category</p>
          {!(category.children?.length) ? <p className="text-sm text-gray-400">No sub-categories yet.</p> : (
            <div className="grid grid-cols-3 lg:grid-cols-5 gap-1">
              {category.children.map(sub => (
                <Link key={sub.id} href={`/products?category=${sub.slug}`} onClick={onClose}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-700 font-medium hover:bg-brand-50 hover:text-brand-700 transition-colors group/sub">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-300 group-hover/sub:bg-brand-600 shrink-0 transition-colors" />
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
          <Link href={`/products?category=${category.slug}`} onClick={onClose}
            className="inline-flex items-center gap-1.5 mt-5 text-xs font-bold text-brand-600 hover:text-brand-700">
            View all {category.name} →
          </Link>
        </div>
      </div>
    </div>
  );
});

/* ──────────────── OTHERS DROPDOWN ──────────────────────────────────────── */
const OthersDropdown = memo(function OthersDropdown({ cats, onNavigate }: { cats: Category[]; onNavigate: () => void }) {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEnter = (slug: string) => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setHoveredSlug(slug); };
  const onLeave = () => { hoverTimer.current = setTimeout(() => setHoveredSlug(null), 100); };
  const hoveredCat = cats.find(c => c.slug === hoveredSlug);

  return (
    <div className="flex">
      <div className="w-52 py-1.5">
        {cats.map(cat => (
          <div key={cat.slug} className="relative" onMouseEnter={() => onEnter(cat.slug)} onMouseLeave={onLeave}>
            <div className={["flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors",
              hoveredSlug === cat.slug ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-brand-50 hover:text-brand-700"].join(" ")}>
              <span className="text-base shrink-0">{SPORT_EMOJI[cat.slug] ?? "🏅"}</span>
              <Link href={`/products?category=${cat.slug}`} onClick={onNavigate} className="flex-1 font-medium">{cat.name}</Link>
              {(cat.children?.length ?? 0) > 0 && <ChevronRight size={13} className="text-gray-400 shrink-0" />}
            </div>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {hoveredCat && (hoveredCat.children?.length ?? 0) > 0 && (
          <motion.div key={hoveredCat.slug} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.1 }} onMouseEnter={() => onEnter(hoveredCat.slug)} onMouseLeave={onLeave}
            className="w-52 border-l border-gray-100 py-1.5 bg-gray-50/80">
            <p className="px-4 pb-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">{hoveredCat.name}</p>
            {hoveredCat.children!.map(sub => (
              <Link key={sub.id} href={`/products?category=${sub.slug}`} onClick={onNavigate}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-300 shrink-0" />{sub.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════════════════
   MOBILE DRAWER
══════════════════════════════════════════════════════════════════════════ */
function MobileDrawer({
  open, onClose, categories, user, isAuthenticated,
  count, search, setSearch, onSearch, onSelectSuggestion, onLogout, onNav,
}: {
  open: boolean; onClose: () => void; categories: Category[]; user: any;
  isAuthenticated: boolean; count: number; search: string;
  setSearch: (v: string) => void; onSearch: (e: React.FormEvent) => void;
  onSelectSuggestion: (s: Suggestion) => void; onLogout: () => void; onNav: () => void;
}) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const { theme } = useThemeStore();

  useEffect(() => { if (!open) setExpandedCat(null); }, [open]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }} className="fixed inset-0 z-[400] bg-black/40 backdrop-blur-[2px] lg:hidden" onClick={onClose} />

          <motion.div key="drawer" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed inset-y-0 left-0 z-[500] w-[82vw] max-w-[340px] bg-white flex flex-col shadow-2xl lg:hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <Image src="/logo.jpg" alt="RacketOutlet" width={30} height={30} className="w-[30px] h-[30px] rounded-lg object-cover" />
                <div className="flex flex-col leading-none">
                  <span className="text-[13px] font-black tracking-tight">
                    <span className="text-brand-600">Racket</span><span className="text-gray-900">Outlet</span>
                  </span>
                  <span className="text-[8px] text-gray-400 font-bold tracking-[0.18em] uppercase mt-0.5">Sports Store</span>
                </div>
              </div>
              {/* ── Theme toggle always visible in drawer header ── */}
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 pt-3 pb-2 shrink-0">
              <SearchBox value={search} onChange={setSearch} onSubmit={onSearch} onSelectSuggestion={onSelectSuggestion} placeholder="Search products…" />
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="px-3 pb-1">
                <Link href="/" onClick={onNav} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                  <Home size={16} className="text-gray-400" /> Home
                </Link>
              </div>

              <p className="px-6 pt-1 pb-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Shop by Sport</p>

              <div className="px-3 space-y-0.5">
                {categories.map(cat => {
                  const hasSubs = (cat.children?.length ?? 0) > 0;
                  const isOpen  = expandedCat === cat.slug;
                  return (
                    <div key={cat.slug}>
                      <div className="flex items-center gap-1">
                        <Link href={`/products?category=${cat.slug}`} onClick={onNav}
                          className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-800 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                          <span className="text-lg w-6 text-center">{SPORT_EMOJI[cat.slug] ?? "🏅"}</span>{cat.name}
                        </Link>
                        {hasSubs && (
                          <button onClick={() => setExpandedCat(isOpen ? null : cat.slug)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors shrink-0">
                            <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
                              <ChevronDown size={15} />
                            </motion.div>
                          </button>
                        )}
                      </div>
                      <AnimatePresence initial={false}>
                        {hasSubs && isOpen && (
                          <motion.div key="subs" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18, ease: "easeInOut" }} className="overflow-hidden">
                            <div className="ml-9 mr-3 mb-1 grid grid-cols-2 gap-0.5 pt-0.5">
                              {cat.children!.map(sub => (
                                <Link key={sub.id} href={`/products?category=${sub.slug}`} onClick={onNav}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                                  <span className="w-1 h-1 rounded-full bg-brand-300 shrink-0" />{sub.name}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Account section */}
              <div className="mt-3 mx-3 mb-4 rounded-2xl border border-gray-100 overflow-hidden">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-3 bg-gradient-to-br from-brand-50 to-white flex items-center gap-3">
                      {user?.profile_image ? (
                        <img src={user.profile_image} alt={user.full_name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-brand-100 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0">
                          {getInitials(user?.full_name ?? "U")}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate">{user?.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-600 bg-white border border-brand-100 px-1.5 py-0.5 rounded-full">
                          {user?.role?.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {[
                        { href: "/account",        label: "My Account", icon: User,         badge: null },
                        { href: "/account/orders", label: "My Orders",  icon: Package,      badge: null },
                        { href: "/wishlist",       label: "Wishlist",   icon: Heart,        badge: null },
                        { href: "/cart",           label: "My Cart",    icon: ShoppingCart, badge: count > 0 ? count : null },
                      ].map(({ href, label, icon: Icon, badge }) => (
                        <Link key={href} href={href} onClick={onNav}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:text-brand-600 hover:bg-gray-50 transition-colors">
                          <Icon size={15} className="text-gray-400 shrink-0" />
                          <span className="flex-1">{label}</span>
                          {badge !== null && (
                            <span className="min-w-[20px] h-5 bg-brand-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1.5">
                              {(badge as number) > 99 ? "99+" : badge}
                            </span>
                          )}
                        </Link>
                      ))}
                      {["admin", "super_admin", "staff"].includes(user?.role ?? "") && (
                        <Link href="/admin" onClick={onNav} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors">
                          <Settings size={15} className="shrink-0" /> Admin Panel
                        </Link>
                      )}
                    </div>
                    <button onClick={onLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100">
                      <LogOut size={15} className="shrink-0" /> Sign Out
                    </button>
                  </>
                ) : (
                  <div className="px-4 py-4 space-y-2.5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Account</p>
                    <Link href="/auth/login" onClick={onNav}
                      className="flex items-center justify-center gap-2 w-full border-2 border-brand-600 text-brand-600 font-bold py-2.5 rounded-xl text-sm hover:bg-brand-50 transition-colors">
                      <User size={15} /> Login
                    </Link>
                    <Link href="/auth/register" onClick={onNav}
                      className="flex items-center justify-center gap-2 w-full bg-brand-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-brand-700 transition-colors shadow-sm">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════════════════════════════════ */
export default function Navbar() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { count } = useCartStore();

  const [search,       setSearch]       = useState(() => searchParams?.get("search") ?? "");
  const [userMenu,     setUserMenu]     = useState(false);
  const [megaOpen,     setMegaOpen]     = useState<string | null>(null);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [navLoading,   setNavLoading]   = useState(false);

  useEffect(() => { const q = searchParams?.get("search") ?? ""; setSearch(q); }, [searchParams]);
  useEffect(() => { _setNavLoading = setNavLoading; return () => { _setNavLoading = null; }; }, []);

  const closeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["root-categories"],
    queryFn: () => api.get("/categories").then(r => r.data),
    staleTime: 600_000,
  });

  const isHomePage = pathname === "/";

  useEffect(() => {
    setMegaOpen(null); setUserMenu(false); setMobileMenuOpen(false); setOverflowOpen(false); setNavLoading(false);
  }, [pathname, setMobileMenuOpen]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const openMega  = useCallback((slug: string) => { if (closeTimer.current) clearTimeout(closeTimer.current); setMegaOpen(slug); setOverflowOpen(false); }, []);
  const closeMega = useCallback(() => { closeTimer.current = setTimeout(() => setMegaOpen(null), 150); }, []);
  const keepMega  = useCallback(() => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); const q = search.trim(); if (!q) return;
    setNavLoading(true); router.push(`/products?search=${encodeURIComponent(q)}`); setMobileMenuOpen(false);
  };

  const handleSelectSuggestion = (s: Suggestion) => {
    setNavLoading(true);
    if (s.type === "product" && s.slug) { setSearch(s.label); router.push(`/products/${s.slug}`); }
    else if (s.type === "brand") { setSearch(s.label); router.push(`/products?brand=${encodeURIComponent(s.label)}`); }
    else if (s.type === "category" && s.slug) { setSearch(s.label); router.push(`/products?category=${s.slug}`); }
    else { setSearch(s.label); router.push(`/products?search=${encodeURIComponent(s.label)}`); }
    setMobileMenuOpen(false);
  };

  const handleLogout = () => { logout(); router.push("/"); setUserMenu(false); setMobileMenuOpen(false); };
  const handleDrawerNav = () => { setMobileMenuOpen(false); setNavLoading(true); };

  const visibleCats  = categories.slice(0, MAX_VIS);
  const overflowCats = categories.slice(MAX_VIS);
  const activeCat    = categories.find(c => c.slug === megaOpen);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        {navLoading && (
          <div className="absolute inset-x-0 top-0 h-[3px] z-[9999] pointer-events-none overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-brand-500 via-emerald-400 to-brand-500"
              style={{ backgroundSize: "200% 100%", animation: "navbar-progress 1.2s linear infinite" }} />
          </div>
        )}

        {/* ── DESKTOP ROW ──────────────────────────────────────────────── */}
        <div className="hidden lg:flex items-center h-[60px] px-3 lg:px-5 gap-2">

          {/* Logo */}
          <Link href="/" onClick={() => setNavLoading(true)} className="flex items-center gap-2 shrink-0">
            <Image src="/logo.jpg" alt="RacketOutlet" width={34} height={34} className="w-[34px] h-[34px] rounded-lg object-cover" priority />
            <div className="flex flex-col leading-none">
              <span className="text-[14px] font-black tracking-tight">
                <span className="text-brand-600">Racket</span><span className="text-gray-900">Outlet</span>
              </span>
              <span className="text-[8px] text-gray-400 font-bold tracking-[0.2em] uppercase mt-0.5">Sports Store</span>
            </div>
          </Link>

          {/* Category nav + search */}
          <div className="flex items-center flex-1 min-w-0 gap-0">
            <nav className="flex items-center shrink-0">
              {visibleCats.map(cat => (
                <button key={cat.slug} onMouseEnter={() => openMega(cat.slug)} onMouseLeave={closeMega}
                  onClick={() => megaOpen === cat.slug ? setMegaOpen(null) : openMega(cat.slug)}
                  className={["flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-all shrink-0",
                    megaOpen === cat.slug ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:text-brand-600 hover:bg-gray-50"].join(" ")}>
                  <span className="text-base leading-none">{SPORT_EMOJI[cat.slug] ?? "🏅"}</span>
                  <span className="hidden xl:inline">{cat.name}</span>
                  <ChevronDown size={10} className={`transition-transform ${megaOpen === cat.slug ? "rotate-180" : ""}`} />
                </button>
              ))}
              {overflowCats.length > 0 && (
                <div
                  className="relative shrink-0"
                  onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); setOverflowOpen(true); setMegaOpen(null); }}
                  onMouseLeave={() => { closeTimer.current = setTimeout(() => setOverflowOpen(false), 150); }}
                >
                  <button
                    className={["flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all",
                      overflowOpen ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50"].join(" ")}>
                    <MoreHorizontal size={15} />
                    <span className="hidden xl:inline text-[13px]">Others</span>
                    <ChevronDown size={10} className={`transition-transform ${overflowOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {overflowOpen && (
                      <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.12 }}
                        className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[200]">
                        <OthersDropdown cats={overflowCats} onNavigate={() => { setOverflowOpen(false); setNavLoading(true); }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </nav>
            <SearchBox value={search} onChange={setSearch} onSubmit={handleSearch} onSelectSuggestion={handleSelectSuggestion}
              placeholder="Search products…" className="flex-1 min-w-[100px] max-w-[480px] px-2" />
          </div>

          {/* ── Right icons — ALWAYS: ThemeToggle → Wishlist (auth only) → Cart → User ── */}
          <div className="flex items-center gap-1 shrink-0">

            {/* ★ Theme toggle — always visible, no auth required ★ */}
            <div className="flex items-center mr-1">
              <ThemeToggle />
            </div>

            {/* Wishlist — authenticated only */}
            {isAuthenticated && (
              <Link href="/wishlist" onClick={() => setNavLoading(true)}
                className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-gray-50 rounded-lg transition-colors">
                <Heart size={18} />
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart" onClick={() => setNavLoading(true)}
              className="relative w-9 h-9 flex items-center justify-center text-gray-500 hover:text-brand-600 hover:bg-gray-50 rounded-lg transition-colors">
              <ShoppingCart size={18} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-brand-600 text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 shadow-sm">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>

            {/* User avatar / login buttons */}
            {isAuthenticated ? (
              <div className="relative ml-0.5" ref={userMenuRef}>
                <button onClick={() => setUserMenu(v => !v)} className="flex items-center gap-1 p-1 rounded-xl hover:bg-gray-50 transition-colors">
                  {user?.profile_image
                    ? <img src={user.profile_image} alt={user.full_name} className="w-8 h-8 rounded-lg object-cover ring-2 ring-brand-100" />
                    : <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center text-white text-xs font-black">{getInitials(user?.full_name ?? "U")}</div>
                  }
                  <ChevronDown size={11} className={`text-gray-400 transition-transform ${userMenu ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {userMenu && (
                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[300]">
                      {/* User info */}
                      <div className="px-4 py-3 bg-gradient-to-br from-brand-50 to-white border-b border-gray-100 flex items-center gap-3">
                        {user?.profile_image
                          ? <img src={user.profile_image} alt={user.full_name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-brand-100 shrink-0" />
                          : <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0">{getInitials(user?.full_name ?? "U")}</div>
                        }
                        <div className="min-w-0">
                          <p className="text-sm font-black text-gray-900 truncate">{user?.full_name}</p>
                          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                          <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-brand-600 bg-white border border-brand-100 px-1.5 py-0.5 rounded-full">
                            {user?.role?.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                      {/* Nav links */}
                      <div className="py-1">
                        {[
                          { href: "/account",        label: "My Account", icon: User },
                          { href: "/account/orders", label: "My Orders",  icon: Package },
                          { href: "/wishlist",       label: "Wishlist",   icon: Heart },
                        ].map(({ href, label, icon: Icon }) => (
                          <Link key={href} href={href} onClick={() => { setUserMenu(false); setNavLoading(true); }}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <Icon size={14} className="text-gray-400 shrink-0" /> {label}
                          </Link>
                        ))}
                        {["admin", "super_admin", "staff"].includes(user?.role ?? "") && (
                          <Link href="/admin" onClick={() => { setUserMenu(false); setNavLoading(true); }}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-600 font-semibold hover:bg-brand-50 transition-colors">
                            <Settings size={14} className="shrink-0" /> Admin Panel
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-gray-100">
                        <button onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          <LogOut size={14} className="shrink-0" /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 ml-1">
                <Link href="/auth/login" onClick={() => setNavLoading(true)}
                  className="text-sm font-semibold text-gray-700 hover:text-brand-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">Login</Link>
                <Link href="/auth/register" onClick={() => setNavLoading(true)}
                  className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm">Sign Up</Link>
              </div>
            )}
          </div>
        </div>

        {/* ── MOBILE ROW ───────────────────────────────────────────────── */}
        <div className="flex lg:hidden items-center h-[56px] px-3 gap-2">
          <button onClick={() => setMobileMenuOpen(true)}
            className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-xl transition-colors shrink-0">
            <Menu size={21} />
          </button>

          <SearchBox value={search} onChange={setSearch} onSubmit={handleSearch}
            onSelectSuggestion={handleSelectSuggestion} placeholder="Search products…" className="flex-1 min-w-0" />

          {isHomePage ? (
            isAuthenticated ? (
              <Link href="/account" onClick={() => setNavLoading(true)}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl overflow-hidden ring-2 ring-brand-100">
                {user?.profile_image
                  ? <img src={user.profile_image} alt={user.full_name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-black">{getInitials(user?.full_name ?? "U")}</div>
                }
              </Link>
            ) : (
              <Link href="/auth/login" onClick={() => setNavLoading(true)}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors">
                <User size={17} />
              </Link>
            )
          ) : (
            <Link href="/cart" onClick={() => setNavLoading(true)}
              className="relative shrink-0 w-9 h-9 flex items-center justify-center text-gray-600 hover:text-brand-600 hover:bg-gray-100 rounded-xl transition-colors">
              <ShoppingCart size={20} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-brand-600 text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 shadow-sm">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          )}
        </div>

        {/* Mega menu */}
        <AnimatePresence>
          {megaOpen && activeCat && (
            <motion.div key={megaOpen} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.14, ease: "easeOut" }} onMouseEnter={keepMega} onMouseLeave={closeMega}
              className="absolute inset-x-0 top-full bg-white border-t-2 border-brand-500 shadow-2xl z-[150] hidden lg:block">
              <MegaMenu category={activeCat} onClose={() => { setMegaOpen(null); setNavLoading(true); }} />
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`
          @keyframes navbar-progress {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </header>

      <MobileDrawer
        open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}
        categories={categories} user={user} isAuthenticated={isAuthenticated}
        count={count} search={search} setSearch={setSearch}
        onSearch={handleSearch} onSelectSuggestion={handleSelectSuggestion}
        onLogout={handleLogout} onNav={handleDrawerNav}
      />
    </>
  );
}
