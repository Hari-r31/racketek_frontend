"use client";
/**
 * CartInitializer
 * ===============
 * Mirrors WishlistInitializer — renders nothing, syncs once on mount.
 *
 * • Fetches GET /cart when the user is authenticated.
 * • Writes the result into the Zustand cartItemsStore via hydrate().
 * • Keeps the navbar cart-count badge accurate.
 * • Re-syncs whenever the ["cart"] React-Query cache is invalidated
 *   (e.g. after an add/remove on any page).
 *
 * Drop once inside StoreLayout — do NOT add to individual pages.
 */
import { useEffect } from "react";
import { useQuery }  from "@tanstack/react-query";
import { useAuthStore }     from "@/store/authStore";
import { useCartItemsStore } from "@/store/cartStore";
import { useCartStore }     from "@/store/uiStore";
import api  from "@/lib/api";
import { Cart } from "@/types";

export default function CartInitializer() {
  const { isAuthenticated } = useAuthStore();
  const { hydrate, clear }  = useCartItemsStore();
  const { setCount }        = useCartStore();

  const { data: cart } = useQuery<Cart>({
    queryKey: ["cart"],
    queryFn : () => api.get("/cart").then((r) => r.data),
    enabled : isAuthenticated,
    staleTime: 30_000,   // treat as fresh for 30 s to avoid hammering the API
  });

  useEffect(() => {
    if (!isAuthenticated) {
      clear();
      setCount(0);
      return;
    }
    if (!cart) return;

    const active = cart.items.filter((i) => !i.save_for_later);
    setCount(active.reduce((s, i) => s + i.quantity, 0));
    hydrate(cart.items);
  }, [cart, isAuthenticated, hydrate, clear, setCount]);

  return null;
}
