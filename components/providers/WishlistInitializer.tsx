"use client";
/**
 * WishlistInitializer
 * Fetches the user's wishlist IDs from the server once on mount (when
 * authenticated) and seeds the global useWishlistStore so every ProductCard
 * can show the correct heart state without any additional per-card queries.
 *
 * Renders nothing — drop it once inside StoreLayout.
 */
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/uiStore";
import api from "@/lib/api";

export default function WishlistInitializer() {
  const { isAuthenticated } = useAuthStore();
  const { hydrate, clear } = useWishlistStore();

  useEffect(() => {
    if (!isAuthenticated) {
      clear();
      return;
    }
    api
      .get("/wishlist")
      .then((r) => {
        const ids: number[] = (r.data as { id: number }[]).map((p) => p.id);
        hydrate(ids);
      })
      .catch(() => {
        // Silently fail — hearts just won't be pre-filled
      });
  }, [isAuthenticated, hydrate, clear]);

  return null;
}
