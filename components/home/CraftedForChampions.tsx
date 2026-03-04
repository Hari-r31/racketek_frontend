"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide { id: number; image_url: string; label?: string; }

interface CraftedData {
  headline?: string;
  headline_italic?: string;
  subtext?: string;
  slides?: Slide[];
  // legacy
  before_image?: string;
  after_image?: string;
}

interface Props { data?: CraftedData; }

const GRADIENT = "linear-gradient(135deg, #f97316 0%, #ea580c 40%, #dc2626 80%, #9333ea 100%)";

export default function CraftedForChampions({ data }: Props) {
  const headline        = data?.headline || "Crafted for";
  const headline_italic = data?.headline_italic || "Champions";
  const subtext         = data?.subtext  || "Every product handpicked for performance, durability, and style.";

  // Support both new `slides` array and legacy before/after images
  const slides: Slide[] = data?.slides?.length
    ? data.slides
    : [
        { id: 1, image_url: data?.before_image || "", label: "Performance" },
        { id: 2, image_url: data?.after_image  || "", label: "Style"       },
      ];

  const [current, setCurrent] = useState(0);
  const [dir, setDir]         = useState(1);

  const go = (idx: number) => {
    setDir(idx > current ? 1 : -1);
    setCurrent(idx);
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => go((current + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, [current, slides.length]);

  const variants = {
    enter:  (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
  };

  return (
    <section className="py-20 bg-gray-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Slide show */}
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-gray-900">
              <AnimatePresence initial={false} custom={dir}>
                <motion.div key={current} custom={dir} variants={variants}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="absolute inset-0">
                  {slides[current]?.image_url
                    ? <Image src={slides[current].image_url} alt={slides[current].label || ""} fill className="object-cover" />
                    : <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${current % 2 === 0 ? "from-brand-800 to-orange-900" : "from-gray-700 to-gray-900"}`}>
                        <span className="text-9xl opacity-20">{current % 2 === 0 ? "⚡" : "🏆"}</span>
                      </div>}
                  {/* Label badge */}
                  {slides[current]?.label && (
                    <span className="absolute bottom-4 left-4 bg-white/90 text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      {slides[current].label}
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              {slides.length > 1 && (
                <>
                  <button onClick={() => go((current - 1 + slides.length) % slides.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all z-20">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => go((current + 1) % slides.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all z-20">
                    <ChevronRight size={16} />
                  </button>
                  <div className="absolute bottom-4 right-4 flex gap-1.5 z-20">
                    {slides.map((_, i) => (
                      <button key={i} onClick={() => go(i)}
                        className={`rounded-full transition-all ${i === current ? "bg-white w-5 h-2" : "bg-white/30 w-2 h-2"}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Text */}
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}>
            <h2 className="text-5xl sm:text-6xl font-black leading-tight mb-6"
              style={{ background: GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {headline} <em className="not-italic">{headline_italic}</em>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">{subtext}</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { n: "100%", l: "Authentic"  },
                { n: "50+",  l: "Top Brands" },
                { n: "10K+", l: "Athletes"   },
                { n: "4.8★", l: "Rating"     },
              ].map((s) => (
                <div key={s.l} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <p className="text-2xl font-black text-white">{s.n}</p>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.l}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
