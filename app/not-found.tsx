"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const EXCUSES = [
  "The page went out for a walk and never came back. 🚶",
  "Our intern accidentally deleted it. He's been fired. 🔥",
  "This page is currently attending a badminton tournament. 🏸",
  "Looks like this URL smashed it out of bounds. 💨",
  "The page took a wrong turn at Albuquerque. 🗺️",
  "This page is in a timeout for bad behaviour. ⏱️",
  "It was here a moment ago, we swear. 🤷",
  "The page quit and is now doing yoga in Rishikesh. 🧘",
];

export default function NotFound() {
  const [excuse, setExcuse] = useState("");
  const [bounces, setBounces] = useState(0);

  useEffect(() => {
    setExcuse(EXCUSES[Math.floor(Math.random() * EXCUSES.length)]);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-brand-50 flex flex-col items-center justify-center px-6 text-center">

      {/* Animated shuttlecock */}
      <div
        className="text-8xl mb-2 cursor-pointer select-none transition-transform active:scale-75"
        style={{
          animation: "bounce-shuttle 1.2s infinite",
          display: "inline-block",
        }}
        onClick={() => setBounces(b => b + 1)}
        title="Click me!"
      >
        🏸
      </div>

      {bounces > 0 && (
        <p className="text-xs text-brand-500 font-semibold mb-4 animate-pulse">
          {bounces === 1 && "Okay that was satisfying."}
          {bounces === 2 && "Again? Really?"}
          {bounces === 3 && "You've got issues."}
          {bounces >= 4 && `You clicked ${bounces} times. Seek help.`}
        </p>
      )}

      {/* 404 */}
      <h1 className="text-[120px] md:text-[180px] font-black leading-none text-gray-900 tracking-tighter">
        4<span className="text-brand-600">0</span>4
      </h1>

      <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-3">
        This Page Got Smashed Out of Court
      </h2>

      <p className="text-gray-500 mb-2 max-w-md text-sm leading-relaxed">
        The page you're looking for doesn't exist, moved, or was never real to begin with.
        Much like our rivals' defence.
      </p>

      {excuse && (
        <div className="bg-white border border-gray-200 rounded-2xl px-6 py-3 mb-8 shadow-sm max-w-sm">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Official Excuse</p>
          <p className="text-sm text-gray-700 font-medium">{excuse}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="bg-brand-600 hover:bg-brand-700 text-white font-black px-8 py-3.5 rounded-2xl text-sm transition-all hover:scale-105 active:scale-100 shadow-md"
        >
          🏠 Take Me Home
        </Link>
        <Link
          href="/products"
          className="bg-white border-2 border-gray-200 hover:border-brand-400 text-gray-700 hover:text-brand-600 font-black px-8 py-3.5 rounded-2xl text-sm transition-all hover:scale-105 active:scale-100"
        >
          🛒 Shop Instead
        </Link>
      </div>

      <p className="mt-10 text-xs text-gray-400">
        Error 404 · RacketOutlet · Don't worry, even pros mishit sometimes.
      </p>

      <style jsx global>{`
        @keyframes bounce-shuttle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          30%       { transform: translateY(-24px) rotate(-15deg); }
          60%       { transform: translateY(-10px) rotate(10deg); }
        }
      `}</style>
    </div>
  );
}
