"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight, Star, ShieldCheck, Truck, RotateCcw,
  Headphones, ChevronRight, Zap, Trophy, Users, Package,
} from "lucide-react";
import { Product, Category } from "@/types";
import { formatPrice } from "@/lib/utils";
import ProductCard from "@/components/products/ProductCard";

// Sport emoji map for dynamic categories
const SPORT_META: Record<string, { emoji: string; color: string; accent: string; bg: string }> = {
  badminton:  { emoji: "🏸", color: "from-orange-500 to-amber-600",   accent: "#f97316", bg: "bg-orange-50" },
  cricket:    { emoji: "🏏", color: "from-green-500 to-emerald-600",  accent: "#22c55e", bg: "bg-green-50"  },
  running:    { emoji: "🏃", color: "from-blue-500 to-cyan-600",      accent: "#3b82f6", bg: "bg-blue-50"   },
  football:   { emoji: "⚽", color: "from-purple-500 to-violet-600",  accent: "#a855f7", bg: "bg-purple-50" },
  tennis:     { emoji: "🎾", color: "from-yellow-500 to-orange-500",  accent: "#eab308", bg: "bg-yellow-50" },
  fitness:    { emoji: "🏋️", color: "from-red-500 to-rose-600",       accent: "#ef4444", bg: "bg-red-50"    },
  sportswear: { emoji: "👕", color: "from-pink-500 to-fuchsia-600",   accent: "#ec4899", bg: "bg-pink-50"   },
};

const DEFAULT_META = { emoji: "🏆", color: "from-gray-500 to-gray-600", accent: "#6b7280", bg: "bg-gray-50" };

const FEATURES = [
  { icon: Truck,      title: "Free Shipping",   desc: "Orders above ₹999"        },
  { icon: RotateCcw,  title: "7-Day Returns",   desc: "Hassle-free returns"       },
  { icon: ShieldCheck,title: "100% Genuine",    desc: "Certified products"        },
  { icon: Headphones, title: "24/7 Support",    desc: "Always here to help"       },
];

const STATS = [
  { icon: Users,   value: "10K+", label: "Happy Athletes"  },
  { icon: Package, value: "500+", label: "Products"        },
  { icon: Trophy,  value: "4.8★", label: "Avg Rating"      },
  { icon: Zap,     value: "50+",  label: "Brands"          },
];

const TESTIMONIALS = [
  { name: "Arjun Sharma",  role: "State Badminton Player",  rating: 5, text: "Best rackets I've ever used. The quality is exceptional and delivery was super fast!", sport: "🏸" },
  { name: "Priya Nair",    role: "Cricket Academy Coach",   rating: 5, text: "Stocked our academy with Racketek gear. Excellent quality at competitive prices.",    sport: "🏏" },
  { name: "Rahul Verma",   role: "Marathon Runner",         rating: 5, text: "Their running shoes are amazing. Perfect support and comfort for long runs.",          sport: "🏃" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

export default function HomePage() {
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["root-categories"],
    queryFn: () => api.get("/categories").then((r) => r.data),
  });

  const { data: featured } = useQuery<Product[]>({
    queryKey: ["featured-products"],
    queryFn: () => api.get("/products/featured?limit=8").then((r) => r.data),
  });

  const { data: bestSellers } = useQuery<Product[]>({
    queryKey: ["best-sellers"],
    queryFn: () => api.get("/products/best-sellers?limit=8").then((r) => r.data),
  });

  return (
    <div className="overflow-x-hidden">

      {/* ═══ HERO ════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center bg-[#0a0e1a] overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_20%_50%,rgba(22,101,255,0.15),transparent_60%)]" />
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_80%_20%,rgba(249,115,22,0.12),transparent_60%)]" />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)",
            backgroundSize: "60px 60px"
          }} />
        </div>

        {/* Floating sport icons */}
        {["🏸","🏏","🏃","⚽","🎾","🏋️"].map((e, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl select-none pointer-events-none"
            style={{ left: `${10 + i * 15}%`, top: `${15 + (i % 3) * 25}%` }}
            animate={{ y: [0, -18, 0], rotate: [0, i % 2 === 0 ? 8 : -8, 0] }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          >
            <span className="opacity-10">{e}</span>
          </motion.div>
        ))}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="max-w-3xl">
            <motion.div {...fadeUp(0)}>
              <span className="inline-flex items-center gap-2 bg-brand-600/20 border border-brand-500/30 text-brand-400 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
                <Zap size={12} className="fill-brand-400" /> Premium Sports Equipment
              </span>
            </motion.div>

            <motion.h1 {...fadeUp(0.1)}
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 tracking-tight">
              Play Hard.<br />
              <span className="bg-gradient-to-r from-brand-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                Win Bigger.
              </span>
            </motion.h1>

            <motion.p {...fadeUp(0.2)}
              className="text-lg sm:text-xl text-gray-400 mb-8 max-w-xl leading-relaxed">
              Professional-grade badminton, cricket, running gear and more.
              Trusted by <span className="text-white font-semibold">10,000+ athletes</span> across India.
            </motion.p>

            <motion.div {...fadeUp(0.3)} className="flex flex-wrap gap-4 mb-14">
              <Link href="/products"
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold px-7 py-3.5 rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-brand-500/30 text-base">
                Shop Now <ArrowRight size={18} />
              </Link>
              <Link href="/products?is_featured=true"
                className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white font-semibold px-7 py-3.5 rounded-xl transition-all text-base">
                View Featured
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div {...fadeUp(0.4)} className="flex flex-wrap gap-8">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ═══ FEATURES BAR ═══════════════════════════════════════════════════ */}
      <section className="bg-brand-600 text-white py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
                  <f.icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold">{f.title}</p>
                  <p className="text-xs opacity-75">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SPORT CATEGORIES ════════════════════════════════════════════════ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <span className="text-brand-600 text-sm font-bold uppercase tracking-widest">Explore</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2">Shop by Sport</h2>
            <p className="text-gray-500 mt-2">Find everything for your game</p>
          </motion.div>

          {/* Parent sport cards with sub-categories */}
          <div className="space-y-6">
            {(categories || FALLBACK_CATS).map((cat, i) => {
              const meta = SPORT_META[cat.slug] || DEFAULT_META;
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Parent sport */}
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className={`relative bg-gradient-to-br ${meta.color} text-white p-6 sm:w-52 shrink-0 flex flex-col justify-between hover:brightness-110 transition-all group`}
                    >
                      <div>
                        <span className="text-5xl block mb-3">{meta.emoji}</span>
                        <h3 className="text-xl font-black leading-tight">{cat.name}</h3>
                        <p className="text-xs text-white/70 mt-1 line-clamp-2">{cat.description}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold mt-4 group-hover:gap-2 transition-all">
                        Shop All <ArrowRight size={12} />
                      </div>
                      {/* Decorative circle */}
                      <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full" />
                      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full" />
                    </Link>

                    {/* Sub-categories */}
                    <div className="flex-1 p-5">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Browse by type
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(cat.children && cat.children.length > 0
                          ? cat.children
                          : (FALLBACK_CATS.find(f => f.slug === cat.slug)?.children || [])
                        ).map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/products?category=${sub.slug}`}
                            className={`inline-flex items-center gap-1.5 ${meta.bg} text-gray-800 text-sm font-medium px-4 py-2 rounded-xl hover:scale-105 transition-transform border border-transparent hover:border-gray-200`}
                            style={{ '--accent': meta.accent } as any}
                          >
                            {sub.name}
                            <ChevronRight size={12} className="text-gray-400" />
                          </Link>
                        ))}
                        <Link
                          href={`/products?category=${cat.slug}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 px-3 py-2"
                        >
                          View all <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ FEATURED PRODUCTS ══════════════════════════════════════════════ */}
      {featured && featured.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-brand-600 text-sm font-bold uppercase tracking-widest">Curated</span>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-1">Featured Products</h2>
                <p className="text-gray-500 mt-2">Handpicked by our sports experts</p>
              </div>
              <Link href="/products?is_featured=true"
                className="hidden sm:flex items-center gap-2 text-brand-600 hover:text-brand-700 font-semibold text-sm">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ═══ PROMO BANNERS ══════════════════════════════════════════════════ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { emoji: "🏸", sport: "Badminton",  slug: "badminton", color: "from-orange-600 to-amber-600",   sub: "Up to 40% off on rackets",   badge: "HOT DEAL"   },
              { emoji: "🏏", sport: "Cricket",    slug: "cricket",   color: "from-green-600 to-emerald-700",  sub: "New season bats & gear",      badge: "NEW IN"     },
              { emoji: "🏃", sport: "Running",    slug: "running",   color: "from-blue-600 to-cyan-700",      sub: "Premium running shoes",       badge: "TOP PICKS"  },
            ].map((b) => (
              <Link key={b.slug} href={`/products?category=${b.slug}`}
                className={`relative bg-gradient-to-br ${b.color} rounded-2xl p-7 text-white overflow-hidden group hover:scale-[1.02] transition-transform`}>
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full" />
                <div className="absolute -right-2 -bottom-8 w-24 h-24 bg-white/5 rounded-full" />
                <span className="text-xs font-black bg-white/20 px-2.5 py-1 rounded-full tracking-widest">
                  {b.badge}
                </span>
                <div className="text-5xl my-4">{b.emoji}</div>
                <h3 className="text-xl font-black">{b.sport} Sale</h3>
                <p className="text-sm text-white/75 mt-1 mb-4">{b.sub}</p>
                <span className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
                  Shop Now <ArrowRight size={13} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BEST SELLERS ════════════════════════════════════════════════════ */}
      {bestSellers && bestSellers.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-orange-500 text-sm font-bold uppercase tracking-widest">🔥 Trending</span>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-1">Best Sellers</h2>
                <p className="text-gray-500 mt-2">What athletes are buying right now</p>
              </div>
              <Link href="/products?sort=best_selling"
                className="hidden sm:flex items-center gap-2 text-brand-600 hover:text-brand-700 font-semibold text-sm">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ═══ BRAND TRUST ════════════════════════════════════════════════════ */}
      <section className="py-14 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-400 uppercase tracking-widest font-semibold mb-8">Trusted brands we carry</p>
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10">
            {["Yonex","Li-Ning","Victor","SG","Kookaburra","Nike","Adidas","Puma","Asics","Decathlon"].map((brand) => (
              <Link key={brand} href={`/products?brand=${brand}`}
                className="text-lg font-black text-gray-300 hover:text-brand-600 transition-colors tracking-tight">
                {brand}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-600 text-sm font-bold uppercase tracking-widest">Reviews</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2">What Athletes Say</h2>
            <p className="text-gray-500 mt-2">Trusted by professionals across India</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-50 rounded-2xl p-7 border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} size={14} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <span className="text-2xl">{t.sport}</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA BANNER ═════════════════════════════════════════════════════ */}
      <section className="bg-[#0a0e1a] py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(22,101,255,0.15),transparent_70%)]" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <span className="text-5xl block mb-4">🏆</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Ready to Level Up Your Game?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Join 10,000+ athletes who trust Racketek for their sports gear
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/products"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-brand-500/30">
              Browse All Products <ArrowRight size={18} />
            </Link>
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold px-8 py-3.5 rounded-xl transition-all">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// Fallback categories if API not loaded yet
const FALLBACK_CATS: (Category & { children: Category[] })[] = [
  { id: 1, name: "Badminton", slug: "badminton", is_active: true, description: "Rackets, shuttles & gear",
    children: [
      { id: 11, name: "Badminton Rackets", slug: "badminton-rackets", is_active: true },
      { id: 12, name: "Shuttlecocks",      slug: "shuttlecocks",      is_active: true },
      { id: 13, name: "Badminton Shoes",   slug: "badminton-shoes",   is_active: true },
      { id: 14, name: "Strings & Grips",   slug: "badminton-strings", is_active: true },
      { id: 15, name: "Badminton Bags",    slug: "badminton-bags",    is_active: true },
    ]
  },
  { id: 2, name: "Cricket", slug: "cricket", is_active: true, description: "Bats, balls & protective gear",
    children: [
      { id: 21, name: "Cricket Bats",    slug: "cricket-bats",       is_active: true },
      { id: 22, name: "Cricket Balls",   slug: "cricket-balls",      is_active: true },
      { id: 23, name: "Batting Gloves",  slug: "batting-gloves",     is_active: true },
      { id: 24, name: "Batting Pads",    slug: "batting-pads",       is_active: true },
      { id: 25, name: "Cricket Helmets", slug: "cricket-helmets",    is_active: true },
    ]
  },
  { id: 3, name: "Running", slug: "running", is_active: true, description: "Shoes, apparel & accessories",
    children: [
      { id: 31, name: "Running Shoes",     slug: "running-shoes",     is_active: true },
      { id: 32, name: "Running Apparel",   slug: "running-apparel",   is_active: true },
      { id: 33, name: "GPS Watches",       slug: "gps-watches",       is_active: true },
    ]
  },
];
