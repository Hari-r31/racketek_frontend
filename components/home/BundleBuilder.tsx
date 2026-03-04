"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart, Plus, Minus, Trash2, ArrowRight,
  Tag, Percent, TrendingDown, Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice, getDiscountPercent } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/uiStore";
import api from "@/lib/api";
import toast from "react-hot-toast";

// ── Types ──────────────────────────────────────────────────────────────────

interface ProductData {
  id: number; name: string; slug: string; brand?: string;
  price: number; compare_price?: number; stock: number; avg_rating: number;
  primary_image?: string;
  images?: { url: string; is_primary: boolean }[];
}

interface BundleBuilderData {
  heading?: string;
  heading_italic?: string;
  subtext?: string;
  trust_badges?: string[];
  products?: ProductData[];
  min_items?: number;
  discount_label?: string;
  /** % discount per item unit selected (default 5) */
  bundle_discount_per_item?: number;
  /** Maximum discount cap in % (default 50) */
  bundle_discount_max_cap?: number;
}

interface BundlePricing {
  subtotal: number;
  item_count: number;
  discount_percent: number;
  discount_amount: number;
  final_price: number;
}

interface Props { data?: BundleBuilderData; }

// ── Component ──────────────────────────────────────────────────────────────

export default function BundleBuilder({ data }: Props) {
  const { isAuthenticated } = useAuthStore();
  const { increment } = useCartStore();

  // ── Selection state ────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Map<number, number>>(new Map());
  const [adding, setAdding]     = useState(false);

  // ── Pricing state (real-time, bundle-only) ─────────────────────────────
  const [pricing, setPricing] = useState<BundlePricing>({
    subtotal: 0, item_count: 0,
    discount_percent: 0, discount_amount: 0, final_price: 0,
  });

  // ── Derive settings from section data ─────────────────────────────────
  const heading        = data?.heading              || "Build your";
  const headingItalic  = data?.heading_italic        || "Bundle";
  const subtext        = data?.subtext              || "Select any combination from our range of products.";
  const badges         = data?.trust_badges         || ["Fast Shipping", "Authentic Products", "Best Prices"];
  const minItems       = data?.min_items            || 2;
  const discountLabel  = data?.discount_label       || "Save Extra";
  const perItemPct     = data?.bundle_discount_per_item ?? 5;
  const maxCapPct      = data?.bundle_discount_max_cap  ?? 50;
  const products       = data?.products             || [];



  // ── Real-time pricing recalculation ───────────────────────────────────
  // Pure client-side: mirrors the backend formula exactly so no latency.
  // The backend /bundle/calculate endpoint is an optional validation layer.
  const recalculate = useCallback(
    (nextSelected: Map<number, number>) => {
      let subtotal   = 0;
      let itemCount  = 0;

      for (const [id, qty] of nextSelected.entries()) {
        const p = products.find((p) => p.id === id);
        if (!p) continue;
        subtotal  += p.price * qty;
        itemCount += qty;
      }

      const discountPercent = perItemPct * itemCount;
      const cappedPercent   = Math.min(discountPercent, maxCapPct);
      const discountAmount  = parseFloat((subtotal * cappedPercent / 100).toFixed(2));
      const finalPrice      = parseFloat((subtotal - discountAmount).toFixed(2));

      setPricing({
        subtotal:         parseFloat(subtotal.toFixed(2)),
        item_count:       itemCount,
        discount_percent: cappedPercent,
        discount_amount:  discountAmount,
        final_price:      Math.max(finalPrice, 0),
      });
    },
    [products, perItemPct, maxCapPct],
  );

  // Recalculate on every selection change
  useEffect(() => {
    recalculate(selected);
  }, [selected, recalculate]);

  // ── Item actions ───────────────────────────────────────────────────────
  const toggle = (productId: number) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(productId)) next.delete(productId);
      else next.set(productId, 1);
      return next;
    });
  };

  const changeQty = (productId: number, delta: number) => {
    setSelected((prev) => {
      const next = new Map(prev);
      const cur  = next.get(productId) ?? 0;
      const nxt  = cur + delta;
      if (nxt <= 0) next.delete(productId);
      else next.set(productId, nxt);
      return next;
    });
  };

  // ── Add all to cart ────────────────────────────────────────────────────
  const addAllToCart = async () => {
    if (!isAuthenticated) { toast.error("Please login to add to cart"); return; }
    if (pricing.item_count < minItems) {
      toast.error(`Add at least ${minItems} products to proceed`);
      return;
    }
    setAdding(true);
    try {
      await Promise.all(
        Array.from(selected.entries()).map(([product_id, quantity]) =>
          api.post("/cart/items", { product_id, quantity })
        )
      );
      increment(pricing.item_count);
      toast.success(`${pricing.item_count} items added to cart!`);
      setSelected(new Map());
    } catch {
      toast.error("Failed to add items");
    } finally {
      setAdding(false);
    }
  };

  const getImg = (p: ProductData) =>
    p.primary_image || p.images?.find((i) => i.is_primary)?.url || p.images?.[0]?.url || "";

  const hasDiscount       = pricing.discount_percent > 0;
  const isBundleReady     = pricing.item_count >= minItems;
  const isCapHit          = pricing.discount_percent >= maxCapPct;

  if (!products.length) return null;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── Left: header + product grid ─────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <p className="text-xs font-black text-brand-600 uppercase tracking-widest mb-1">
                Customize
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
                {heading} <em className="not-italic italic">{headingItalic}</em>
              </h2>
              <p className="text-gray-500 mt-2 text-sm max-w-lg">{subtext}</p>

              {/* Discount-rate hint */}
              <p className="text-xs text-brand-600 font-semibold mt-3">
                🎁 Get {perItemPct}% off per item — up to {maxCapPct}% total!
              </p>
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((p) => {
                const qty        = selected.get(p.id) ?? 0;
                const isSelected = qty > 0;
                const img        = getImg(p);
                const discount   = getDiscountPercent(p.price, p.compare_price);
                return (
                  <motion.div key={p.id} whileHover={{ y: -2 }} className="relative">
                    <div
                      onClick={() => toggle(p.id)}
                      className={`cursor-pointer rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
                        isSelected
                          ? "border-brand-600 shadow-lg shadow-brand-100"
                          : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <div className="relative aspect-square bg-gray-50">
                        {img
                          ? <Image src={img} alt={p.name} fill className="object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🏆</div>}
                        {discount > 0 && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            {discount}% OFF
                          </span>
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-black">{qty}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        {p.brand && (
                          <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-0.5">
                            {p.brand}
                          </p>
                        )}
                        <p className="text-xs font-bold text-gray-800 line-clamp-2 mb-1">{p.name}</p>
                        <p className="font-black text-gray-900 text-sm">{formatPrice(p.price)}</p>
                      </div>
                    </div>

                    {/* Qty stepper */}
                    {isSelected && (
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center bg-white border border-brand-200 rounded-full shadow-md overflow-hidden z-10">
                        <button
                          onClick={() => changeQty(p.id, -1)}
                          className="w-7 h-7 flex items-center justify-center text-brand-600 hover:bg-brand-50"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-black px-2 text-gray-900">{qty}</span>
                        <button
                          onClick={() => changeQty(p.id, 1)}
                          className="w-7 h-7 flex items-center justify-center text-brand-600 hover:bg-brand-50"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ── Right: sticky bundle cart panel ─────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-gray-50 rounded-2xl border border-gray-200 p-6">

              {/* Discount badge */}
              {isBundleReady && (
                <span className="inline-flex items-center gap-1.5 bg-brand-600 text-white text-xs font-black px-3 py-1.5 rounded-full mb-4">
                  <Tag size={10} /> {discountLabel}
                  {hasDiscount && ` · ${pricing.discount_percent}% OFF`}
                  {isCapHit && " (Max)"}
                </span>
              )}

              <h3 className="font-black text-gray-900 mb-1">Your Bundle</h3>
              <p className="text-xs text-gray-500 mb-4">
                Add at least {minItems} products to unlock discounts.
              </p>

              {/* Selected items list */}
              <div className="space-y-2 max-h-48 overflow-y-auto mb-4 min-h-[60px]">
                <AnimatePresence>
                  {Array.from(selected.entries()).map(([id, qty]) => {
                    const p = products.find((p) => p.id === id);
                    if (!p) return null;
                    return (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-2 bg-white rounded-xl p-2 border border-gray-100"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                          {getImg(p) && (
                            <Image src={getImg(p)} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">{p.name}</p>
                          <p className="text-xs text-gray-500">{qty} × {formatPrice(p.price)}</p>
                        </div>
                        <button
                          onClick={() => toggle(id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </motion.div>
                    );
                  })}
                  {pricing.item_count === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">
                      Select products from the list
                    </p>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Pricing breakdown (always visible, updates instantly) ── */}
              <div className="bg-white rounded-xl border border-gray-100 p-3 mb-4 space-y-2">

                {/* Items selected */}
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                    <Package size={12} className="text-gray-400" />
                    Items Selected
                  </span>
                  <span className="font-bold text-gray-800">{pricing.item_count}</span>
                </div>

                {/* Subtotal */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="font-bold text-gray-800">
                    {pricing.subtotal > 0 ? formatPrice(pricing.subtotal) : "₹0.00"}
                  </span>
                </div>

                {/* Discount % */}
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-brand-600">
                    <Percent size={12} />
                    Bundle Discount
                    {isCapHit && (
                      <span className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded-full font-black">
                        MAX
                      </span>
                    )}
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={pricing.discount_percent}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="font-black text-brand-600"
                    >
                      {pricing.discount_percent > 0 ? `${pricing.discount_percent}%` : "—"}
                    </motion.span>
                  </AnimatePresence>
                </div>

                {/* Amount saved */}
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-green-600">
                    <TrendingDown size={12} />
                    Amount Saved
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={pricing.discount_amount}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="font-black text-green-600"
                    >
                      {pricing.discount_amount > 0 ? `−${formatPrice(pricing.discount_amount)}` : "—"}
                    </motion.span>
                  </AnimatePresence>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-100 pt-2 mt-1 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700">Final Total</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={pricing.final_price}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="text-xl font-black text-gray-900"
                    >
                      {pricing.final_price > 0 ? formatPrice(pricing.final_price) : "₹0.00"}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>

              {/* Progress hint — how far to next discount step */}
              {pricing.item_count > 0 && !isCapHit && (
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>{pricing.discount_percent}% discount applied</span>
                    <span>{maxCapPct}% max</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-brand-600 rounded-full"
                      animate={{ width: `${Math.min((pricing.discount_percent / maxCapPct) * 100, 100)}%` }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  </div>
                </div>
              )}

              {/* Add to cart CTA */}
              <button
                onClick={addAllToCart}
                disabled={adding || pricing.item_count < minItems}
                className="w-full flex items-center justify-center gap-2 bg-black text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition-all disabled:opacity-40"
              >
                <ShoppingCart size={16} />
                {adding ? "Adding…" : `Add ${pricing.item_count || ""} to Cart`}
              </button>

              {isBundleReady && (
                <Link
                  href="/cart"
                  className="flex items-center justify-center gap-1 text-xs text-brand-600 hover:text-brand-700 mt-3 font-bold transition-colors"
                >
                  Go to Cart <ArrowRight size={11} />
                </Link>
              )}

              {/* Trust badges */}
              <div className="flex flex-col gap-1.5 mt-4 pt-4 border-t border-gray-200">
                {badges.map((b) => (
                  <p key={b} className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-brand-600 rounded-full shrink-0" />
                    {b}
                  </p>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
