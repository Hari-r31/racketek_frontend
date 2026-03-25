"use client";
/**
 * FeaturedProduct.tsx
 *
 * HOOKS FIX: All hooks are now called unconditionally at the top of the
 * component — before any conditional returns — which is required by the
 * Rules of Hooks. The early "return null" guard was previously placed
 * AFTER the hooks, causing React error #310 on the first render when
 * data was still loading (undefined product + undefined placeholder).
 *
 * DARK MODE FIX:
 * - bg-white section + image area → covered by global override
 * - bg-gray-50 image placeholder → covered by global override
 * - bg-white/80 carousel nav buttons → dark:bg-black/60 dark:hover:bg-black/80
 * - bg-black "Add to Cart" button → dark:bg-white dark:text-black dark:hover:bg-gray-100
 * - hover:bg-brand-50 qty buttons → dark:hover:bg-brand-900/40
 * - border-gray-200 thumbnail strip → covered by global override
 */
import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart, Star, ChevronLeft, ChevronRight,
  ArrowRight, Minus, Plus, Check, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice, getDiscountPercent } from "@/lib/utils";
import { useAuthStore }          from "@/store/authStore";
import { useCartItem, useCartActions } from "@/lib/useCart";
import { useRouter }             from "next/navigation";
import toast                     from "react-hot-toast";

interface ProductData {
  id: number; name: string; slug: string; brand?: string;
  price: number; compare_price?: number; description?: string;
  short_description?: string; stock: number;
  avg_rating: number; review_count: number;
  images: { url: string; is_primary: boolean }[];
}
interface PlaceholderData {
  title?: string; description?: string;
  images?: string[]; price?: number; compare_price?: number;
}
interface FeaturedProductData {
  product_id?: number; product?: ProductData;
  badge?: string; tag?: string;
  override_title?: string; override_description?: string;
  placeholder?: PlaceholderData;
}
interface Props { data?: FeaturedProductData; }

export default function FeaturedProduct({ data }: Props) {
  // ── ALL hooks unconditionally at the top ─────────────────────────────────
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [selImg,    setSelImg]    = useState(0);
  const [adding,    setAdding]    = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  const product = data?.product ?? null;
  const ph      = data?.placeholder ?? null;

  // productId must be stable — 0 when no product yet (hook always called)
  const productId  = product?.id ?? 0;
  const cartEntry  = useCartItem(productId, null);
  const { addToCart, updateQty, removeFromCart } = useCartActions();

  const inCart     = cartEntry !== null;
  const outOfStock = (product?.stock ?? 0) === 0;
  const stock      = product?.stock ?? 999;

  const images: { url: string }[] = useMemo(() => {
    if (product?.images?.length) return product.images;
    if (ph?.images?.length)      return ph.images.map((url) => ({ url }));
    return [];
  }, [product, ph]);

  const badge        = data?.badge || "Speed · Comfort · Precision";
  const title        = data?.override_title       || product?.name              || ph?.title        || "Featured Product";
  const description  = data?.override_description || product?.short_description || ph?.description  || "";
  const price        = product?.price        ?? ph?.price        ?? 0;
  const comparePrice = product?.compare_price ?? ph?.compare_price;
  const discount     = getDiscountPercent(price, comparePrice);
  const brand        = product?.brand;
  const rating       = product?.avg_rating   ?? 0;
  const reviewCount  = product?.review_count ?? 0;
  const isPlaceholder = !product;

  const handleAdd = useCallback(async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!product)          { toast("Set a product via Admin → Homepage → Featured Product"); return; }
    if (!isAuthenticated)  { router.push("/auth/login"); return; }
    if (outOfStock || adding) return;
    setAdding(true);
    await addToCart(productId, null, 1);
    setAdding(false);
  }, [product, isAuthenticated, outOfStock, adding, addToCart, productId, router]);

  const handleBuyNow = useCallback(async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!product)         return;
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    if (outOfStock || buyingNow) return;
    setBuyingNow(true);
    try {
      if (!inCart) await addToCart(productId, null, 1);
      router.push("/checkout");
    } finally {
      setBuyingNow(false);
    }
  }, [product, isAuthenticated, outOfStock, buyingNow, inCart, addToCart, productId, router]);

  const handleIncrease = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!cartEntry || cartEntry.quantity >= stock) return;
    await updateQty(productId, null, cartEntry.cartItemId, cartEntry.quantity, cartEntry.quantity + 1);
  }, [cartEntry, productId, stock, updateQty]);

  const handleDecrease = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!cartEntry) return;
    if (cartEntry.quantity <= 1) {
      await removeFromCart(productId, null, cartEntry.cartItemId, cartEntry.quantity);
    } else {
      await updateQty(productId, null, cartEntry.cartItemId, cartEntry.quantity, cartEntry.quantity - 1);
    }
  }, [cartEntry, productId, updateQty, removeFromCart]);

  // ── Early return AFTER all hooks ─────────────────────────────────────────
  if (!product && !ph) return null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-10">
          <span className="inline-block text-xs font-black text-brand-600 uppercase tracking-[0.2em] mb-2">{badge}</span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
            <em className="not-italic italic">Crafted for Champions</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* ── Image gallery ─────────────────────────────────────── */}
          <div>
            {/* FIX: bg-gray-50 → covered by global; nav buttons bg-white/80 → dark variant */}
            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-3">
              {images[selImg]?.url ? (
                <Image src={images[selImg].url} alt={title} fill className="object-contain p-8" priority />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-9xl opacity-20">🏆</div>
              )}
              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full">
                  {discount}% OFF
                </span>
              )}
              {inCart && cartEntry && (
                <span className="absolute top-4 right-4 bg-brand-600 text-white text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                  <Check size={12} strokeWidth={3} /> In Cart ({cartEntry.quantity})
                </span>
              )}
              {images.length > 1 && (
                <>
                  {/* FIX: bg-white/80 → dark:bg-black/60 */}
                  <button onClick={() => setSelImg((p) => (p - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white dark:bg-black/60 dark:hover:bg-black/80 dark:text-white rounded-full flex items-center justify-center shadow-md">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setSelImg((p) => (p + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white dark:bg-black/60 dark:hover:bg-black/80 dark:text-white rounded-full flex items-center justify-center shadow-md">
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

          {/* ── Product info ──────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}>

            {brand && <p className="text-xs font-black text-brand-600 uppercase tracking-widest mb-2">{brand}</p>}
            <h3 className="text-3xl font-black text-gray-900 mb-3">{title}</h3>

            {reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14}
                      className={i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} />
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
                  : <span className="text-red-500 font-semibold">✗ Out of Stock</span>
                }
              </p>
            )}

            {/* ── Cart Controls ───────────────────────────────────── */}
            <AnimatePresence mode="wait" initial={false}>
              {inCart && cartEntry ? (
                <motion.div key="in-cart"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                      <Check size={14} strokeWidth={3} /> In your cart
                    </span>
                    <button
                      onClick={(e) => { e.preventDefault(); removeFromCart(productId, null, cartEntry.cartItemId, cartEntry.quantity); }}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors underline underline-offset-2">
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    {/* FIX: hover:bg-brand-50 → dark:hover:bg-brand-900/40 */}
                    <div className="flex items-center border-2 border-brand-600 rounded-xl overflow-hidden">
                      <button onClick={handleDecrease}
                        className="w-12 h-12 flex items-center justify-center hover:bg-brand-50 dark:hover:bg-brand-900/40 transition-colors text-brand-600">
                        <Minus size={16} />
                      </button>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span key={cartEntry.quantity}
                          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.12 }}
                          className="w-14 text-center text-xl font-black text-brand-600">
                          {cartEntry.quantity}
                        </motion.span>
                      </AnimatePresence>
                      <button onClick={handleIncrease} disabled={cartEntry.quantity >= stock}
                        className="w-12 h-12 flex items-center justify-center hover:bg-brand-50 dark:hover:bg-brand-900/40 transition-colors text-brand-600 disabled:opacity-40">
                        <Plus size={16} />
                      </button>
                    </div>
                    <span className="text-sm text-gray-500 font-medium">{stock} in stock</span>
                  </div>
                  <button onClick={handleBuyNow} disabled={buyingNow}
                    className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-black py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-brand-500/30">
                    {buyingNow ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap size={18} />}
                    {buyingNow ? "Processing…" : "Checkout Now"}
                  </button>
                </motion.div>
              ) : (
                <motion.div key="not-in-cart"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="flex gap-3 mb-4">
                  {/* FIX: bg-black hover:bg-gray-800 → dark:bg-white dark:text-black dark:hover:bg-gray-100 */}
                  <button onClick={handleAdd} disabled={adding || outOfStock}
                    className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 text-white font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50">
                    {adding ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <ShoppingCart size={18} />}
                    {adding ? "Adding…" : outOfStock ? "Out of Stock" : "Add to Cart"}
                  </button>
                  <button onClick={handleBuyNow} disabled={buyingNow || outOfStock}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50">
                    {buyingNow ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap size={18} />}
                    {buyingNow ? "Processing…" : "Buy Now"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {inCart && (
              <Link href="/cart"
                className="flex items-center justify-center gap-2 border-2 border-brand-600 text-brand-600 font-bold py-3 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/40 transition-colors">
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
