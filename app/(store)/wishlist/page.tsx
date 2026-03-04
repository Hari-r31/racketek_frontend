"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useCartStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import {
  Heart, ShoppingCart, Trash2, ArrowRight, Loader2, Package,
} from "lucide-react";
import { formatPrice, getDiscountPercent } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface WishlistProduct {
  id: number;
  name: string;
  slug: string;
  brand?: string;
  price: number;
  compare_price?: number;
  stock: number;
  avg_rating: number;
  images: { url: string; is_primary: boolean }[];
}

export default function WishlistPage() {
  const qc              = useQueryClient();
  const router          = useRouter();
  const { increment }   = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [addingToCart, setAddingToCart] = useState<Record<number, boolean>>({});

  const { data: products = [], isLoading } = useQuery<WishlistProduct[]>({
    queryKey: ["wishlist"],
    queryFn: () => api.get("/wishlist").then((r) => r.data),
    enabled: isAuthenticated,
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/wishlist/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from wishlist");
    },
    onError: () => toast.error("Failed to remove"),
  });

  const moveToCartMutation = useMutation({
    mutationFn: (id: number) => api.post(`/wishlist/${id}/move-to-cart`),
    onSuccess: (_, id) => {
      increment();
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Moved to cart!");
      setAddingToCart((p) => ({ ...p, [id]: false }));
    },
    onError: (_, id) => {
      toast.error("Failed to move to cart");
      setAddingToCart((p) => ({ ...p, [id]: false }));
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <Heart size={56} className="text-gray-200 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-gray-800 mb-2">Your Wishlist</h2>
        <p className="text-gray-500 mb-6">Please login to view your saved items</p>
        <Link
          href={`/auth/login?next=/wishlist`}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
        >
          Login to Continue
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
          <Heart size={24} className="text-brand-600" /> My Wishlist
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <Heart size={36} className="text-brand-400" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 mb-6">Save products you love and come back to them later</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
        >
          Browse Products <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <Heart size={22} className="text-brand-600 fill-brand-100" />
            My Wishlist
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {products.length} item{products.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <Link
          href="/products"
          className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 border border-brand-200 hover:border-brand-400 px-4 py-2 rounded-xl transition-all"
        >
          Continue Shopping <ArrowRight size={13} />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <AnimatePresence mode="popLayout">
          {products.map((product) => {
            const primaryImg = product.images?.find((i) => i.is_primary) || product.images?.[0];
            const discount   = getDiscountPercent(product.price, product.compare_price);
            const outOfStock = product.stock === 0;

            return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md hover:border-gray-200 transition-all"
              >
                {/* Image */}
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  <Link href={`/products/${product.slug}`}>
                    {primaryImg?.url ? (
                      <Image
                        src={primaryImg.url}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width:640px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <Package size={48} />
                      </div>
                    )}
                  </Link>

                  {discount > 0 && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {discount}% OFF
                    </span>
                  )}

                  {outOfStock && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <span className="text-xs font-black text-gray-600 bg-white px-3 py-1.5 rounded-full shadow-sm">
                        Out of Stock
                      </span>
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={() => removeMutation.mutate(product.id)}
                    disabled={removeMutation.isPending}
                    className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3">
                  {product.brand && (
                    <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-0.5">
                      {product.brand}
                    </p>
                  )}
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="text-sm font-bold text-gray-800 line-clamp-2 hover:text-brand-600 transition-colors leading-snug">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="font-black text-gray-900 text-sm">{formatPrice(product.price)}</span>
                    {product.compare_price && product.compare_price > product.price && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatPrice(product.compare_price)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setAddingToCart((p) => ({ ...p, [product.id]: true }));
                      moveToCartMutation.mutate(product.id);
                    }}
                    disabled={addingToCart[product.id] || outOfStock}
                    className="w-full mt-2.5 flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all disabled:opacity-50"
                  >
                    {addingToCart[product.id] ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <ShoppingCart size={12} />
                    )}
                    {addingToCart[product.id] ? "Moving…" : outOfStock ? "Out of Stock" : "Move to Cart"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
