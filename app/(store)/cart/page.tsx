"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, Trash2, Tag, ArrowRight, ShoppingBag } from "lucide-react";
import api from "@/lib/api";
import { Cart } from "@/types";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/uiStore";

export default function CartPage() {
  const { isAuthenticated } = useAuthStore();
  const { setCount } = useCartStore();
  const qc = useQueryClient();
  const [couponCode, setCouponCode] = useState("");

  const { data: cart, isLoading } = useQuery<Cart>({
    queryKey: ["cart"],
    queryFn: () => api.get("/cart").then((r) => r.data),
    enabled: isAuthenticated,
  });

  const updateItem = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      api.put(`/cart/items/${id}`, { quantity }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeItem = useMutation({
    mutationFn: (id: number) => api.delete(`/cart/items/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Item removed");
    },
  });

  const applyCoupon = useMutation({
    mutationFn: () => api.post("/cart/coupon", { coupon_code: couponCode }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Coupon applied!");
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Invalid coupon"),
  });

  const removeCoupon = useMutation({
    mutationFn: () => api.delete("/cart/coupon"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Coupon removed");
      setCouponCode("");
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingBag size={56} className="text-gray-200 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Please login to view your cart</p>
        <Link href="/auth/login" className="btn-primary">Login to Continue</Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-4 flex gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeItems = cart?.items?.filter((i) => !i.save_for_later) || [];
  const savedItems = cart?.items?.filter((i) => i.save_for_later) || [];

  if (activeItems.length === 0 && savedItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingBag size={56} className="text-gray-200 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some awesome products to continue</p>
        <Link href="/products" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-8">Shopping Cart ({activeItems.length})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {activeItems.map((item) => {
            const image = item.product.images?.find((i) => i.is_primary) || item.product.images?.[0];
            const price = item.product.price + (item.variant?.price_modifier || 0);
            return (
              <div key={item.id} className="card p-4 flex gap-4">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                  {image ? (
                    <Image src={image.url} alt={item.product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🏆</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 line-clamp-2 text-sm mb-1">
                    <Link href={`/products/${item.product.slug}`} className="hover:text-brand-600">
                      {item.product.name}
                    </Link>
                  </h3>
                  {item.variant && (
                    <p className="text-xs text-gray-500 mb-2">{item.variant.name}: {item.variant.value}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateItem.mutate({ id: item.id, quantity: item.quantity - 1 })}
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateItem.mutate({ id: item.id, quantity: item.quantity + 1 })}
                        className="w-7 h-7 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-gray-900">{formatPrice(price * item.quantity)}</span>
                      <button
                        onClick={() => removeItem.mutate(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Saved for later */}
          {savedItems.length > 0 && (
            <div className="mt-8">
              <h3 className="font-bold text-gray-700 mb-4">Saved for Later ({savedItems.length})</h3>
              {savedItems.map((item) => (
                <div key={item.id} className="card p-4 flex gap-4 opacity-70 mb-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{item.product.name}</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{formatPrice(item.product.price)}</p>
                  </div>
                  <button
                    onClick={() => api.post(`/cart/items/${item.id}/save-for-later`).then(() => qc.invalidateQueries({ queryKey: ["cart"] }))}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    Move to Cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="card p-6 h-fit">
          <h2 className="font-black text-gray-900 text-lg mb-5">Order Summary</h2>

          {/* Coupon */}
          <div className="mb-5">
            {cart?.coupon_code ? (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-green-600" />
                  <span className="text-sm font-semibold text-green-700">{cart.coupon_code}</span>
                </div>
                <button onClick={() => removeCoupon.mutate()} className="text-xs text-red-500 hover:underline">
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className="input text-sm flex-1"
                />
                <button
                  onClick={() => applyCoupon.mutate()}
                  disabled={!couponCode.trim() || applyCoupon.isPending}
                  className="btn-outline text-sm px-4 py-2"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-3 text-sm border-t border-gray-100 pt-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatPrice(cart?.subtotal || 0)}</span>
            </div>
            {(cart?.discount_amount || 0) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>−{formatPrice(cart?.discount_amount || 0)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium">
                {(cart?.shipping_cost || 0) === 0 ? (
                  <span className="text-green-600">FREE</span>
                ) : (
                  formatPrice(cart?.shipping_cost || 0)
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">GST (18%)</span>
              <span className="font-medium">{formatPrice(cart?.tax_amount || 0)}</span>
            </div>
            <div className="flex justify-between font-black text-base border-t border-gray-200 pt-3">
              <span>Total</span>
              <span className="text-brand-600">{formatPrice(cart?.total_amount || 0)}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
          >
            Proceed to Checkout <ArrowRight size={16} />
          </Link>

          <p className="text-xs text-gray-400 text-center mt-3">
            🔒 Secure checkout powered by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}
