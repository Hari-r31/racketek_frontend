"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { formatPrice, getDiscountPercent } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/uiStore";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface ProductData {
  id: number; name: string; slug: string; brand?: string;
  price: number; compare_price?: number; stock: number;
  images?: { url: string; is_primary: boolean }[];
  primary_image?: string;
}

interface HotspotItem {
  id: number; label: string;
  hotspot_x: number; hotspot_y: number;
  side?: "left" | "right";
  hotspot_side?: "left" | "right";    // legacy
  product?: ProductData;
  product_id?: number;
  placeholder_image?: string;
  placeholder_name?: string;
  placeholder_price?: number;
}

interface ShopTheLookData {
  heading?: string;
  subheading?: string;
  subheading_italic?: string;
  player_image?: string;
  products?: HotspotItem[];
  // legacy
  headline?: string;
}

interface Props { data?: ShopTheLookData; }

export default function ShopTheLook({ data }: Props) {
  const { isAuthenticated } = useAuthStore();
  const { increment } = useCartStore();
  const [active, setActive]  = useState<number | null>(null);
  const [adding, setAdding]  = useState(false);
  const [added, setAdded]    = useState<Record<number, boolean>>({});

  const heading         = data?.heading          || "Player's Choice";
  const subheading      = data?.subheading       || "Shop the";
  const subheading_italic = data?.subheading_italic || "look";
  const player_image    = data?.player_image     || "";
  const products        = data?.products         || [];

  if (!products.length) return null;

  const activeItem    = products.find((p) => p.id === active);
  const activeProduct = activeItem?.product;

  // Placeholder fallback for items without a linked product
  const getDisplayImg = (item: HotspotItem) => {
    if (item.product?.primary_image) return item.product.primary_image;
    if (item.product?.images?.[0]?.url) return item.product.images[0].url;
    return item.placeholder_image || "";
  };
  const getDisplayName  = (item: HotspotItem) => item.product?.name  || item.placeholder_name  || item.label;
  const getDisplayPrice = (item: HotspotItem) => item.product?.price || item.placeholder_price || 0;
  const getSide         = (item: HotspotItem) => item.side || item.hotspot_side || "right";

  const handleAddToCart = async (productId: number) => {
    if (!isAuthenticated) { toast.error("Please login"); return; }
    setAdding(true);
    try {
      await api.post("/cart/items", { product_id: productId, quantity: 1 });
      increment(); setAdded((prev) => ({ ...prev, [productId]: true }));
      toast.success("Added to cart!");
    } catch { toast.error("Failed to add"); }
    finally { setAdding(false); }
  };

  return (
    /* FIX: bg-gray-50 → covered by global */
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-black text-brand-600 uppercase tracking-widest mb-2">{heading}</p>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900">
            {subheading} <em className="not-italic italic text-brand-600">{subheading_italic}</em>
          </h2>
          <p className="text-gray-500 mt-2 text-sm">Click the hotspots to discover products</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          {/* Player image + hotspots */}
          <div className="lg:col-span-3">
            <div className="relative rounded-3xl overflow-hidden" style={{ aspectRatio: "2/3", maxHeight: "620px" }}>
              {player_image
                ? <Image src={player_image} alt="Athlete" fill className="object-cover object-top" />
                : <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-950 flex items-center justify-center">
                    <span className="text-9xl opacity-20">🏸</span>
                  </div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

              {/* Hotspots */}
              {products.map((item) => (
                <button key={item.id}
                  onClick={() => setActive(active === item.id ? null : item.id)}
                  className="absolute z-20 group"
                  style={{ left: `${item.hotspot_x}%`, top: `${item.hotspot_y}%`, transform: "translate(-50%,-50%)" }}>
                  <span className={`block w-6 h-6 rounded-full border-2 border-white relative transition-all ${active === item.id ? "bg-brand-600 scale-125" : "bg-white/80 hover:scale-110"}`}>
                    {active === item.id && <span className="absolute inset-0 rounded-full bg-brand-600 animate-ping opacity-60" />}
                  </span>
                  {/* Tooltip always uses light colors (overlaid on image — intentional) */}
                  <span className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-bold bg-white text-gray-900 px-2 py-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${getSide(item) === "right" ? "left-8" : "right-8"}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Legend pills — FIX: bg-white border-gray-200 → dark variants */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {products.map((item) => (
                <button key={item.id} onClick={() => setActive(active === item.id ? null : item.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                    active === item.id
                      ? "bg-brand-600 text-white"
                      : "bg-white dark:bg-[rgb(var(--surface-2))] border border-gray-200 text-gray-600 hover:border-brand-400"
                  }`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product card */}
          <motion.div key={active ?? "none"} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }} className="lg:col-span-2">
            {active !== null ? (() => {
              const item = activeItem!;
              const displayImg   = getDisplayImg(item);
              const displayName  = getDisplayName(item);
              const displayPrice = getDisplayPrice(item);
              const prod         = item.product;
              const discount     = prod ? getDiscountPercent(prod.price, prod.compare_price) : 0;

              return (
                /* FIX: bg-white border-gray-100 → dark variants */
                <div className="bg-white dark:bg-[rgb(var(--surface-0))] rounded-3xl p-6 shadow-lg border border-gray-100">
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-50">
                    {displayImg
                      ? <Image src={displayImg} alt={displayName} fill className="object-contain p-4" />
                      : <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">🏆</div>}
                    {discount > 0 && (
                      <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                        {discount}% OFF
                      </span>
                    )}
                  </div>

                  {prod?.brand && <p className="text-xs font-black text-brand-600 uppercase tracking-widest mb-1">{prod.brand}</p>}
                  <h3 className="font-black text-gray-900 text-lg mb-2 line-clamp-2">{displayName}</h3>

                  {displayPrice > 0 && (
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-black text-gray-900">{formatPrice(displayPrice)}</span>
                      {prod?.compare_price && prod.compare_price > prod.price && (
                        <span className="text-sm text-gray-400 line-through">{formatPrice(prod.compare_price)}</span>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    {prod ? (
                      <>
                        {/* FIX: bg-black hover:bg-gray-800 → dark variants */}
                        <button onClick={() => handleAddToCart(prod.id)} disabled={adding || prod.stock === 0}
                          className="w-full flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all hover:scale-[1.02] disabled:opacity-50">
                          <ShoppingCart size={16} />
                          {adding ? "Adding…" : added[prod.id] ? "Added!" : "Add to Cart"}
                        </button>
                        {added[prod.id] && (
                          <Link href="/cart" className="flex items-center justify-center gap-2 border-2 border-brand-600 text-brand-600 font-bold py-2.5 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/40 transition-colors text-sm">
                            Go to Cart <ArrowRight size={14} />
                          </Link>
                        )}
                        <Link href={`/products/${prod.slug}`}
                          className="flex items-center justify-center gap-1 text-sm text-gray-400 hover:text-brand-600 transition-colors py-1">
                          View details <ArrowRight size={12} />
                        </Link>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 text-center border border-dashed border-gray-200 rounded-xl p-3">
                        Admin: Link a product ID to enable cart functionality
                      </p>
                    )}
                  </div>
                </div>
              );
            })() : (
              /* FIX: bg-white border-gray-100 → dark variants */
              <div className="bg-white dark:bg-[rgb(var(--surface-0))] rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
                <span className="text-5xl block mb-3">👆</span>
                <p className="text-gray-500 font-medium">Click a hotspot to see the product</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
