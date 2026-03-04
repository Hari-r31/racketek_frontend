"use client";
import Image from "next/image";
import { motion } from "framer-motion";

interface Props {
  image_url?: string;
  alt?: string;
  caption?: string;
}

export default function AthletesImage({
  image_url,
  alt = "Athletes playing sports",
  caption = "Trusted by 10,000+ athletes across India",
}: Props) {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl overflow-hidden"
          style={{ aspectRatio: "21/9" }}
        >
          {image_url ? (
            <Image src={image_url} alt={alt} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-brand-950 to-black flex items-center justify-center">
              <div className="text-center">
                <div className="flex gap-6 justify-center mb-4 text-6xl opacity-30">
                  {["🏸","🏏","🏃","⚽","🎾"].map((e,i) => <span key={i}>{e}</span>)}
                </div>
                <p className="text-white/30 text-sm font-medium">Upload an athlete image from Admin</p>
              </div>
            </div>
          )}
          {/* Gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          {/* Caption */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
            <p className="text-white font-black text-lg sm:text-2xl tracking-wide drop-shadow-lg">
              {caption}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
