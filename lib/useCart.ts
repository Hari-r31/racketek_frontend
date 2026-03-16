"use client";
/**
 * useCart.ts  —  Unified cart hooks
 *
 * FIX #10 / #11: addToCart now calls resyncFromServer() after the API
 * call succeeds, so the ["cart"] React-Query cache is immediately
 * populated with fresh data from the server.  Components that navigate
 * to /cart right after adding an item (Go to Cart, Buy Now) will find
 * the cache already warm and show the correct items without a manual
 * refresh.
 *
 * Previously invalidateQueries() was used, which marks the cache stale
 * but does NOT refetch immediately — the cart page would mount with an
 * empty stale cache and only fill in after the background refetch
 * finished (causing the "empty cart until refresh" symptom).
 */

import { useCallback } from "react";
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
  const { setItem, removeItem, hydrate } = useCartItemsStore();

  // ── Internal: fetch cart from server and seed EVERYTHING synchronously ──
  // This is the key fix for #10/#11: we await this after every mutation
  // so the ["cart"] cache is warm before any navigation happens.
  const resyncFromServer = useCallback(async () => {
    try {
      const { data } = await api.get<Cart>("/cart");
      // Seed the Zustand item map
      hydrate(data.items ?? []);
      // Sync the navbar badge count
      const active = (data.items ?? []).filter((i) => !i.save_for_later);
      setCount(active.reduce((s, i) => s + i.quantity, 0));
      // Write into the React-Query cache so /cart page gets fresh data
      // immediately on mount without an extra network round-trip.
      qc.setQueryData<Cart>(["cart"], data);
    } catch {
      // Network failure — leave stale state; badge may be off by a beat
    }
  }, [hydrate, setCount, qc]);

  // ── addToCart ────────────────────────────────────────────────────────
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
        const prevQty =
          useCartItemsStore.getState().getItem(productId, variantId)?.quantity ?? 0;

        // Optimistic Zustand update (instant UI)
        const entry: CartItemEntry = {
          cartItemId: data.item_id as number,
          quantity: serverQty,
        };
        setItem(productId, variantId, entry);
        if (serverQty > prevQty) increment(serverQty - prevQty);

        // FIX #10/#11: resync cart from server so ["cart"] cache is
        // immediately populated.  This means the cart page will show
        // the correct items the moment it mounts, even if the user
        // navigates there right after this call resolves.
        await resyncFromServer();

        return data.item_id;
      } catch (e: any) {
        toast.error(e?.response?.data?.detail || "Failed to add to cart");
        return null;
      }
    },
    [setItem, increment, resyncFromServer],
  );

  // ── updateQty ────────────────────────────────────────────────────────
  const updateQty = useCallback(
    async (
      productId: number,
      variantId: number | null | undefined,
      cartItemId: number,
      oldQty: number,
      newQty: number,
    ): Promise<void> => {
      // Optimistic update first
      setItem(productId, variantId, { cartItemId, quantity: newQty });
      const delta = newQty - oldQty;
      if (delta > 0) increment(delta);
      else decrement(-delta);

      try {
        await api.put(`/cart/items/${cartItemId}`, { quantity: newQty });
        // Resync so cart page cache stays fresh
        await resyncFromServer();
      } catch {
        // Rollback
        setItem(productId, variantId, { cartItemId, quantity: oldQty });
        if (delta > 0) decrement(delta);
        else increment(-delta);
        toast.error("Could not update cart");
      }
    },
    [setItem, increment, decrement, resyncFromServer],
  );

  // ── removeFromCart ────────────────────────────────────────────────────
  const removeFromCart = useCallback(
    async (
      productId: number,
      variantId: number | null | undefined,
      cartItemId: number,
      quantity: number,
    ): Promise<void> => {
      // Optimistic update
      removeItem(productId, variantId);
      decrement(quantity);

      try {
        await api.delete(`/cart/items/${cartItemId}`);
        await resyncFromServer();
      } catch {
        // Rollback by re-fetching server state
        await resyncFromServer();
        toast.error("Could not remove item");
      }
    },
    [removeItem, decrement, resyncFromServer],
  );

  return { addToCart, updateQty, removeFromCart, resyncFromServer };
}

// ── 3. Cart sync hook (used by CartInitializer) ───────────────────────────
export function useCartSync(cart: Cart | undefined, isAuthenticated: boolean) {
  const { hydrate, clear } = useCartItemsStore();
  const { setCount } = useCartStore();

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
}
