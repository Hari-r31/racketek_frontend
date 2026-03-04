"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle } from "lucide-react";

const PHONE  = "919491147433";
const BASE   = `https://wa.me/${PHONE}?text=`;

const QUICK_MSGS = [
  { label: "🛒 Order help",      text: "Hi! I need help with my order." },
  { label: "🏸 Product query",   text: "Hi! I have a question about a product." },
  { label: "↩ Return / refund",  text: "Hi! I'd like to initiate a return or refund." },
  { label: "💬 General enquiry", text: "Hi! I have a general enquiry." },
];

/* WhatsApp SVG (official brand colour) */
function WAIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.116 1.523 5.845L.057 23.5l5.832-1.528A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.846 0-3.596-.473-5.122-1.304l-.368-.217-3.815 1 1.012-3.695-.239-.381A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  );
}

export default function WhatsAppButton() {
  const [open,    setOpen]    = useState(false);
  const [visible, setVisible] = useState(true);
  const lastY    = useRef(0);
  const rafId    = useRef<number | null>(null);
  const ticking  = useRef(false);

  /* show/hide on scroll */
  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      rafId.current = requestAnimationFrame(() => {
        const y = window.scrollY;
        setVisible(y < 100 || y < lastY.current);
        lastY.current = y;
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const waLink = (text: string) =>
    `${BASE}${encodeURIComponent(text)}`;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 20 }}
          transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
          className="fixed bottom-6 right-5 z-[999] flex flex-col items-end gap-3"
        >

          {/* ── Chat panel ────────────────────────────────── */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 12, originX: 1, originY: 1 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 12 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-72 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
              >
                {/* Header */}
                <div className="bg-[#25D366] px-4 py-3.5 flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <WAIcon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-sm leading-tight">Racketek Support</p>
                    <p className="text-white/80 text-xs mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-white rounded-full inline-block animate-pulse" />
                      Typically replies in minutes
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shrink-0"
                  >
                    <X size={14} className="text-white" />
                  </button>
                </div>

                {/* Chat bubble */}
                <div className="bg-[#ECE5DD] px-4 py-4">
                  <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-3 shadow-sm max-w-[90%]">
                    <p className="text-[13px] text-gray-800 leading-snug">
                      👋 Hi there! How can we help you today?
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1.5 text-right">
                      {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>

                {/* Quick message options */}
                <div className="px-4 py-3 space-y-2 bg-white border-t border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Quick select a topic
                  </p>
                  {QUICK_MSGS.map(m => (
                    <a
                      key={m.label}
                      href={waLink(m.text)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 font-medium hover:border-[#25D366] hover:text-[#1a9e4e] hover:bg-green-50 transition-all group"
                    >
                      <span className="text-base leading-none">{m.label.split(" ")[0]}</span>
                      <span className="flex-1">{m.label.substring(m.label.indexOf(" ") + 1)}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"
                        className="text-gray-300 group-hover:text-[#25D366] shrink-0 transition-colors">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </a>
                  ))}

                  {/* Direct open */}
                  <a
                    href={waLink("Hi! I need help.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20c45e] text-white font-bold text-sm transition-all mt-1"
                  >
                    <WAIcon size={16} />
                    Open WhatsApp Chat
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Floating bubble button ────────────────────── */}
          <button
            onClick={() => setOpen(v => !v)}
            aria-label={open ? "Close chat" : "Chat on WhatsApp"}
            className="relative w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20c45e] shadow-lg shadow-green-500/30 flex items-center justify-center transition-all hover:scale-110 hover:shadow-xl hover:shadow-green-500/40 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-400"
          >
            {/* Ping ring — only when closed */}
            {!open && (
              <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30 pointer-events-none" />
            )}

            <AnimatePresence mode="wait">
              {open ? (
                <motion.span key="close"
                  initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X size={24} className="text-white" />
                </motion.span>
              ) : (
                <motion.span key="wa"
                  initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <WAIcon size={26} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* "Chat with us" label — visible when closed */}
          <AnimatePresence>
            {!open && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: 0.6, duration: 0.2 }}
                className="absolute right-16 bottom-4 pointer-events-none"
              >
                <div className="bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap flex items-center gap-1.5">
                  <MessageCircle size={11} />
                  Chat with us
                  {/* Arrow */}
                  <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-0 h-0
                    border-t-[5px] border-b-[5px] border-l-[6px]
                    border-t-transparent border-b-transparent border-l-gray-900" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
