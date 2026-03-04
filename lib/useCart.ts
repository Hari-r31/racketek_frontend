"use client";
/**
 * useCart.ts  —  Unified cart hooks
 * ==================================
 *
 * Three named exports:
 *
 *   useCartItem(productId, variantId?)
 *     → Reactive selector. Returns CartItemEntry | null.
 *       Re-renders the calling component only when THIS product's cart
 *       entry changes — not on unrelated cart mutations.
 *
 *   useCartActions()
 *     → Stable action callbacks: addToCart, updateQty, removeFromCart.
 *       Every action updates the Zustand store optimistically and then
 *       fires the API call. On failure it rolls back and re-syncs from
 *       the server.
 *
 *   useCartSync()
 *     → Reads the React-Query ["cart"] cache and hydrates the Zustand
 *       store whenever the cache changes. Call this once at the layout
 *       level (CartInitializer does it for you).
 *
 * Nothing here duplicates cart state — the Zustand store IS the state.
 */

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Cart } from "@/types";
import { useCartStore } from "@/store/uiStore";
import { useCartItemsStore, CartItemEntry } from "@/store/cartStore";

// ── 1. Reactive per-product selector ──────────────────────────────────────

/**
 * Returns the live CartItemEntry for a (product, variant) pair, or null
 * if the product is not currently in the cart.
 *
 * The selector is scoped to the specific key so the component only
 * re-renders when its own item changes.
 */
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
  const { setItem, removeItem, hydrate, items } = useCartItemsStore();

  // ── Internal: re-fetch cart and re-seed everything ──────────────────
  const resyncFromServer = useCallback(async () => {
    try {
      const { data } = await api.get<Cart>("/cart");
      hydrate(data.items ?? []);
      const active = (data.items ?? []).filter((i) => !i.save_for_later);
      setCount(active.reduce((s, i) => s + i.quantity, 0));
      qc.setQueryData<Cart>(["cart"], data);
    } catch {
      /* network failure — leave stale state, user will see stale count */
    }
  }, [hydrate, setCount, qc]);

  // ── addToCart ───────────────────────────────────────────────────────
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
        const entry: CartItemEntry = {
          cartItemId: data.item_id as number,
          quantity,
        };
        setItem(productId, variantId, entry);
        increment(quantity);
        // Invalidate the cart page cache (non-blocking)
        qc.invalidateQueries({ queryKey: ["cart"] });
        return data.item_id;
      } catch (e: any) {
        toast.error(e?.response?.data?.detail || "Failed to add to cart");
        return null;
      }
    },
    [setItem, increment, qc],
  );

  // ── updateQty ───────────────────────────────────────────────────────
  const updateQty = useCallback(
    async (
      productId: number,
      variantId: number | null | undefined,
      cartItemId: number,
      oldQty: number,
      newQty: number,
    ): Promise<void> => {
      // Optimistic update
      setItem(productId, variantId, { cartItemId, quantity: newQty });
      const delta = newQty - oldQty;
      if (delta > 0) increment(delta);
      else decrement(-delta);

      try {
        await api.put(`/cart/items/${cartItemId}`, { quantity: newQty });
        qc.invalidateQueries({ queryKey: ["cart"] });
      } catch {
        // Rollback
        setItem(productId, variantId, { cartItemId, quantity: oldQty });
        if (delta > 0) decrement(delta);
        else increment(-delta);
        toast.error("Could not update cart");
      }
    },
    [setItem, increment, decrement, qc],
  );

  // ── removeFromCart ──────────────────────────────────────────────────
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
        qc.invalidateQueries({ queryKey: ["cart"] });
      } catch {
        // Rollback by re-fetching server state
        await resyncFromServer();
        toast.error("Could not remove item");
      }
    },
    [removeItem, decrement, resyncFromServer, qc],
  );

  return { addToCart, updateQty, removeFromCart, resyncFromServer };
}

// ── 3. Cart sync hook (used by CartInitializer) ───────────────────────────

/**
 * Watches the React-Query ["cart"] cache and keeps the Zustand
 * cartItemsStore hydrated. Call once per layout — not per component.
 */
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
