"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Product } from "@/types";
import { formatPrice, getDiscountPercent } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/uiStore";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { isAuthenticated } = useAuthStore();
  const { increment } = useCartStore();
  const [wishlisted, setWishlisted] = useState(false);
  const [addingCart, setAddingCart] = useState(false);

  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const discount = getDiscountPercent(product.price, product.compare_price);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to add to cart");
      return;
    }
    setAddingCart(true);
    try {
      await api.post("/cart/items", { product_id: product.id, quantity: 1 });
      increment();
      toast.success("Added to cart!");
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAddingCart(false);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to save items");
      return;
    }
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
    } catch {
      toast.error("Action failed");
    }
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link href={`/products/${product.slug}`} className="group block">
        <div className="card overflow-hidden">
          {/* Image */}
          <div className="relative aspect-square bg-gray-50 product-image-container overflow-hidden">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt_text || product.name}
                fill
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
              {discount > 0 && (
                <span className="badge bg-red-500 text-white">{discount}% OFF</span>
              )}
              {product.is_best_seller && (
                <span className="badge bg-brand-600 text-white">Best Seller</span>
              )}
              {product.stock === 0 && (
                <span className="badge bg-gray-800 text-white">Out of Stock</span>
              )}
            </div>

            {/* Actions */}
            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleWishlist}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors"
              >
                <Heart
                  size={14}
                  className={wishlisted ? "text-red-500 fill-red-500" : "text-gray-600"}
                />
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="p-3 sm:p-4">
            {product.brand && (
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
                {product.brand}
              </p>
            )}
            <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-brand-600 transition-colors">
              {product.name}
            </h3>

            {/* Rating */}
            {product.review_count > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-gray-600 font-medium">{product.avg_rating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({product.review_count})</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-2 mb-3">
              <span className="font-black text-gray-900">{formatPrice(product.price)}</span>
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-xs text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
              )}
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={addingCart || product.stock === 0}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              <ShoppingCart size={12} />
              {addingCart ? "Adding..." : product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
