"use client";
import { useState } from "react";
import { Instagram, Youtube, Facebook, Pause } from "lucide-react";

interface Message { text: string; link?: string; }
interface AnnouncementBarData {
  messages?: Message[];
  bg_color?: string;
  text_color?: string;
  speed?: number;
}

const DEFAULTS: Message[] = [
  { text: "⚡ 2M+ Deliveries across India" },
  { text: "🚚 Free shipping above ₹1000" },
  { text: "✅ 100% Authentic Products Guaranteed" },
  { text: "🏆 India's Biggest Sports E-Commerce Store" },
  { text: "⚡ Same-day dispatch on orders before 2 PM" },
];

interface Props { data?: AnnouncementBarData; }

export default function AnnouncementBar({ data }: Props) {
  const [paused, setPaused] = useState(false);
  const messages = data?.messages?.length ? data.messages : DEFAULTS;
  const bgColor  = data?.bg_color  || "#111111";
  const txtColor = data?.text_color || "#ffffff";
  // duration in seconds — smaller speed value = faster
  const duration = data?.speed ? Math.max(10, 120 - data.speed) : 35;

  return (
    <div
      className="h-9 flex items-center justify-between px-4 overflow-hidden select-none text-xs"
      style={{ background: bgColor, color: txtColor }}
    >
      {/* Social icons */}
      <div className="flex items-center gap-3 shrink-0 z-10">
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
          className="opacity-70 hover:opacity-100 transition-opacity">
          <Instagram size={13} />
        </a>
        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube"
          className="opacity-70 hover:opacity-100 transition-opacity">
          <Youtube size={13} />
        </a>
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
          className="opacity-70 hover:opacity-100 transition-opacity">
          <Facebook size={13} />
        </a>
      </div>

      {/* Scrolling ticker */}
      <div
        className="flex-1 overflow-hidden mx-6 cursor-pointer"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex whitespace-nowrap animate-marquee"
          style={{ animationPlayState: paused ? "paused" : "running", animationDuration: `${duration}s` }}
        >
          {[...messages, ...messages].map((m, i) => (
            <span key={i} className="inline-flex items-center gap-6 mr-12 opacity-80 hover:opacity-100 transition-opacity">
              {m.link
                ? <a href={m.link} className="hover:underline">{m.text}</a>
                : <span>{m.text}</span>}
              <span className="opacity-30">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* Pause indicator */}
      <div className="shrink-0 opacity-40 w-4">
        {paused && <Pause size={10} />}
      </div>
    </div>
  );
}
