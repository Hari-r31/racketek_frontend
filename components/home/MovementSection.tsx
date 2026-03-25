"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface MovementData {
  heading?: string;
  heading_italic?: string;
  heading_suffix?: string;
  heading_italic_2?: string;
  paragraph?: string;
  cta_text?: string;
  cta_link?: string;
  // legacy fields (backwards-compat)
  headline?: string;
  highlight_word?: string;
}

interface Props { data?: MovementData; }

export default function MovementSection({ data }: Props) {
  const cta_text = data?.cta_text || "Our Story";
  const cta_link = data?.cta_link || "/about";
  const paragraph = data?.paragraph || "At Racketek Outlet, we believe every athlete deserves access to professional-grade equipment. From local courts to national stadiums, we're the gear partner for those who refuse to settle.";

  // Support both new schema (heading/heading_italic) and old (headline/highlight_word)
  const buildHeading = () => {
    if (data?.heading) {
      return (
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.05] mb-8">
          {data.heading}{" "}
          {data.heading_italic && <em className="not-italic text-brand-600">{data.heading_italic}</em>}
          {data.heading_suffix && <span>{data.heading_suffix} </span>}
          {data.heading_italic_2 && <em className="not-italic italic">{data.heading_italic_2}</em>}
        </h2>
      );
    }
    // Legacy: headline with highlight_word
    const headline  = data?.headline || "More Than Just Gear,\nIt's a Movement";
    const highlight = data?.highlight_word || "Movement";
    const lines = headline.split("\n");
    return (
      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.05] mb-8">
        {lines.map((line, i) => (
          <span key={i} className="block">
            {line.includes(highlight) ? (
              <>
                {line.split(highlight)[0]}
                <span className="relative inline-block">
                  <span className="relative z-10 text-brand-600">{highlight}</span>
                  {/* FIX: bg-brand-100 on dark → use a brand-tinted dark token */}
                  <span className="absolute bottom-2 left-0 right-0 h-3 bg-brand-100 dark:bg-brand-900/60 -z-0" aria-hidden />
                </span>
                {line.split(highlight)[1]}
              </>
            ) : line}
          </span>
        ))}
      </h2>
    );
  };

  return (
    /* FIX: bg-white → also bg-white (covered by global), but keep explicit for clarity */
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left */}
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7, ease: "easeOut" }}>
            {buildHeading()}
            <Link href={cta_link} className="inline-flex items-center gap-3 group">
              {/* FIX: bg-black → dark:bg-white dark:text-black so button stays visible */}
              <span className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center group-hover:bg-brand-600 dark:group-hover:bg-brand-500 transition-colors">
                <ArrowRight size={18} className="text-white dark:text-black group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
              </span>
              {/* FIX: text-black → text-gray-900 so it uses the overridden token */}
              <span className="font-black text-lg text-gray-900 group-hover:text-brand-600 transition-colors tracking-wide">
                {cta_text}
              </span>
            </Link>
          </motion.div>

          {/* Right */}
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            className="lg:pl-8 border-l-0 lg:border-l-2 lg:border-gray-100">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-8 h-0.5 bg-brand-600 mt-3 shrink-0" />
              <p className="text-gray-600 text-lg leading-relaxed">{paragraph}</p>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {[
                { value: "2M+",  label: "Deliveries"  },
                { value: "500+", label: "Products"    },
                { value: "50+",  label: "Brands"      },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-3xl font-black text-brand-600">{s.value}</p>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
