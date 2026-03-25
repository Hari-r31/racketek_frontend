"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";

export interface HeroBanner {
  id: number;
  title: string;
  subtitle: string;
  image_url: string;
  mobile_image_url?: string;
  link: string;
  badge?: string;
  cta: string;
  cta_link?: string;
  gradient?: string;
  text_position?: "left" | "center" | "right";
}

interface HeroBannersData {
  banners?: HeroBanner[];
  auto_play?: boolean;
  interval?: number;
}

interface Props { data?: HeroBannersData; }

const FALLBACK: HeroBanner[] = [
  {
    id: 1, title: "Play Like a Champion",
    subtitle: "Premium badminton rackets for every skill level — Yonex, Victor, Li-Ning and more.",
    image_url: "", link: "/products?category=badminton",
    badge: "🏸 New Season", cta: "Shop Badminton", cta_link: "/products?category=badminton",
    gradient: "from-orange-950 via-gray-950 to-black", text_position: "left",
  },
  {
    id: 2, title: "Cricket Season is Here",
    subtitle: "Professional bats, balls & protective gear. 100% authentic, delivered fast.",
    image_url: "", link: "/products?category=cricket",
    badge: "🏏 Best Sellers", cta: "Shop Cricket", cta_link: "/products?category=cricket",
    gradient: "from-emerald-950 via-gray-950 to-black", text_position: "left",
  },
  {
    id: 3, title: "Dominate the Tennis Court",
    subtitle: "Pro racquets, shoes & accessories for every level.",
    image_url: "", link: "/products?category=tennis",
    badge: "🎾 Trending", cta: "Shop Tennis", cta_link: "/products?category=tennis",
    gradient: "from-blue-950 via-gray-950 to-black", text_position: "center",
  },
  {
    id: 4, title: "Pickleball — The New Game",
    subtitle: "Paddles, balls & everything you need to get started.",
    image_url: "", link: "/products?category=pickleball",
    badge: "🏓 New Sport", cta: "Discover Pickleball", cta_link: "/products?category=pickleball",
    gradient: "from-purple-950 via-gray-950 to-black", text_position: "center",
  },
];

const QUICK_LINKS = [
  { label: "🏏 Cricket",    href: "/products?category=cricket"    },
  { label: "🏸 Badminton",  href: "/products?category=badminton"  },
  { label: "⚽ Football",   href: "/products?category=football"   },
  { label: "🥊 Boxing",     href: "/products?category=boxing"     },
  { label: "🏓 Pickleball", href: "/products?category=pickleball" },
  { label: "🎾 Tennis",     href: "/products?category=tennis"     },
];

const alignClass: Record<string, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
};

export default function HeroBanners({ data }: Props) {
  const items    = data?.banners?.length ? data.banners : FALLBACK;
  const autoPlay = data?.auto_play !== false;
  const interval = data?.interval || 5000;
  const [current, setCurrent] = useState(0);
  const [dir, setDir]         = useState(1);

  const go = useCallback((idx: number) => {
    setDir(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current]);

  const prev = () => go((current - 1 + items.length) % items.length);
  const next = useCallback(() => go((current + 1) % items.length), [current, go, items.length]);

  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(next, interval);
    return () => clearInterval(t);
  }, [next, autoPlay, interval]);

  const variants = {
    enter:  (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  const banner  = items[current];
  const posClass = alignClass[banner.text_position || "left"];

  return (
    <div className="relative">
      {/* ── Main hero ─────────────────────────────────────────────────────── */}
      <div className="relative h-[76vh] min-h-[540px] overflow-hidden bg-black">
        <AnimatePresence initial={false} custom={dir}>
          <motion.div key={current} custom={dir} variants={variants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0"
          >
            {/* Gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${banner.gradient || "from-gray-950 to-black"}`} />

            {/* Hero image */}
            {banner.image_url && (
              <Image src={banner.image_url} alt={banner.title} fill
                className="object-cover opacity-45" priority />
            )}

            {/* Radial glow + grid texture */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_60%,rgba(249,115,22,0.08),transparent)]" />
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
              backgroundSize: "60px 60px",
            }} />

            {/* Content */}
            <div className="relative h-full flex items-center">
              <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.6 }}
                  className={`flex flex-col max-w-2xl ${posClass}`}
                >
                  {banner.badge && (
                    <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white text-xs font-black px-4 py-1.5 rounded-full mb-5 uppercase tracking-widest border border-white/20 self-start">
                      {banner.badge}
                    </span>
                  )}
                  <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-black text-white leading-[1.06] mb-5 tracking-tight">
                    {banner.title}
                  </h1>
                  <p className="text-base sm:text-lg text-gray-300/90 mb-8 max-w-xl leading-relaxed">
                    {banner.subtitle}
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    {/*
                      DARK MODE FIX — CTA button:
                      Light mode: bg-white text-black → white pill, black text ✅
                      Dark mode:  globals turn bg-white → surface-0 (near-black),
                                  but text-black stays black → black on black = invisible ❌

                      Fix: use bg-white explicitly on the element with !important-safe
                      inline approach, OR use [background-color] override via style prop
                      so globals.css cannot intercept it (globals target .bg-white class,
                      not inline styles).

                      We keep bg-white as the Tailwind class for light mode, and add
                      style override only for the dark-mode-affected color, using the
                      data-theme-inverted attribute as a semantic hook.

                      Cleanest approach: replace bg-white text-black with a brand-neutral
                      "light pill" that uses explicit dark: variants so neither the global
                      override nor text-black cause issues.
                    */}
                    <Link href={(() => {
                      const target = banner.cta_link || banner.link;
                      if (!target || target === '#') return '/products';
                      if (target.startsWith('/')) return target;
                      return `/${target}`;
                    })()}
                      className="inline-flex items-center gap-2 font-black px-7 py-3.5 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-xl text-sm uppercase tracking-wide
                        bg-white text-black
                        hover:bg-brand-500 hover:text-white
                        dark:bg-brand-500 dark:text-white
                        dark:hover:bg-brand-400 dark:hover:text-black"
                    >
                      {banner.cta} <ChevronRight size={15} />
                    </Link>
                    {/* "View All" secondary link — always on dark hero, no fix needed */}
                    <Link href="/products"
                      className="text-sm font-bold text-white/60 hover:text-white transition-colors">
                      View All →
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Nav arrows — bg-black/40 transparent overlays, always fine on hero */}
        <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 z-20 backdrop-blur-sm">
          <ChevronLeft size={18} />
        </button>
        <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 z-20 backdrop-blur-sm">
          <ChevronRight size={18} />
        </button>

        {/* Dots — bg-white / bg-white/30 on dark hero image, always fine */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {items.map((_, i) => (
            <button key={i} onClick={() => go(i)}
              className={`transition-all duration-300 rounded-full ${i === current ? "bg-white w-7 h-2" : "bg-white/30 hover:bg-white/60 w-2 h-2"}`} />
          ))}
        </div>

        {/* Slide counter */}
        <div className="absolute bottom-6 right-6 text-white/40 text-xs font-mono z-20 tracking-widest">
          {String(current + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </div>

        {/* Trust badge */}
        <div className="absolute top-4 right-4 hidden sm:flex items-center gap-1.5 bg-black/40 backdrop-blur-sm text-white/80 text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/10 z-20">
          <Zap size={10} className="text-yellow-400" />
          2M+ Deliveries · 100% Authentic
        </div>
      </div>
    </div>
  );
}
