"use client";
import { useEffect, useRef } from "react";

const ITEMS = [
  "Authentic Products",
  "Best Prices",
  "Fast Shipping",
  "100% Genuine",
  "Premium Quality",
  "Expert Support",
  "Easy Returns",
];

const GRADIENT =
  "linear-gradient(90deg, #f97316 0%, #ea580c 30%, #dc2626 60%, #9333ea 100%)";

interface Props {
  reverse?: boolean;
}

function Ticker({ reverse = false }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    let speed = reverse ? -0.5 : 0.5;
    let position = 0;
    let rafId: number;

    const update = () => {
      position += speed;

      const width = track.scrollWidth / 2;

      if (position <= -width) position = 0;
      if (position >= 0) position = -width;

      track.style.transform = `translateX(${position}px)`;
      rafId = requestAnimationFrame(update);
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) speed = reverse ? -3 : 3;
      else speed = reverse ? 3 : -3;
    };

    container.addEventListener("wheel", handleWheel, { passive: true });
    rafId = requestAnimationFrame(update);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      cancelAnimationFrame(rafId);
    };
  }, [reverse]);

  const duplicated = [...ITEMS, ...ITEMS];

  return (
    <div
      ref={containerRef}
      className="overflow-hidden py-4 select-none"
    >
      <div
        ref={trackRef}
        className="flex whitespace-nowrap"
      >
        {duplicated.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-4 mr-10">
            <span
              className="text-4xl sm:text-5xl font-black uppercase tracking-tight"
              style={{
                background: GRADIENT,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {item}
            </span>
            <span className="text-gray-600 text-2xl">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function TrustIndicators() {
  return (
    <section className="bg-black py-2 overflow-hidden border-y border-gray-800">
      <Ticker reverse={false} />
      <Ticker reverse={true} />
    </section>
  );
}