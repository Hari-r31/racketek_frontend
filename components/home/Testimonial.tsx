"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

interface TestimonialItem {
  id: number; quote: string; author: string; role: string; avatar?: string; rating: number;
}

interface TestimonialsData {
  heading?: string;
  testimonials?: TestimonialItem[];
}

interface Props { data?: TestimonialsData; }

const FALLBACK: TestimonialItem[] = [
  { id: 1, quote: "Best sports gear I've ever purchased. The quality is outstanding and delivery was lightning fast!", author: "Arjun Sharma", role: "State-level Badminton Player", rating: 5 },
  { id: 2, quote: "Stocked our entire cricket academy with gear from here. Excellent quality at competitive prices!", author: "Priya Nair", role: "Cricket Academy Coach", rating: 5 },
  { id: 3, quote: "The running shoes are perfect for marathons. Amazing support for long runs — a game changer!", author: "Rahul Verma", role: "Marathon Runner", rating: 5 },
  { id: 4, quote: "Found the exact racket my coach recommended at a great price. Fast shipping, genuine product.", author: "Meera Reddy", role: "Junior Badminton Champion", rating: 5 },
];

export default function Testimonial({ data }: Props) {
  const heading   = data?.heading || "What Athletes Say";
  const items     = data?.testimonials?.length ? data.testimonials : FALLBACK;
  const [current, setCurrent] = useState(0);
  const [dir, setDir]         = useState(1);

  const go = useCallback((idx: number) => {
    setDir(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current]);

  const next = useCallback(() => go((current + 1) % items.length), [current, go, items.length]);
  const prev = () => go((current - 1 + items.length) % items.length);

  useEffect(() => {
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [next]);

  const t = items[current];

  return (
    <section className="bg-black py-24 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-brand-500 text-xs font-black uppercase tracking-widest mb-3">{heading}</p>
        <div className="text-8xl text-gray-800 font-serif leading-none mb-6 select-none">"</div>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={current} custom={dir}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}>
            {/* Stars */}
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} className={i < t.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-700 text-gray-700"} />
              ))}
            </div>

            <blockquote className="text-2xl sm:text-3xl font-bold text-white leading-relaxed mb-8 max-w-3xl mx-auto">
              {t.quote}
            </blockquote>

            <div className="flex items-center justify-center gap-3">
              {t.avatar
                ? <Image src={t.avatar} alt={t.author} width={48} height={48} className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-600" />
                : <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white font-black text-lg ring-2 ring-brand-500">
                    {t.author.charAt(0)}
                  </div>}
              <div className="text-left">
                <p className="text-white font-black">{t.author}</p>
                <p className="text-gray-500 text-sm">{t.role}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-10">
          <button onClick={prev} className="w-10 h-10 rounded-full border border-gray-700 text-gray-400 hover:border-white hover:text-white flex items-center justify-center transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="flex gap-2">
            {items.map((_, i) => (
              <button key={i} onClick={() => go(i)}
                className={`rounded-full transition-all duration-300 ${i === current ? "bg-brand-600 w-6 h-2" : "bg-gray-700 w-2 h-2 hover:bg-gray-500"}`} />
            ))}
          </div>
          <button onClick={next} className="w-10 h-10 rounded-full border border-gray-700 text-gray-400 hover:border-white hover:text-white flex items-center justify-center transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
