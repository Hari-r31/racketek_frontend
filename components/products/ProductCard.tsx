"use client";
/**
 * ProductCard
 * ============
 * Cart state is driven entirely by the global cartItemsStore via:
 *   useCartItem()    — reactive selector for this product's cart entry
 *   useCartActions() — add / updateQty / removeFromCart
 *
 * No local cart state. No duplicated logic.
 *
 * "Buy Now" reuses addToCart then navigates to /checkout.
 * If the item is already in cart it skips the add call entirely —
 * no double state updates, no duplicate API calls.
 */
import Link    from "next/link";
import Image   from "next/image";
import { useRouter }   from "next/navigation";
import { memo, useCallback, useState } from "react";
import { Heart, ShoppingCart, Star, Plus, Minus, Check, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product }    from "@/types";
import { formatPrice, getDiscountPercent } from "@/lib/utils";
import { useAuthStore }    from "@/store/authStore";
import { useWishlistStore } from "@/store/uiStore";
import { useCartItem, useCartActions } from "@/lib/useCart";
import { useQueryClient }  from "@tanstack/react-query";
import toast from "react-hot-toast";

interface Props {
  product: Product;
  priority?: boolean;
}

function ProductCard({ product, priority = false }: Props) {
  const { isAuthenticated }               = useAuthStore();
  const { has, add: wlAdd, remove: wlRm } = useWishlistStore();
  const qc     = useQueryClient();
  const router = useRouter();

  const wishlisted = has(product.id);
  const outOfStock = product.stock === 0;

  // ── Cart state — zero local state, driven by the global store ──────
  const cartEntry = useCartItem(product.id, null);
  const { addToCart, updateQty, removeFromCart } = useCartActions();

  const [adding,    setAdding]    = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  const primaryImage = product.images?.find((i) => i.is_primary) || product.images?.[0];
  const discount     = getDiscountPercent(product.price, product.compare_price);

  // ── Add to cart ─────────────────────────────────────────────────────
  const handleAdd = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/auth/login?next=${encodeURIComponent(window.location.href)}`);
      return;
    }
    if (outOfStock || adding) return;

    setAdding(true);
    await addToCart(product.id, null, 1);
    setAdding(false);
  }, [isAuthenticated, outOfStock, adding, addToCart, product.id, router]);

  // ── Buy Now ─────────────────────────────────────────────────────────
  // Rule: add exactly 1 unit IF the product is not already in cart,
  // then navigate to /checkout.  Never adds if already in cart to avoid
  // duplicate state updates.  Works for both logged-in and guest users
  // (guests are sent to login with next=/checkout).
  const handleBuyNow = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/auth/login?next=${encodeURIComponent("/checkout")}`);
      return;
    }
    if (outOfStock || buyingNow) return;

    setBuyingNow(true);
    try {
      if (!cartEntry) {
        // Not in cart yet — add 1 unit using the shared addToCart action.
        // This updates both the Zustand store and the React-Query cache
        // in exactly the same way as "Add to Cart" — zero logic duplication.
        await addToCart(product.id, null, 1);
      }
      // cartEntry already exists → the item is already in cart, no add needed
      router.push("/checkout");
    } finally {
      setBuyingNow(false);
    }
  }, [isAuthenticated, outOfStock, buyingNow, cartEntry, addToCart, product.id, router]);

  // ── Increase qty ────────────────────────────────────────────────────
  const handleIncrease = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!cartEntry || cartEntry.quantity >= product.stock) return;
    await updateQty(
      product.id, null,
      cartEntry.cartItemId,
      cartEntry.quantity,
      cartEntry.quantity + 1,
    );
  }, [cartEntry, product.id, product.stock, updateQty]);

  // ── Decrease qty ────────────────────────────────────────────────────
  const handleDecrease = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!cartEntry) return;

    if (cartEntry.quantity <= 1) {
      await removeFromCart(product.id, null, cartEntry.cartItemId, cartEntry.quantity);
    } else {
      await updateQty(
        product.id, null,
        cartEntry.cartItemId,
        cartEntry.quantity,
        cartEntry.quantity - 1,
      );
    }
  }, [cartEntry, product.id, removeFromCart, updateQty]);

  // ── Wishlist ────────────────────────────────────────────────────────
  const [wlBusy, setWlBusy] = useState(false);
  const handleWishlist = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/auth/login?next=${encodeURIComponent(window.location.href)}`);
      return;
    }
    if (wlBusy) return;
    setWlBusy(true);
    const was = wishlisted;
    was ? wlRm(product.id) : wlAdd(product.id);
    try {
      was
        ? await api_delete(`/wishlist/${product.id}`)
        : await api_post(`/wishlist/${product.id}`);
      toast.success(was ? "Removed from wishlist" : "Added to wishlist!");
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    } catch {
      was ? wlAdd(product.id) : wlRm(product.id);
      toast.error("Action failed");
    } finally {
      setWlBusy(false);
    }
  }, [isAuthenticated, wlBusy, wishlisted, product.id, wlAdd, wlRm, qc, router]);

  const inCart = cartEntry !== null;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link href={`/products/${product.slug}`} className="group block">
        <div className="card overflow-hidden dark:bg-gray-800 dark:border-gray-700">

          {/* Image */}
          <div className="relative aspect-square bg-gray-50 dark:bg-gray-700 product-image-container overflow-hidden">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt_text || product.name}
                fill priority={priority}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                className="object-cover product-image"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <span className="text-5xl">🏆</span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {discount > 0 && <span className="badge bg-red-500 text-white">{discount}% OFF</span>}
              {product.is_best_seller && <span className="badge bg-brand-600 text-white">Best Seller</span>}
              {outOfStock && <span className="badge bg-gray-800 text-white">Out of Stock</span>}
            </div>

            {/* Wishlist */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.button
                onClick={handleWishlist}
                whileTap={{ scale: 0.85 }}
                disabled={wlBusy}
                className="w-8 h-8 bg-gray-100 dark:bg-[rgb(var(--surface-3))] rounded-full flex items-center justify-center shadow-md hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={wishlisted ? "filled" : "empty"}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  >
                    <Heart
                      size={14}
                      className={wishlisted ? "text-red-500 fill-red-500" : "text-gray-500 dark:text-gray-300"}
                    />
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          {/* Info */}
          <div className="p-3 sm:p-4">
            {product.brand && (
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide mb-1">
                {product.brand}
              </p>
            )}
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 mb-2 group-hover:text-brand-600 transition-colors">
              {product.name}
            </h3>

            {product.review_count > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{product.avg_rating.toFixed(1)}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">({product.review_count})</span>
              </div>
            )}

            <div className="flex items-center gap-2 mb-3">
              <span className="font-black text-gray-900 dark:text-white">{formatPrice(product.price)}</span>
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-xs text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
              )}
            </div>

            {/* ── Cart control ─────────────────────────────────────────── */}
            <AnimatePresence mode="wait" initial={false}>

              {/* Qty stepper — shown when product is already in cart */}
              {inCart ? (
                <motion.div
                  key="stepper"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center rounded-xl overflow-hidden border-2 border-brand-600"
                  onClick={(e) => e.preventDefault()}
                >
                  <button
                    onClick={handleDecrease}
                    className="flex-1 h-9 flex items-center justify-center text-brand-600 hover:bg-brand-50 active:bg-brand-100 transition-colors font-bold"
                  >
                    <Minus size={14} />
                  </button>
                  <div className="px-3 h-9 flex items-center justify-center min-w-[36px] bg-brand-600">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={cartEntry.quantity}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.12 }}
                        className="text-sm font-black text-white tabular-nums"
                      >
                        {cartEntry.quantity}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <button
                    onClick={handleIncrease}
                    disabled={cartEntry.quantity >= product.stock}
                    className="flex-1 h-9 flex items-center justify-center text-brand-600 hover:bg-brand-50 active:bg-brand-100 transition-colors disabled:opacity-30"
                  >
                    <Plus size={14} />
                  </button>
                </motion.div>

              ) : (
                /* Add to cart button */
                <motion.button
                  key="add"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={handleAdd}
                  disabled={adding || outOfStock}
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {adding ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ShoppingCart size={13} />
                  )}
                  {adding ? "Adding…" : outOfStock ? "Out of Stock" : "Add to Cart"}
                </motion.button>
              )}
            </AnimatePresence>

            {/* In-cart hint */}
            {inCart && (
              <p className="flex items-center justify-center gap-1 text-[10px] text-brand-600 font-semibold mt-1.5">
                <Check size={10} /> {cartEntry.quantity} in cart
              </p>
            )}

            {/* ── Buy Now button ─────────────────────────────────────── */}
            {/* Shown only when product is in stock, regardless of cart state.
                Always uses the same addToCart action — no duplicated logic. */}
            {!outOfStock && (
              <motion.button
                onClick={handleBuyNow}
                disabled={buyingNow}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center justify-center gap-1.5 mt-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-colors disabled:opacity-50"
              >
                {buyingNow ? (
                  <span className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap size={11} className="text-brand-600" />
                )}
                {buyingNow
                  ? "Processing…"
                  : inCart
                    ? "Checkout Now"
                    : "Buy Now"}
              </motion.button>
            )}

          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// Wishlist helpers — lazy-loaded to keep the initial bundle small
async function api_post(url: string) {
  const { default: api } = await import("@/lib/api");
  return api.post(url);
}
async function api_delete(url: string) {
  const { default: api } = await import("@/lib/api");
  return api.delete(url);
}

export default memo(ProductCard);
