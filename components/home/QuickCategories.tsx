"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Category } from "@/types";

interface QuickCategory {
  id: number;
  label: string;
  subtitle?: string;
  image_url: string;
  link: string;
  color_accent?: string;
}

interface QuickCategoriesData {
  heading?: string;
  categories?: QuickCategory[];
}

interface Props {
  data?: QuickCategoriesData;
  categories?: Category[];   // fallback from DB
}

// InstaSport-style gradient mapping
const GRADIENTS: Record<string, string> = {
  running:    "from-blue-500 to-indigo-700",
  badminton:  "from-orange-500 to-amber-600",
  cricket:    "from-emerald-500 to-green-700",
  tennis:     "from-yellow-400 to-orange-500",
  pickleball: "from-lime-500 to-green-600",
  fitness:    "from-red-500 to-rose-700",
  cycling:    "from-cyan-500 to-sky-700",
  swimming:   "from-teal-500 to-cyan-700",
  football:   "from-purple-500 to-violet-700",
};
const EMOJIS: Record<string, string> = {
  running: "🏃", badminton: "🏸", cricket: "🏏", tennis: "🎾",
  pickleball: "🏓", fitness: "🏋️", cycling: "🚴", swimming: "🏊", football: "⚽",
};

export default function QuickCategories({ data, categories = [] }: Props) {
  const heading = data?.heading || "Shop by Sport";

  // Build display items: admin-configured first, fallback to DB categories
  const items: QuickCategory[] = data?.categories?.length
    ? data.categories
    : categories.slice(0, 5).map((c, i) => ({
        id: c.id,
        label: c.name,
        subtitle: `${c.name} gear & accessories`,
        image_url: "",
        link: `/products?category=${c.slug}`,
        color_accent: "",
      }));

  if (!items.length) return null;

  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-black text-brand-600 uppercase tracking-widest mb-1">Explore</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">{heading}</h2>
          </div>
          <Link href="/products"
            className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-brand-600 transition-colors">
            All Sports <ArrowRight size={14} />
          </Link>
        </div>

        {/* Cards grid — first 2 large, rest smaller (InstaSport pattern) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {items.slice(0, 2).map((cat, i) => {
            const slug    = cat.link.split("=")[1] || "";
            const gradient = GRADIENTS[slug] || "from-gray-600 to-gray-800";
            const emoji   = EMOJIS[slug] || "🏅";
            return (
              <motion.div key={cat.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Link href={cat.link}
                  className={`relative flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-8 group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 min-h-[150px]`}>
                  <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
                  <div className="absolute -right-2 -bottom-10 w-32 h-32 rounded-full bg-black/10" />
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black text-white mb-1">{cat.label}</h3>
                    {cat.subtitle && <p className="text-white/70 text-sm mb-4">{cat.subtitle}</p>}
                    <div className="flex items-center gap-1.5 text-white text-xs font-bold group-hover:gap-3 transition-all">
                      Shop Now <ArrowRight size={13} />
                    </div>
                  </div>
                  {cat.image_url
                    ? <Image src={cat.image_url} alt={cat.label} width={140} height={140} className="relative z-10 object-contain group-hover:scale-110 transition-transform duration-300 rounded-xl" />
                    : <span className="relative z-10 text-7xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{emoji}</span>}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Smaller cards for remaining */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {items.slice(2).map((cat, i) => {
            const slug     = cat.link.split("=")[1] || "";
            const gradient = GRADIENTS[slug] || "from-gray-600 to-gray-800";
            const emoji    = EMOJIS[slug] || "🏅";
            return (
              <motion.div key={cat.id}
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: 0.1 + i * 0.07 }}>
                <Link href={cat.link}
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-2 py-6 px-3 group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-center`}>
                  {cat.image_url
                    ? <Image src={cat.image_url} alt={cat.label} width={64} height={64} className="object-contain group-hover:scale-110 transition-transform rounded-lg" />
                    : <span className="text-4xl group-hover:scale-110 transition-transform duration-200">{emoji}</span>}
                  <span className="text-xs font-black text-white leading-tight">{cat.label}</span>
                </Link>
              </motion.div>
            );
          })}

          {/* View all */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.5 }}>
            <Link href="/products"
              className="overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 hover:border-brand-400 flex flex-col items-center justify-center gap-2 py-6 px-3 group hover:bg-brand-50 transition-all duration-200 text-center min-h-full">
              <ArrowRight size={24} className="text-gray-300 group-hover:text-brand-600 transition-colors" />
              <span className="text-xs font-black text-gray-400 group-hover:text-brand-600 transition-colors">View All</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
