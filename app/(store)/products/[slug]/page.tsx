"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ShoppingCart, Heart, Star, Truck, RotateCcw,
  ShieldCheck, ChevronRight, Minus, Plus,
} from "lucide-react";
import api from "@/lib/api";
import { Product } from "@/types";
import { formatPrice, getDiscountPercent } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/uiStore";
import toast from "react-hot-toast";
import ProductCard from "@/components/products/ProductCard";
import ReviewSection from "@/components/products/ReviewSection";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuthStore();
  const { increment } = useCartStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [addingCart, setAddingCart] = useState(false);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["product", slug],
    queryFn: () => api.get(`/products/${slug}`).then((r) => r.data),
  });

  const { data: similar } = useQuery<Product[]>({
    queryKey: ["similar", product?.id],
    queryFn: () =>
      api.get(`/ai/recommend/${product?.id}`).then((r) => r.data.recommendations),
    enabled: !!product?.id,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return (
    <div className="text-center py-24">
      <p className="text-2xl font-bold text-gray-800">Product not found</p>
      <Link href="/products" className="text-brand-600 hover:underline mt-4 block">
        Back to products
      </Link>
    </div>
  );

  const discount = getDiscountPercent(product.price, product.compare_price);
  const images = product.images?.length ? product.images : [];

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error("Please login to add to cart"); return; }
    setAddingCart(true);
    try {
      await api.post("/cart/items", {
        product_id: product.id,
        variant_id: selectedVariant,
        quantity,
      });
      increment();
      toast.success(`Added ${quantity} item(s) to cart!`);
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAddingCart(false);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error("Please login to save items"); return; }
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

  // Group variants by name
  const variantGroups = product.variants?.reduce((acc, v) => {
    if (!acc[v.name]) acc[v.name] = [];
    acc[v.name].push(v);
    return acc;
  }, {} as Record<string, typeof product.variants>);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight size={14} />
        <Link href="/products" className="hover:text-brand-600">Products</Link>
        <ChevronRight size={14} />
        <span className="text-gray-800 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Images */}
        <div>
          <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-3 product-image-container">
            {images[selectedImage] ? (
              <Image
                src={images[selectedImage].url}
                alt={images[selectedImage].alt_text || product.name}
                fill
                className="object-contain product-image"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-200">
                <span className="text-8xl">🏆</span>
              </div>
            )}
            {discount > 0 && (
              <span className="absolute top-4 left-4 badge bg-red-500 text-white text-sm">
                {discount}% OFF
              </span>
            )}
          </div>
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-colors ${
                    selectedImage === i ? "border-brand-600" : "border-gray-200"
                  }`}
                >
                  <Image src={img.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {product.brand && (
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wide mb-2">
              {product.brand}
            </p>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">{product.name}</h1>

          {/* Rating */}
          {product.review_count > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < Math.round(product.avg_rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-300"}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 font-medium">{product.avg_rating.toFixed(1)}</span>
              <span className="text-sm text-gray-400">({product.review_count} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3 mb-5">
            <span className="text-3xl font-black text-gray-900">{formatPrice(product.price)}</span>
            {product.compare_price && product.compare_price > product.price && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
                <span className="badge bg-red-100 text-red-700 text-sm">Save {formatPrice(product.compare_price - product.price)}</span>
              </>
            )}
          </div>

          {/* Short description */}
          {product.short_description && (
            <p className="text-gray-600 mb-5">{product.short_description}</p>
          )}

          {/* Variants */}
          {Object.entries(variantGroups).map(([name, variants]) => (
            <div key={name} className="mb-5">
              <p className="label">{name}</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v.id)}
                    disabled={!v.is_active || v.stock === 0}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      selectedVariant === v.id
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-brand-400"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {v.value}
                    {v.price_modifier !== 0 && (
                      <span className="ml-1 text-xs">
                        ({v.price_modifier > 0 ? "+" : ""}{formatPrice(v.price_modifier)})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div className="mb-6">
            <p className="label">Quantity</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
              >
                <Minus size={14} />
              </button>
              <span className="text-lg font-bold w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
                className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
              >
                <Plus size={14} />
              </button>
              <span className="text-sm text-gray-500">
                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={addingCart || product.stock === 0}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              <ShoppingCart size={16} />
              {addingCart ? "Adding..." : "Add to Cart"}
            </button>
            <button
              onClick={handleWishlist}
              className={`w-12 h-12 border rounded-xl flex items-center justify-center transition-colors ${
                wishlisted ? "bg-red-50 border-red-300" : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Heart size={18} className={wishlisted ? "text-red-500 fill-red-500" : "text-gray-600"} />
            </button>
          </div>

          {/* Info badges */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="flex flex-col items-center gap-1 text-center">
              <Truck size={18} className="text-brand-600" />
              <p className="text-xs font-medium text-gray-700">Free Delivery</p>
              <p className="text-xs text-gray-400">Orders ₹999+</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <RotateCcw size={18} className="text-brand-600" />
              <p className="text-xs font-medium text-gray-700">7-Day Return</p>
              <p className="text-xs text-gray-400">Easy returns</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <ShieldCheck size={18} className="text-brand-600" />
              <p className="text-xs font-medium text-gray-700">100% Genuine</p>
              <p className="text-xs text-gray-400">Certified</p>
            </div>
          </div>

          {/* Estimated Delivery */}
          <p className="text-sm text-gray-500 mt-3">
            📦 Estimated delivery: <span className="font-medium text-gray-800">5-7 business days</span>
          </p>
        </div>
      </div>

      {/* Full Description */}
      {product.description && (
        <div className="mt-12">
          <h2 className="text-xl font-black text-gray-900 mb-4">Product Description</h2>
          <div className="prose max-w-none text-gray-600 whitespace-pre-line">
            {product.description}
          </div>
        </div>
      )}

      {/* Reviews */}
      {product && (
        <ReviewSection productId={product.id} productSlug={product.slug} />
      )}

      {/* Similar Products */}
      {similar && similar.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-black text-gray-900 mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {similar.slice(0, 6).map((p: any) => (
              <Link key={p.id} href={`/products/${p.slug}`} className="card p-3 hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1">{p.name}</p>
                <p className="text-sm font-bold text-brand-600">{formatPrice(p.price)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
