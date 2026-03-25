"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, ShoppingCart } from "lucide-react";
import { formatPrice, getDiscountPercent } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/uiStore";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface ProductData {
  id: number; name: string; slug: string; brand?: string;
  price: number; compare_price?: number; stock: number; avg_rating: number;
  primary_image?: string;
  images?: { url: string; is_primary: boolean }[];
}

interface Tab { id: string; label: string; product_ids?: number[]; products?: ProductData[]; }

interface FeaturedCollectionsData {
  heading?: string;
  tabs?: Tab[];
  // legacy
  title?: string;
  products?: ProductData[];
}

interface Props { data?: FeaturedCollectionsData; }

function ProductCard({ product }: { product: ProductData }) {
  const { isAuthenticated } = useAuthStore();
  const { increment }       = useCartStore();
  const [adding, setAdding] = useState(false);

  const img      = product.primary_image || product.images?.find((i) => i.is_primary)?.url || product.images?.[0]?.url;
  const discount = getDiscountPercent(product.price, product.compare_price);

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error("Please login"); return; }
    setAdding(true);
    try {
      await api.post("/cart/items", { product_id: product.id, quantity: 1 });
      increment(); toast.success("Added to cart!");
    } catch { toast.error("Failed"); }
    finally { setAdding(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
      {/* FIX: bg-white border-gray-100 → dark variants; hover:border-brand-200 fine */}
      <Link href={`/products/${product.slug}`}
        className="group block bg-white dark:bg-[rgb(var(--surface-0))] rounded-2xl overflow-hidden border border-gray-100 hover:border-brand-200 hover:shadow-lg transition-all duration-300">
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {img
            ? <Image src={img} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:768px) 50vw, 16vw" />
            : <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">🏆</div>}
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{discount}% OFF</span>
          )}
          {/* FIX: bg-black/80 hover:bg-brand-600 — these are fine (semi-transparent on image) */}
          <button onClick={addToCart} disabled={adding || product.stock === 0}
            className="absolute bottom-3 right-3 w-9 h-9 bg-black/80 hover:bg-brand-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
            <ShoppingCart size={14} />
          </button>
        </div>
        <div className="p-4">
          {product.brand && <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-0.5">{product.brand}</p>}
          <h3 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-brand-600 transition-colors mb-1">{product.name}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-gray-900">{formatPrice(product.price)}</span>
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-xs text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
              )}
            </div>
            <span className={`text-[10px] font-bold ${product.stock > 0 ? "text-green-500" : "text-red-400"}`}>
              {product.stock > 0 ? `${product.stock} left` : "Sold Out"}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs font-bold text-brand-600 group-hover:gap-2 transition-all">
            Shop Now <ArrowUpRight size={12} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function FeaturedCollections({ data }: Props) {
  const heading  = data?.heading || data?.title || "Featured Collections";
  const [activeTab, setActiveTab] = useState(0);

  // Support both new `tabs` structure and legacy `products` flat array
  const tabs: Tab[] = data?.tabs?.length
    ? data.tabs
    : data?.products?.length
      ? [{ id: "all", label: "All", products: data.products }]
      : [];

  const currentProducts = tabs[activeTab]?.products || [];
  if (!tabs.length && !data?.products?.length) return null;

  return (
    /* FIX: bg-gray-50 → covered by global */
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-brand-600 text-xs font-black uppercase tracking-widest mb-2">Collections</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">{heading}</h2>
          </div>
          <Link href="/products" className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors hidden sm:flex">
            View All <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Tabs — FIX: inactive tab bg-white border-gray-200 text-gray-600 → dark variants */}
        {tabs.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-1">
            {tabs.map((tab, i) => (
              <button key={tab.id} onClick={() => setActiveTab(i)}
                className={`whitespace-nowrap text-sm font-bold px-5 py-2.5 rounded-full transition-all ${
                  activeTab === i
                    ? "bg-black text-white shadow-md dark:bg-white dark:text-black"
                    : "bg-white dark:bg-[rgb(var(--surface-2))] text-gray-600 border border-gray-200 hover:border-gray-400"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Products grid */}
        {currentProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {currentProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No products configured for this tab yet.</p>
            <p className="text-xs mt-1">Admin: Add product IDs in Homepage → Featured Collections</p>
          </div>
        )}
      </div>
    </section>
  );
}
