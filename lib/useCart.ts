"use client";
/**
 * useCart.ts  —  Unified cart hooks
 *
 * HOOKS FIX: useCartSync no longer has conditional early returns before
 * its hook calls.  All hook-derived values are called unconditionally;
 * the conditional logic is pushed into useEffect.
 *
 * CART FIX (#10/#11): addToCart / updateQty / removeFromCart all call
 * resyncFromServer() after every API mutation so the React-Query ["cart"]
 * cache is immediately warm.  Navigation to /cart after adding an item
 * now shows the correct items without a page refresh.
 */

import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Cart } from "@/types";
import { useCartStore } from "@/store/uiStore";
import { useCartItemsStore, CartItemEntry } from "@/store/cartStore";

// ── 1. Reactive per-product selector ──────────────────────────────────────
export function useCartItem(
  productId: number,
  variantId?: number | null,
): CartItemEntry | null {
  return useCartItemsStore(
    useCallback((s) => s.getItem(productId, variantId), [productId, variantId]),
  );
}

// ── 2. Unified action hooks ────────────────────────────────────────────────
export function useCartActions() {
  const qc = useQueryClient();
  const { increment, decrement, setCount } = useCartStore();
  const { setItem, removeItem, hydrate }   = useCartItemsStore();

  // Re-fetch cart and write result directly into the RQ cache + Zustand store
  const resyncFromServer = useCallback(async () => {
    try {
      const { data } = await api.get<Cart>("/cart");
      hydrate(data.items ?? []);
      const active = (data.items ?? []).filter((i) => !i.save_for_later);
      setCount(active.reduce((s, i) => s + i.quantity, 0));
      qc.setQueryData<Cart>(["cart"], data);
    } catch {
      // Network failure — leave stale state
    }
  }, [hydrate, setCount, qc]);

  const addToCart = useCallback(
    async (
      productId: number,
      variantId: number | null | undefined,
      quantity: number,
    ): Promise<number | null> => {
      try {
        const { data } = await api.post("/cart/items", {
          product_id: productId,
          variant_id: variantId ?? undefined,
          quantity,
        });
        const serverQty: number = (data.quantity as number) ?? quantity;
        const prevQty = useCartItemsStore.getState().getItem(productId, variantId)?.quantity ?? 0;
        setItem(productId, variantId, { cartItemId: data.item_id as number, quantity: serverQty });
        if (serverQty > prevQty) increment(serverQty - prevQty);
        await resyncFromServer();
        return data.item_id;
      } catch (e: any) {
        toast.error(e?.response?.data?.detail || "Failed to add to cart");
        return null;
      }
    },
    [setItem, increment, resyncFromServer],
  );

  const updateQty = useCallback(
    async (
      productId: number,
      variantId: number | null | undefined,
      cartItemId: number,
      oldQty: number,
      newQty: number,
    ): Promise<void> => {
      setItem(productId, variantId, { cartItemId, quantity: newQty });
      const delta = newQty - oldQty;
      if (delta > 0) increment(delta); else decrement(-delta);
      try {
        await api.put(`/cart/items/${cartItemId}`, { quantity: newQty });
        await resyncFromServer();
      } catch {
        setItem(productId, variantId, { cartItemId, quantity: oldQty });
        if (delta > 0) decrement(delta); else increment(-delta);
        toast.error("Could not update cart");
      }
    },
    [setItem, increment, decrement, resyncFromServer],
  );

  const removeFromCart = useCallback(
    async (
      productId: number,
      variantId: number | null | undefined,
      cartItemId: number,
      quantity: number,
    ): Promise<void> => {
      removeItem(productId, variantId);
      decrement(quantity);
      try {
        await api.delete(`/cart/items/${cartItemId}`);
        await resyncFromServer();
      } catch {
        await resyncFromServer();
        toast.error("Could not remove item");
      }
    },
    [removeItem, decrement, resyncFromServer],
  );

  return { addToCart, updateQty, removeFromCart, resyncFromServer };
}

// ── 3. Cart sync hook (used by CartInitializer) ───────────────────────────
// HOOKS FIX: hooks (hydrate, clear, setCount) are now called
// unconditionally.  The conditional logic lives inside useEffect so
// the hook count never changes between renders.
export function useCartSync(cart: Cart | undefined, isAuthenticated: boolean) {
  const { hydrate, clear } = useCartItemsStore();
  const { setCount }       = useCartStore();

  useEffect(() => {
    if (!isAuthenticated) {
      clear();
      setCount(0);
      return;
    }
    if (cart) {
      const active = cart.items.filter((i) => !i.save_for_later);
      setCount(active.reduce((s, i) => s + i.quantity, 0));
      hydrate(cart.items);
    }
  }, [cart, isAuthenticated, hydrate, clear, setCount]);
}
