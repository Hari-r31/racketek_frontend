"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useCartStore } from "@/store/uiStore";
import toast from "react-hot-toast";
import { Heart, ShoppingCart, Trash2, ArrowRight, Loader2, Package } from "lucide-react";
import { formatPrice, getDiscountPercent } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
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
  const qc = useQueryClient();
  const { increment } = useCartStore();
  const [addingToCart, setAddingToCart] = useState<Record<number, boolean>>({});

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["wishlist"],
    queryFn: () => api.get("/wishlist").then((r) => r.data),
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
      qc.invalidateQueries({ queryKey: ["cart"] }); // cart contents update
      toast.success("Moved to cart!");
      setAddingToCart((p) => ({ ...p, [id]: false }));
    },
    onError: (_, id) => {
      toast.error("Failed to move to cart");
      setAddingToCart((p) => ({ ...p, [id]: false }));
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
        <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart size={28} className="text-brand-400" />
        </div>
        <h3 className="font-black text-gray-900 text-lg">Your wishlist is empty</h3>
        <p className="text-gray-500 text-sm mt-2">Save products you love and come back to them later</p>
        <Link href="/products"
          className="inline-flex items-center gap-2 mt-6 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all">
          Browse Products <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500 font-medium">
          {products.length} item{products.length !== 1 ? "s" : ""} saved
        </p>
        <Link href="/products" className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
          Continue Shopping <ArrowRight size={13} />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {products.map((product) => {
            const primaryImg = product.images?.find((i) => i.is_primary) || product.images?.[0];
            const discount = getDiscountPercent(product.price, product.compare_price);
            const outOfStock = product.stock === 0;
            return (
              <motion.div key={product.id} layout
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md hover:border-gray-200 transition-all">
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  <Link href={`/products/${product.slug}`}>
                    {primaryImg?.url ? (
                      <Image src={primaryImg.url} alt={product.name} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width:640px) 50vw, 25vw" />
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
                      <span className="text-xs font-black text-gray-600 bg-white px-3 py-1.5 rounded-full shadow-sm">Out of Stock</span>
                    </div>
                  )}
                  <button onClick={() => removeMutation.mutate(product.id)} disabled={removeMutation.isPending}
                    className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="p-3">
                  {product.brand && (
                    <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-0.5">{product.brand}</p>
                  )}
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="text-sm font-bold text-gray-800 line-clamp-2 hover:text-brand-600 transition-colors leading-snug">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="font-black text-gray-900 text-sm">{formatPrice(product.price)}</span>
                    {product.compare_price && product.compare_price > product.price && (
                      <span className="text-xs text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
                    )}
                  </div>
                  <button
                    onClick={() => { setAddingToCart((p) => ({ ...p, [product.id]: true })); moveToCartMutation.mutate(product.id); }}
                    disabled={addingToCart[product.id] || outOfStock}
                    className="w-full mt-2.5 flex items-center justify-center gap-1.5 bg-black hover:bg-gray-800 text-white text-xs font-bold py-2 rounded-xl transition-all disabled:opacity-50">
                    {addingToCart[product.id] ? <Loader2 size={12} className="animate-spin" /> : <ShoppingCart size={12} />}
                    {addingToCart[product.id] ? "Moving…" : "Move to Cart"}
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
