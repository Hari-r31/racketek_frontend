"use client";
import { motion } from "framer-motion";
import { ShoppingBag, Headphones, RotateCcw, Truck, Shield } from "lucide-react";

interface Stat         { label: string; value: string; }
interface TrustBadge   { icon: string;  text: string; }

interface AboutSectionData {
  tagline?: string;
  description?: string;
  stats?: Stat[];
  trust_badges?: TrustBadge[];
  // legacy
  brand_description?: string;
}

interface Props { data?: AboutSectionData; }

const ICON_MAP: Record<string, React.ReactNode> = {
  truck:     <Truck size={18} />,
  shield:    <Shield size={18} />,
  refresh:   <RotateCcw size={18} />,
  headphone: <Headphones size={18} />,
  bag:       <ShoppingBag size={18} />,
};

const DEFAULT_STATS: Stat[] = [
  { label: "Happy Athletes",  value: "10,000+" },
  { label: "Brands",          value: "50+"     },
  { label: "Products",        value: "5,000+"  },
  { label: "Cities Served",   value: "100+"    },
];

const DEFAULT_BADGES: TrustBadge[] = [
  { icon: "truck",     text: "Free Shipping above ₹1000" },
  { icon: "shield",    text: "100% Authentic Products"   },
  { icon: "refresh",   text: "Easy 7-Day Returns"        },
  { icon: "headphone", text: "7-Day Customer Support"    },
];

export default function AboutRacketOutlet({ data }: Props) {
  const tagline    = data?.tagline || "India's Biggest Sports E-Commerce Store";
  const description = data?.description || data?.brand_description
    || "At Racketek Outlet, we're committed to bringing you authentic, top-quality sports equipment at the best prices. From beginners to professionals — we've got your game covered.";
  const stats  = data?.stats?.length       ? data.stats       : DEFAULT_STATS;
  const badges = data?.trust_badges?.length ? data.trust_badges : DEFAULT_BADGES;

  return (
    <section className="bg-gray-950 text-gray-400 pt-16 pb-2 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Tagline + description + stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pb-10 border-b border-gray-800">
          <div className="lg:col-span-2">
            <p className="text-xs font-black text-brand-500 uppercase tracking-widest mb-2">About Racketek Outlet</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 leading-tight">{tagline}</h2>
            <p className="text-sm leading-relaxed text-gray-400 max-w-2xl">{description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 content-start">
            {stats.slice(0, 4).map((s) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-8">
          {badges.map((b) => (
            <div key={b.text} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center text-brand-400 shrink-0">
                {ICON_MAP[b.icon] || <Shield size={18} />}
              </div>
              <span className="text-xs font-medium text-gray-400">{b.text}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
