"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface BrandBanner {
  id: number;
  brand_name: string;
  image_url: string;
  link: string;
  label?: string;
}

interface BrandSpotlightData {
  heading?: string;
  banners?: BrandBanner[];
}

interface Props { data?: BrandSpotlightData; }

const FALLBACK: BrandBanner[] = [
  { id: 1, brand_name: "Yonex",  image_url: "", link: "/products?brand=yonex",  label: "Yonex Gear"  },
  { id: 2, brand_name: "Apacs",  image_url: "", link: "/products?brand=apacs",  label: "Apacs Gear"  },
  { id: 3, brand_name: "Victor", image_url: "", link: "/products?brand=victor", label: "Victor Gear" },
  { id: 4, brand_name: "DSC",    image_url: "", link: "/products?brand=dsc",    label: "DSC Gear"    },
];

const EMOJI_MAP: Record<string, string> = {
  yonex: "🏸", apacs: "🏸", victor: "🏸", "li-ning": "🏸",
  sg: "🏏", dsc: "🏏", "new-balance": "👟",
  head: "🎾", babolat: "🎾", wilson: "🎾",
  cougar: "🏋️", airavat: "🏊",
};

export default function BrandSpotlight({ data }: Props) {
  const heading = data?.heading || "Top Brands";
  const banners = data?.banners?.length ? data.banners : FALLBACK;

  return (
    <section className="py-16 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-brand-500 text-xs font-black uppercase tracking-widest mb-2">Partners</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">{heading}</h2>
          </div>
          <Link href="/products" className="text-sm font-bold text-gray-500 hover:text-white transition-colors flex items-center gap-1">
            All Brands <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {banners.map((banner, i) => {
            const brandKey = banner.brand_name.toLowerCase().replace(/\s+/g, "-");
            const emoji    = EMOJI_MAP[brandKey] || "🏅";
            return (
              <motion.div key={banner.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Link href={banner.link}
                  className="block relative overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 hover:border-brand-600 transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-600/10">
                  {/* Image or gradient placeholder */}
                  <div className="aspect-[16/9] relative overflow-hidden">
                    {banner.image_url
                      ? <Image src={banner.image_url} alt={banner.brand_name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-950 flex items-center justify-center">
                          <span className="text-5xl opacity-20">{emoji}</span>
                        </div>}
                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>

                  {/* Label */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-black text-sm">{banner.label || banner.brand_name}</p>
                      <p className="text-white/50 text-xs">Shop Collection</p>
                    </div>
                    <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-brand-600 transition-colors">
                      <ArrowRight size={12} className="text-white" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
