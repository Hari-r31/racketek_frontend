"use client";
/**
 * cartStore.ts
 * ============
 * Lightweight Zustand store that holds a per-product cart state map.
 * This is the single client-side source of truth for "is product X in cart?"
 * and "what's its current quantity?".
 *
 * The map is seeded by CartInitializer (server sync) and kept in sync by
 * useCartActions (optimistic mutations). No component should maintain its
 * own local cart-item state.
 *
 * Key format: `${productId}:${variantId ?? 0}`
 */
import { create } from "zustand";
import { CartItem } from "@/types";

// ── Types ──────────────────────────────────────────────────────────────────

export interface CartItemEntry {
  /** The cart item row id — needed for PUT /cart/items/:id and DELETE */
  cartItemId: number;
  quantity: number;
}

/** Maps "productId:variantId" → CartItemEntry */
export type CartItemsMap = Record<string, CartItemEntry>;

export function cartKey(
  productId: number,
  variantId?: number | null,
): string {
  return `${productId}:${variantId ?? 0}`;
}

// ── Store ──────────────────────────────────────────────────────────────────

interface CartItemsStore {
  items: CartItemsMap;

  /**
   * Seed/replace the entire map from a server CartItem array.
   * Called by CartInitializer whenever the ["cart"] RQ cache updates.
   * Save-for-later items are excluded (they are not "in cart").
   */
  hydrate: (cartItems: CartItem[]) => void;

  /** Upsert one entry (used after add / qty update). */
  setItem: (
    productId: number,
    variantId: number | null | undefined,
    entry: CartItemEntry,
  ) => void;

  /** Remove one entry (used after delete). */
  removeItem: (productId: number, variantId: number | null | undefined) => void;

  /** Selector helper — returns null if not in cart. */
  getItem: (
    productId: number,
    variantId?: number | null,
  ) => CartItemEntry | null;

  /** Clear everything on logout. */
  clear: () => void;
}

export const useCartItemsStore = create<CartItemsStore>((set, get) => ({
  items: {},

  hydrate: (cartItems) => {
    const map: CartItemsMap = {};
    for (const ci of cartItems) {
      if (ci.save_for_later) continue;
      map[cartKey(ci.product_id, ci.variant_id)] = {
        cartItemId: ci.id,
        quantity: ci.quantity,
      };
    }
    set({ items: map });
  },

  setItem: (productId, variantId, entry) =>
    set((s) => ({
      items: { ...s.items, [cartKey(productId, variantId)]: entry },
    })),

  removeItem: (productId, variantId) =>
    set((s) => {
      const next = { ...s.items };
      delete next[cartKey(productId, variantId)];
      return { items: next };
    }),

  getItem: (productId, variantId) =>
    get().items[cartKey(productId, variantId)] ?? null,

  clear: () => set({ items: {} }),
}));
