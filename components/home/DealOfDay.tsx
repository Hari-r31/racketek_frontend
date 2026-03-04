"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface DealOfDayData {
  heading?: string;
  image_url?: string;
  cta?: string;
  cta_link?: string;
  bg_color?: string;
  ends_at?: string;    // ISO string
  products?: any[];
}

interface Props { data?: DealOfDayData; }

function useCountdown(endsAt?: string) {
  const calcDiff = () => {
    if (!endsAt) return { days: 0, hours: 0, mins: 0, secs: 0, expired: false };
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, expired: true };
    const s = Math.floor(diff / 1000);
    return {
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      mins:  Math.floor((s % 3600)  / 60),
      secs:  s % 60,
      expired: false,
    };
  };
  const [t, setT] = useState(calcDiff());
  useEffect(() => {
    const id = setInterval(() => setT(calcDiff()), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return t;
}

function Pad({ n }: { n: number }) {
  return <span className="font-black">{String(n).padStart(2, "0")}</span>;
}

function TimerUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 sm:px-6 sm:py-3 text-center min-w-[52px] border border-white/10">
        <span className="text-2xl sm:text-3xl font-black text-white block leading-none">
          <Pad n={value} />
        </span>
      </div>
      <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-1">{label}</span>
    </div>
  );
}

export default function DealOfDay({ data }: Props) {
  const heading  = data?.heading  || "Exclusive Deals on Your Favourite Sport";
  const cta      = data?.cta      || "Shop Now";
  const ctaLink  = data?.cta_link || "/collections/deal-of-the-day";
  const bgColor  = data?.bg_color || "#0f172a";
  const timer    = useCountdown(data?.ends_at);

  return (
    <section className="py-0 overflow-hidden">
      <div
        className="relative min-h-[260px] flex items-center justify-center px-4"
        style={{ background: bgColor }}>
        {/* Background image */}
        {data?.image_url && (
          <Image src={data.image_url} alt="Deal banner" fill className="object-cover opacity-30" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />

        <div className="relative z-10 text-center max-w-3xl mx-auto py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <p className="text-brand-400 text-xs font-black uppercase tracking-[0.2em] mb-3 flex items-center justify-center gap-2">
              <Clock size={12} /> Limited Time Offer
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-8 leading-tight">{heading}</h2>

            {/* Countdown */}
            {!timer.expired && (
              <div className="flex items-center justify-center gap-3 sm:gap-5 mb-8">
                <TimerUnit value={timer.days}  label="Days"  />
                <span className="text-white/40 text-2xl font-black pb-4">:</span>
                <TimerUnit value={timer.hours} label="Hours" />
                <span className="text-white/40 text-2xl font-black pb-4">:</span>
                <TimerUnit value={timer.mins}  label="Mins"  />
                <span className="text-white/40 text-2xl font-black pb-4">:</span>
                <TimerUnit value={timer.secs}  label="Secs"  />
              </div>
            )}

            {timer.expired && (
              <p className="text-white/50 text-sm mb-6">Check back soon for new deals!</p>
            )}

            <Link href={ctaLink}
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-black px-8 py-4 rounded-xl transition-all hover:scale-105 hover:shadow-xl text-sm uppercase tracking-widest">
              {cta} <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
