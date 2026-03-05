"use client";
/**
 * ProductDetailPage
 * =================
 * Cart state is driven entirely by:
 *   useCartItem(product.id, variantId)  — is it in cart? what qty?
 *   useCartActions()                    — add / updateQty / removeFromCart
 *
 * On page load CartInitializer (in StoreLayout) has already seeded the
 * cartItemsStore, so `cartEntry` is non-null immediately if the product
 * is in the user's cart — no extra fetch needed.
 */
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState, useCallback } from "react";
import {
  ShoppingCart, Heart, Star, Truck, RotateCcw, ShieldCheck,
  ChevronRight, Minus, Plus, Share2, Zap, Check,
  Package, BadgeCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { Product } from "@/types";
import { formatPrice, getDiscountPercent } from "@/lib/utils";
import { useAuthStore }     from "@/store/authStore";
import { useCartItem, useCartActions } from "@/lib/useCart";
import toast from "react-hot-toast";
import ProductCard   from "@/components/products/ProductCard";
import ReviewSection from "@/components/products/ReviewSection";

export default function ProductDetailPage() {
  const { slug }            = useParams<{ slug: string }>();
  const router              = useRouter();
  const { isAuthenticated } = useAuthStore();

  // ── Local UI state ────────────────────────────────────────────────
  const [img,        setImg]        = useState(0);
  const [variantId,  setVariantId]  = useState<number | null>(null);
  const [addQty,     setAddQty]     = useState(1);   // qty to add (only used when NOT in cart)
  const [wishlisted, setWishlisted] = useState(false);
  const [buyNow,     setBuyNow]     = useState(false);
  const [tabOpen,    setTabOpen]    = useState("description");

  // ── Server data ───────────────────────────────────────────────────
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["product", slug],
    queryFn: () => api.get(`/products/${slug}`).then((r) => r.data),
  });

  const { data: similar } = useQuery<any[]>({
    queryKey: ["similar", product?.id],
    queryFn: () => api.get(`/ai/recommend/${product?.id}`).then((r) => r.data.recommendations),
    enabled: !!product?.id,
  });

  // ── Cart state — SINGLE SOURCE OF TRUTH ──────────────────────────
  // cartEntry is non-null the moment the product is in the cart.
  // CartInitializer already ran on layout mount, so this is instant.
  const cartEntry = useCartItem(product?.id ?? 0, variantId);
  const { addToCart, updateQty, removeFromCart } = useCartActions();
  const inCart = cartEntry !== null;

  // ── Stable primitives — must be before any early return so hooks run unconditionally ──
  const productId    = product?.id ?? 0;
  const productStock = product?.stock ?? 0;

  // ── Cart action handlers (hooks must not be after conditional returns) ──
  const handleAddToCart = useCallback(async () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    await addToCart(productId, variantId, addQty);
    toast.success(`${addQty} item${addQty > 1 ? "s" : ""} added to cart!`);
  }, [isAuthenticated, productId, variantId, addQty, addToCart, router]);

  const handleIncrease = useCallback(async () => {
    if (!cartEntry || cartEntry.quantity >= productStock) return;
    await updateQty(
      productId, variantId,
      cartEntry.cartItemId,
      cartEntry.quantity,
      cartEntry.quantity + 1,
    );
  }, [cartEntry, productId, productStock, variantId, updateQty]);

  const handleDecrease = useCallback(async () => {
    if (!cartEntry) return;
    if (cartEntry.quantity <= 1) {
      await removeFromCart(productId, variantId, cartEntry.cartItemId, cartEntry.quantity);
    } else {
      await updateQty(
        productId, variantId,
        cartEntry.cartItemId,
        cartEntry.quantity,
        cartEntry.quantity - 1,
      );
    }
  }, [cartEntry, productId, variantId, updateQty, removeFromCart]);

  const handleBuyNow = useCallback(async () => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    setBuyNow(true);
    try {
      if (!inCart) {
        await addToCart(productId, variantId, addQty);
      }
      router.push("/checkout");
    } catch {
      toast.error("Failed");
      setBuyNow(false);
    }
  }, [isAuthenticated, inCart, productId, variantId, addQty, addToCart, router]);

  // ── Loading skeleton ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
          <div className="space-y-3">
            <div className="aspect-square bg-gray-100 rounded-2xl" />
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => <div key={i} className="w-16 h-16 bg-gray-100 rounded-xl" />)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-8 bg-gray-100 rounded w-3/4" />
            <div className="h-6 bg-gray-100 rounded w-1/3" />
            {[...Array(6)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!product) return (
    <div className="text-center py-32">
      <p className="text-6xl mb-6">🏸</p>
      <h1 className="text-2xl font-black text-gray-900 mb-3">Product not found</h1>
      <Link href="/products" className="btn-primary inline-block">Browse Products</Link>
    </div>
  );

  const discount    = getDiscountPercent(product.price, product.compare_price);
  const images      = product.images?.length ? product.images : [];
  const isReturnable = product.is_returnable === true;
  const returnDays   = product.return_window_days ?? 0;

  const varGroups = product.variants?.reduce((acc, v) => {
    if (!acc[v.name]) acc[v.name] = [];
    acc[v.name].push(v);
    return acc;
  }, {} as Record<string, typeof product.variants>);

  const selectedVar = product.variants?.find((v) => v.id === variantId);
  const finalPrice  = product.price + (selectedVar?.price_modifier ?? 0);

  async function toggleWishlist() {
    if (!isAuthenticated) { toast.error("Please login"); return; }
    if (!product) return;
    try {
      if (wishlisted) {
        await api.delete(`/wishlist/${product.id}`);
        setWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        await api.post(`/wishlist/${product.id}`);
        setWishlisted(true);
        toast.success("Added to wishlist!");
      }
    } catch { toast.error("Action failed"); }
  }

  const TABS = [
    { id: "description", label: "Description" },
    { id: "specs",       label: "Specifications" },
    { id: "shipping",    label: "Shipping & Returns" },
  ];

  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
            <Link href="/" className="hover:text-brand-600 transition-colors">Home</Link>
            <ChevronRight size={11} />
            <Link href="/products" className="hover:text-brand-600 transition-colors">Products</Link>
            {product.brand && (
              <><ChevronRight size={11} /><Link href={`/products?brand=${encodeURIComponent(product.brand)}`} className="hover:text-brand-600 transition-colors">{product.brand}</Link></>
            )}
            <ChevronRight size={11} />
            <span className="text-gray-800 font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

          {/* ── Left: Image gallery ──────────────────────────────────── */}
          <div className="space-y-3">
            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden cursor-zoom-in border border-gray-100 product-image-container">
              {images[img] ? (
                <Image src={images[img].url} alt={images[img].alt_text || product.name} fill
                  className="object-contain product-image" priority sizes="(max-width: 1024px) 100vw, 50vw" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">🏸</div>
              )}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {discount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow">{discount}% OFF</span>
                )}
                {product.is_best_seller && (
                  <span className="bg-brand-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow">Best Seller</span>
                )}
              </div>
              <button onClick={toggleWishlist}
                className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md border transition-all ${
                  wishlisted ? "bg-red-500 border-red-500" : "bg-white border-gray-200 hover:border-red-300"
                }`}>
                <Heart size={16} className={wishlisted ? "text-white fill-white" : "text-gray-500"} />
              </button>
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {images.map((image, i) => (
                  <button key={image.id} onClick={() => setImg(i)}
                    className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      img === i ? "border-brand-600 shadow-sm" : "border-gray-100 hover:border-gray-300"
                    }`}>
                    <Image src={image.url} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { icon: Truck,       title: "Free Delivery",  sub: "Orders ₹999+" },
                { icon: RotateCcw,   title: isReturnable ? `${returnDays}-Day Returns` : "Replacement Available",  sub: isReturnable ? "Conditions apply" : "No returns" },
                { icon: ShieldCheck, title: "100% Genuine",   sub: "Certified" },
              ].map(({ icon: Icon, title, sub }) => (
                <div key={title} className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <Icon size={17} className="text-brand-600" />
                  <p className="text-[11px] font-bold text-gray-800 text-center">{title}</p>
                  <p className="text-[10px] text-gray-500 text-center">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Product info ──────────────────────────────────── */}
          <div>
            {product.brand && (
              <Link href={`/products?brand=${encodeURIComponent(product.brand)}`}
                className="inline-flex items-center gap-1.5 text-xs font-black text-brand-600 uppercase tracking-widest mb-3 hover:text-brand-700 transition-colors">
                <BadgeCheck size={13} />{product.brand}
              </Link>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-4">{product.name}</h1>

            {product.review_count > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14}
                      className={i < Math.round(product.avg_rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-800">{product.avg_rating.toFixed(1)}</span>
                <span className="text-sm text-gray-400">({product.review_count} reviews)</span>
                <span className="text-sm text-gray-400">·</span>
                <span className="text-sm font-semibold text-green-600">{product.sold_count}+ sold</span>
              </div>
            )}

            <div className="flex items-end gap-3 mb-5 pb-5 border-b border-gray-100">
              <span className="text-4xl font-black text-gray-900">{formatPrice(finalPrice)}</span>
              {product.compare_price && product.compare_price > product.price && (
                <div className="flex items-center gap-2 pb-1">
                  <span className="text-lg text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
                  <span className="text-sm font-black text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                    Save {formatPrice(product.compare_price - product.price)}
                  </span>
                </div>
              )}
            </div>

            {product.short_description && (
              <p className="text-gray-600 text-sm leading-relaxed mb-5">{product.short_description}</p>
            )}

            {/* Variants */}
            {Object.entries(varGroups).map(([name, variants]) => (
              <div key={name} className="mb-5">
                <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-2">
                  {name} {selectedVar?.value && <span className="normal-case text-brand-600 font-bold">— {selectedVar.value}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const sel = variantId === v.id;
                    const oos = !v.is_active || v.stock === 0;
                    return (
                      <button key={v.id} onClick={() => !oos && setVariantId(v.id)} disabled={oos}
                        className={`relative px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                          sel ? "border-brand-600 bg-brand-600 text-white shadow-md" :
                          oos ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through" :
                          "border-gray-200 text-gray-700 hover:border-brand-400"
                        }`}>
                        {v.value}
                        {sel && <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center"><Check size={9} className="text-white" /></span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* ── Cart CTA section — switches based on cart state ─────── */}
            <div className="mb-6">
              <AnimatePresence mode="wait" initial={false}>

                {/* ── Already in cart: show qty stepper ──────────────── */}
                {inCart ? (
                  <motion.div
                    key="in-cart"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* In-cart badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                        <Check size={14} strokeWidth={3} />
                        In your cart
                      </span>
                      <button
                        onClick={() => removeFromCart(product.id, variantId, cartEntry.cartItemId, cartEntry.quantity)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors underline underline-offset-2"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Qty stepper — controls the cart directly */}
                    <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-2">Quantity in cart</p>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="flex items-center border-2 border-brand-600 rounded-xl overflow-hidden">
                        <button onClick={handleDecrease}
                          className="w-11 h-11 flex items-center justify-center hover:bg-brand-50 transition-colors text-brand-600">
                          <Minus size={16} />
                        </button>
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={cartEntry.quantity}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.12 }}
                            className="w-12 text-center text-lg font-black text-brand-600"
                          >
                            {cartEntry.quantity}
                          </motion.span>
                        </AnimatePresence>
                        <button onClick={handleIncrease} disabled={cartEntry.quantity >= product.stock}
                          className="w-11 h-11 flex items-center justify-center hover:bg-brand-50 transition-colors text-brand-600 disabled:opacity-40">
                          <Plus size={16} />
                        </button>
                      </div>
                      <span className={`text-sm font-semibold ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                        {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                      </span>
                    </div>

                    {/* Buy Now (still useful even when in cart) */}
                    <button onClick={handleBuyNow} disabled={buyNow}
                      className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-black py-3.5 rounded-2xl hover:bg-brand-700 transition-all disabled:opacity-50 shadow-lg shadow-brand-500/30">
                      {buyNow
                        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Zap size={18} />}
                      {buyNow ? "Processing…" : "Buy Now"}
                    </button>
                  </motion.div>

                ) : (
                  /* ── Not in cart: original qty picker + Add to Cart ─── */
                  <motion.div
                    key="not-in-cart"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-2">Quantity</p>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                        <button onClick={() => setAddQty((q) => Math.max(1, q - 1))}
                          className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-700">
                          <Minus size={16} />
                        </button>
                        <span className="w-12 text-center text-lg font-black">{addQty}</span>
                        <button onClick={() => setAddQty((q) => Math.min(product.stock, q + 1))} disabled={addQty >= product.stock}
                          className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-40">
                          <Plus size={16} />
                        </button>
                      </div>
                      <span className={`text-sm font-semibold ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                        {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={handleAddToCart} disabled={product.stock === 0}
                        className="flex-1 flex items-center justify-center gap-2 border-2 border-brand-600 text-brand-600 font-black py-3.5 rounded-2xl hover:bg-brand-50 transition-all disabled:opacity-50">
                        <ShoppingCart size={18} />
                        Add to Cart
                      </button>
                      <button onClick={handleBuyNow} disabled={buyNow || product.stock === 0}
                        className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white font-black py-3.5 rounded-2xl hover:bg-brand-700 transition-all disabled:opacity-50 shadow-lg shadow-brand-500/30">
                        {buyNow ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap size={18} />}
                        {buyNow ? "Processing…" : "Buy Now"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Delivery info */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-5">
              <div className="flex items-center gap-3">
                <Truck size={16} className="text-brand-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900">Free Delivery</p>
                  <p className="text-xs text-gray-500">On orders above ₹999 · Est. 5-7 business days</p>
                </div>
              </div>
              {isReturnable ? (
                <div className="flex items-center gap-3">
                  <RotateCcw size={16} className="text-brand-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{returnDays}-Day Easy Returns</p>
                    <p className="text-xs text-gray-500">Conditions apply · See Returns tab for details</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <RotateCcw size={16} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-600">Replacement Available</p>
                    <p className="text-xs text-gray-500">No returns · Replacement on defective/wrong items</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Package size={16} className="text-brand-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900">Secure Packaging</p>
                  <p className="text-xs text-gray-500">Products delivered in brand-sealed packaging</p>
                </div>
              </div>
            </div>

            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 transition-colors">
              <Share2 size={14} /> Share this product
            </button>
          </div>
        </div>

        {/* ── Product Tabs ──────────────────────────────────────────────── */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <div className="flex gap-0">
              {TABS.map((tab) => (
                <button key={tab.id} onClick={() => setTabOpen(tab.id)}
                  className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all ${
                    tabOpen === tab.id
                      ? "border-brand-600 text-brand-600"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="py-8">
            {tabOpen === "description" && (
              <div className="max-w-3xl text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {product.description || product.short_description || "No description available."}
              </div>
            )}
            {tabOpen === "specs" && (
              <div className="max-w-2xl">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { label: "Brand",  value: product.brand || "—" },
                      { label: "SKU",    value: product.sku || "—" },
                      { label: "Status", value: product.status },
                      { label: "Stock",  value: `${product.stock} units` },
                      ...(product.tags?.map((t) => ({ label: "Tag", value: t })) || []),
                    ].map(({ label, value }) => (
                      <tr key={label} className="hover:bg-gray-50">
                        <td className="py-3 pr-6 font-bold text-gray-700 w-1/3">{label}</td>
                        <td className="py-3 text-gray-600">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {tabOpen === "shipping" && (
              <div className="max-w-2xl space-y-4 text-sm text-gray-600">
                <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
                  <h3 className="font-black text-brand-700 mb-2 flex items-center gap-2"><Truck size={16} /> Delivery</h3>
                  <p>Free shipping on all orders above ₹999. Standard delivery takes 5–7 business days. Express delivery (2–3 days) available at checkout.</p>
                </div>
                {isReturnable ? (
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
                    <h3 className="font-black text-green-800 mb-2 flex items-center gap-2"><RotateCcw size={16} /> Returns</h3>
                    <p className="text-green-700">{returnDays}-day hassle-free returns from the date of delivery. Product must be unused, in original packaging. Refunds processed within 5–7 business days.</p>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                    <h3 className="font-black text-amber-800 mb-2 flex items-center gap-2"><RotateCcw size={16} /> Replacement Policy</h3>
                    <p className="text-amber-700">This item is <strong>not eligible for returns</strong>. Replacement available for defective or wrong items within 48 hours of delivery.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Reviews ───────────────────────────────────────────────────── */}
        <ReviewSection productId={product.id} productSlug={product.slug} />

        {/* ── Similar products ──────────────────────────────────────────── */}
        {similar && similar.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-black text-gray-900 mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {similar.slice(0, 6).map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
