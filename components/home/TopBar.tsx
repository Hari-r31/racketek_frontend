"use client";
import { useEffect, useRef, useState } from "react";
import { Instagram, Youtube, Pause } from "lucide-react";

const ANNOUNCEMENTS = [
  "🚚 Free shipping above ₹1000",
  "🔥 Weekend Sale — up to 60% Off",
  "🏆 100% Authentic Products Guaranteed",
  "⚡ Same-day dispatch on orders before 2 PM",
  "🎾 New Yonex collection just dropped",
];

export default function TopBar() {
  const [paused, setPaused] = useState(false);

  return (
    <div className="bg-black text-white text-xs h-9 flex items-center justify-between px-4 overflow-hidden select-none">
      {/* Social icons */}
      <div className="flex items-center gap-3 shrink-0 z-10">
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-all duration-200 hover:text-transparent hover:bg-gradient-to-br hover:from-purple-400 hover:via-pink-500 hover:to-orange-400 hover:bg-clip-text"
          aria-label="Instagram"
        >
          <Instagram size={14} />
        </a>
        <a
          href="https://youtube.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-red-500 transition-colors"
          aria-label="YouTube"
        >
          <Youtube size={14} />
        </a>
      </div>

      {/* Marquee */}
      <div
        className="flex-1 overflow-hidden mx-6 cursor-pointer"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className={`flex whitespace-nowrap ${paused ? "" : "animate-marquee"}`}
          style={{ animationPlayState: paused ? "paused" : "running" }}
        >
          {[...ANNOUNCEMENTS, ...ANNOUNCEMENTS].map((a, i) => (
            <span key={i} className="inline-flex items-center gap-6 mr-12 text-gray-300 hover:text-white transition-colors">
              {a}
              <span className="text-gray-600">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* Pause indicator */}
      <div className="shrink-0 text-gray-600 w-4">
        {paused && <Pause size={10} />}
      </div>
    </div>
  );
}
