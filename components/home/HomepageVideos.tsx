"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Play, Pause } from "lucide-react";

interface VideoItem {
  id: number;
  video_url?: string;
  url?: string;
  poster_url?: string;
  poster?: string;
  title: string;
  subtitle: string;
  cta: string;
  cta_link?: string;
  link?: string;
}

interface HomepageVideosData {
  videos?: VideoItem[];
}

interface Props {
  data?: HomepageVideosData;
}

function VideoSection({ item }: { item: VideoItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  const src = item.video_url || item.url || "";
  const poster = item.poster_url || item.poster || "";
  const ctaHref = item.cta_link || item.link || "/products";

  const toggle = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;

    if (el.paused) {
      el.play().catch(() => {});
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    el.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black group">
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        poster={poster || undefined}
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-1/2 left-1/2 min-w-full min-h-[150vh] w-auto h-auto object-cover transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 group-hover:scale-105"
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10" />

      {/* Content */}
      <div className="absolute bottom-16 left-10 z-20 text-white max-w-xl">
        <h2 className="text-4xl sm:text-5xl font-black mb-3">
          {item.title}
        </h2>
        <p className="text-lg text-white/80 mb-6">
          {item.subtitle}
        </p>

        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 bg-white text-black font-bold text-sm px-6 py-3 rounded-full hover:bg-brand-500 hover:text-white transition-all"
        >
          {item.cta}
        </Link>
      </div>

      {/* Play / Pause Button */}
      <button
        onClick={toggle}
        className="absolute bottom-6 right-6 bg-white text-black rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-gray-200 transition-opacity duration-300 opacity-70 group-hover:opacity-100 z-20"
      >
        {playing ? <Pause size={20} /> : <Play size={20} />}
      </button>
    </div>
  );
}

export default function HomepageVideos({ data }: Props) {
  const videos = data?.videos || [];

  if (!videos.length) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        No videos available.
      </div>
    );
  }

  return (
    <div className="w-full">
      {videos.map((video) => (
        <VideoSection key={video.id} item={video} />
      ))}
    </div>
  );
}