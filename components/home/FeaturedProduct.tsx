"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { formatPrice, getDiscountPercent } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/uiStore";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface ProductData {
  id: number; name: string; slug: string; brand?: string;
  price: number; compare_price?: number; description?: string;
  short_description?: string; stock: number; avg_rating: number; review_count: number;
  images: { url: string; is_primary: boolean }[];
}

interface PlaceholderData {
  title?: string; description?: string;
  images?: string[]; price?: number; compare_price?: number;
}

interface FeaturedProductData {
  product_id?: number;
  product?: ProductData;
  badge?: string;
  tag?: string;
  override_title?: string;
  override_description?: string;
  placeholder?: PlaceholderData;
}

interface Props { data?: FeaturedProductData; }

export default function FeaturedProduct({ data }: Props) {
  const { isAuthenticated } = useAuthStore();
  const { increment } = useCartStore();
  const [selImg, setSelImg] = useState(0);
  const [adding, setAdding] = useState(false);
  const [added, setAdded]   = useState(false);

  const badge  = data?.badge || "Speed · Comfort · Precision";
  const tag    = data?.tag   || "Featured Pick";
  const product = data?.product;
  const ph      = data?.placeholder;

  // Build images array: real product > placeholder images
  const images: { url: string }[] = useMemo(() => {
    if (product?.images?.length) return product.images;
    if (ph?.images?.length) return ph.images.map((url) => ({ url }));
    return [];
  }, [product, ph]);

  // Title, description, prices
  const title       = data?.override_title       || product?.name              || ph?.title       || "Featured Product";
  const description = data?.override_description || product?.short_description || ph?.description || "";
  const price       = product?.price       ?? ph?.price       ?? 0;
  const comparePrice= product?.compare_price ?? ph?.compare_price;
  const stock       = product?.stock ?? 999;
  const discount    = getDiscountPercent(price, comparePrice);
  const brand       = product?.brand;
  const rating      = product?.avg_rating ?? 0;
  const reviewCount = product?.review_count ?? 0;
  const isPlaceholder = !product;

  // Only render if we have something to show
  if (!product && !ph) return null;

  const handleAddToCart = async () => {
    if (!product) { toast("Add a product via Admin → Homepage → Featured Product"); return; }
    if (!isAuthenticated) { toast.error("Please login to add to cart"); return; }
    setAdding(true);
    try {
      await api.post("/cart/items", { product_id: product.id, quantity: 1 });
      increment(); setAdded(true); toast.success("Added to cart!");
    } catch { toast.error("Failed to add"); }
    finally { setAdding(false); }
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge strip */}
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-black text-brand-600 uppercase tracking-[0.2em] mb-2">{badge}</span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
            <em className="not-italic italic">Crafted for Champions</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Image gallery */}
          <div>
            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-3">
              {images[selImg]?.url
                ? <Image src={images[selImg].url} alt={title} fill className="object-contain p-8" priority />
                : <div className="w-full h-full flex items-center justify-center text-9xl opacity-20">🏆</div>}
              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full">
                  {discount}% OFF
                </span>
              )}
              {isPlaceholder && (
                <span className="absolute top-4 right-4 bg-brand-600/90 text-white text-[10px] font-black px-2 py-1 rounded-full">
                  {tag}
                </span>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={() => setSelImg((p) => (p - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setSelImg((p) => (p + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md">
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelImg(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${selImg === i ? "border-brand-600 scale-105" : "border-gray-200"}`}>
                    <Image src={img.url} alt="" width={64} height={64} className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}>
            {brand && <p className="text-xs font-black text-brand-600 uppercase tracking-widest mb-2">{brand}</p>}
            <h3 className="text-3xl font-black text-gray-900 mb-3">{title}</h3>

            {reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className={i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
                <span className="text-sm text-gray-400">({reviewCount} reviews)</span>
              </div>
            )}

            {price > 0 && (
              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-4xl font-black text-gray-900">{formatPrice(price)}</span>
                {comparePrice && comparePrice > price && (
                  <span className="text-xl text-gray-400 line-through">{formatPrice(comparePrice)}</span>
                )}
                {discount > 0 && (
                  <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    Save {discount}%
                  </span>
                )}
              </div>
            )}

            {description && <p className="text-gray-600 leading-relaxed mb-6">{description}</p>}

            {!isPlaceholder && (
              <p className="text-sm mb-6">
                {stock > 0
                  ? <span className="text-green-600 font-semibold">✓ In Stock ({stock} units)</span>
                  : <span className="text-red-500 font-semibold">✗ Out of Stock</span>}
              </p>
            )}

            <div className="flex gap-3 mb-4">
              <button onClick={handleAddToCart} disabled={adding || stock === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50">
                <ShoppingCart size={18} />
                {adding ? "Adding…" : added ? "Added!" : "Add to Cart"}
              </button>
              <button disabled={stock === 0}
                onClick={async () => { await handleAddToCart(); if (!isPlaceholder) window.location.href = "/cart"; }}
                className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50">
                Buy Now
              </button>
            </div>

            {added && product && (
              <Link href="/cart" className="flex items-center justify-center gap-2 border-2 border-brand-600 text-brand-600 font-bold py-3 rounded-xl hover:bg-brand-50 transition-colors">
                Go to Cart <ArrowRight size={16} />
              </Link>
            )}

            {product && (
              <Link href={`/products/${product.slug}`}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-brand-600 mt-3 transition-colors">
                View full details <ArrowRight size={12} />
              </Link>
            )}

            {isPlaceholder && (
              <p className="text-xs text-gray-400 mt-3 border border-dashed border-gray-200 rounded-xl p-3 text-center">
                Admin: Set a Product ID in Homepage → Featured Product to show live product data here
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
