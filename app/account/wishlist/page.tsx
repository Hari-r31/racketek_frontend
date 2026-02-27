"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Trash2, ShoppingCart, Heart } from "lucide-react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/uiStore";
import toast from "react-hot-toast";

interface WishlistItem {
  id: number;
  product_id: number;
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    compare_price?: number;
    stock: number;
    images: { url: string; is_primary: boolean }[];
    brand?: string;
  };
}

export default function WishlistPage() {
  const qc = useQueryClient();
  const { increment } = useCartStore();

  const { data: wishlist, isLoading } = useQuery<WishlistItem[]>({
    queryKey: ["wishlist"],
    queryFn: () => api.get("/wishlist").then((r) => r.data),
  });

  const removeItem = useMutation({
    mutationFn: (productId: number) => api.delete(`/wishlist/${productId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from wishlist");
    },
  });

  const moveToCart = useMutation({
    mutationFn: async (item: WishlistItem) => {
      await api.post("/cart/items", { product_id: item.product_id, quantity: 1 });
      await api.delete(`/wishlist/${item.product_id}`);
    },
    onSuccess: () => {
      increment();
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Moved to cart!");
    },
    onError: () => toast.error("Failed to move to cart"),
  });

  if (isLoading) {
    return (
      <div className="card p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i}>
            <div className="aspect-square bg-gray-200 rounded-xl mb-3" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!wishlist?.length) {
    return (
      <div className="card p-12 text-center">
        <Heart size={48} className="text-gray-200 mx-auto mb-4" />
        <h3 className="font-bold text-gray-700 text-lg mb-2">Your wishlist is empty</h3>
        <p className="text-gray-400 text-sm mb-6">Save products you love to buy later</p>
        <Link href="/products" className="btn-primary text-sm">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-100">
        <h2 className="font-black text-gray-900 text-xl">Wishlist ({wishlist.length})</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
        {wishlist.map((item) => {
          const image = item.product.images?.find((i) => i.is_primary) || item.product.images?.[0];
          return (
            <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <Link href={`/products/${item.product.slug}`}>
                <div className="relative aspect-square bg-gray-50">
                  {image ? (
                    <Image src={image.url} alt={item.product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🏆</div>
                  )}
                </div>
              </Link>
              <div className="p-3">
                {item.product.brand && (
                  <p className="text-xs text-gray-400 uppercase font-medium mb-1">{item.product.brand}</p>
                )}
                <Link href={`/products/${item.product.slug}`}>
                  <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 hover:text-brand-600 mb-2">
                    {item.product.name}
                  </h3>
                </Link>
                <p className="font-black text-gray-900 mb-3">{formatPrice(item.product.price)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => moveToCart.mutate(item)}
                    disabled={item.product.stock === 0 || moveToCart.isPending}
                    className="flex-1 flex items-center justify-center gap-1 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                  >
                    <ShoppingCart size={11} />
                    {item.product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                  <button
                    onClick={() => removeItem.mutate(item.product_id)}
                    className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                  >
                    <Trash2 size={13} className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
