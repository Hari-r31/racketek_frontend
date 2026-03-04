"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Cart count ────────────────────────────────────────────────────────────
interface CartCount {
  count: number;
  setCount: (n: number) => void;
  increment: (by?: number) => void;
  decrement: (by?: number) => void;
}

export const useCartStore = create<CartCount>((set) => ({
  count: 0,
  setCount: (n) => set({ count: n }),
  increment: (by = 1) => set((s) => ({ count: s.count + by })),
  decrement: (by = 1) => set((s) => ({ count: Math.max(0, s.count - by) })),
}));

// ── UI state ──────────────────────────────────────────────────────────────
interface UIStore {
  mobileMenuOpen: boolean;
  searchOpen: boolean;
  cartDrawerOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  setCartDrawerOpen: (v: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  mobileMenuOpen: false,
  searchOpen: false,
  cartDrawerOpen: false,
  setMobileMenuOpen: (v) => set({ mobileMenuOpen: v }),
  setSearchOpen: (v) => set({ searchOpen: v }),
  setCartDrawerOpen: (v) => set({ cartDrawerOpen: v }),
}));

// ── Wishlist store — global optimistic state ───────────────────────────────
// Stores the set of wishlisted product IDs so every ProductCard reflects
// the real state instantly without waiting for a refetch.
interface WishlistStore {
  ids: Set<number>;
  // called once on login/mount to seed from server
  hydrate: (ids: number[]) => void;
  // optimistic add/remove — call before the API request
  add: (id: number) => void;
  remove: (id: number) => void;
  has: (id: number) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  ids: new Set(),
  hydrate: (ids) => set({ ids: new Set(ids) }),
  add: (id) =>
    set((s) => {
      const next = new Set(s.ids);
      next.add(id);
      return { ids: next };
    }),
  remove: (id) =>
    set((s) => {
      const next = new Set(s.ids);
      next.delete(id);
      return { ids: next };
    }),
  has: (id) => get().ids.has(id),
  clear: () => set({ ids: new Set() }),
}));

// ── Theme store — persisted dark/light mode ────────────────────────────────
type Theme = "light" | "dark";

interface ThemeStore {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "light",
      setTheme: (t) => set({ theme: t }),
      toggle: () => set({ theme: get().theme === "light" ? "dark" : "light" }),
    }),
    { name: "racketek-theme" }
  )
);
