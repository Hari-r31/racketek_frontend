"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Category } from "@/types";

const SPORT_META: Record<string, {
  emoji: string;
  gradient: string;
  accent: string;
  badge?: string;
}> = {
  badminton:  { emoji: "🏸", gradient: "from-orange-500 to-amber-600",    accent: "bg-orange-500",  badge: "Top Sport" },
  cricket:    { emoji: "🏏", gradient: "from-emerald-500 to-green-700",   accent: "bg-emerald-500", badge: "Most Popular" },
  running:    { emoji: "🏃", gradient: "from-blue-500 to-indigo-700",     accent: "bg-blue-500" },
  football:   { emoji: "⚽", gradient: "from-purple-500 to-violet-700",   accent: "bg-purple-500" },
  tennis:     { emoji: "🎾", gradient: "from-yellow-400 to-orange-500",   accent: "bg-yellow-400",  badge: "Trending" },
  fitness:    { emoji: "🏋️", gradient: "from-red-500 to-rose-700",        accent: "bg-red-500" },
  sportswear: { emoji: "👕", gradient: "from-pink-500 to-fuchsia-600",    accent: "bg-pink-500" },
  pickleball: { emoji: "🥒", gradient: "from-lime-500 to-green-600",      accent: "bg-lime-500",    badge: "New" },
  cycling:    { emoji: "🚴", gradient: "from-cyan-500 to-sky-700",        accent: "bg-cyan-500" },
  swimming:   { emoji: "🏊", gradient: "from-teal-500 to-cyan-700",       accent: "bg-teal-500" },
};

const FALLBACK = [
  { id: 1, slug: "badminton",  name: "Badminton",   is_active: true, children: [], parent_id: null },
  { id: 2, slug: "cricket",    name: "Cricket",     is_active: true, children: [], parent_id: null },
  { id: 3, slug: "running",    name: "Running",     is_active: true, children: [], parent_id: null },
  { id: 4, slug: "football",   name: "Football",    is_active: true, children: [], parent_id: null },
  { id: 5, slug: "tennis",     name: "Tennis",      is_active: true, children: [], parent_id: null },
  { id: 6, slug: "fitness",    name: "Fitness",     is_active: true, children: [], parent_id: null },
  { id: 7, slug: "sportswear", name: "Sportswear",  is_active: true, children: [], parent_id: null },
];

interface Props {
  categories: Category[];
}

export default function CategoryIcons({ categories }: Props) {
  const items = (categories?.length ? categories : FALLBACK).slice(0, 8);
  const featured = items.slice(0, 2);   // Large cards
  const rest     = items.slice(2);      // Smaller grid

  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-black text-brand-600 uppercase tracking-widest mb-1">Explore</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              Shop by Sport
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-brand-600 transition-colors"
          >
            All Categories <ArrowRight size={14} />
          </Link>
        </div>

        {/* Top 2 featured — large horizontal cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {featured.map((cat, i) => {
            const meta = SPORT_META[cat.slug] || { emoji: "🏅", gradient: "from-gray-600 to-gray-800", accent: "bg-gray-600" };
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={`/products?category=${cat.slug}`}
                  className={`relative flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${meta.gradient} p-8 group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 min-h-[140px]`}
                >
                  {/* Decorative circle */}
                  <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
                  <div className="absolute -right-2 -bottom-10 w-32 h-32 rounded-full bg-black/10" />

                  <div className="relative z-10">
                    {meta.badge && (
                      <span className="inline-block bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
                        {meta.badge}
                      </span>
                    )}
                    <h3 className="text-2xl font-black text-white">{cat.name}</h3>
                    <p className="text-white/70 text-sm mt-1">
                      {(cat.children || []).length > 0 ? `${(cat.children || []).length} categories` : "Shop now"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-4 text-white text-xs font-bold group-hover:gap-3 transition-all">
                      Shop {cat.name} <ArrowRight size={13} />
                    </div>
                  </div>

                  <span className="relative z-10 text-7xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {meta.emoji}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Rest — smaller grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {rest.map((cat, i) => {
            const meta = SPORT_META[cat.slug] || { emoji: "🏅", gradient: "from-gray-600 to-gray-800", accent: "bg-gray-600" };
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.07 }}
              >
                <Link
                  href={`/products?category=${cat.slug}`}
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${meta.gradient} flex flex-col items-center justify-center gap-2 py-6 px-3 group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-center`}
                >
                  <span className="text-4xl group-hover:scale-110 transition-transform duration-200">
                    {meta.emoji}
                  </span>
                  <span className="text-xs font-black text-white leading-tight">{cat.name}</span>
                  {meta.badge && (
                    <span className="absolute top-2 right-2 text-[9px] font-black bg-white/20 text-white px-1.5 py-0.5 rounded-full">
                      {meta.badge}
                    </span>
                  )}
                </Link>
              </motion.div>
            );
          })}

          {/* View All tile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <Link
              href="/products"
              className="overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 hover:border-brand-400 flex flex-col items-center justify-center gap-2 py-6 px-3 group hover:bg-brand-50 transition-all duration-200 text-center min-h-full"
            >
              <ArrowRight size={24} className="text-gray-300 group-hover:text-brand-600 transition-colors" />
              <span className="text-xs font-black text-gray-400 group-hover:text-brand-600 transition-colors leading-tight">
                View All
              </span>
            </Link>
          </motion.div>
        </div>

        {/* Mobile: View all link */}
        <div className="sm:hidden mt-4 text-center">
          <Link href="/products" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600">
            View All Categories <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
