"use client";
import { create } from "zustand";

interface CartCount {
  count: number;
  setCount: (n: number) => void;
  increment: () => void;
  decrement: () => void;
}

export const useCartStore = create<CartCount>((set) => ({
  count: 0,
  setCount: (n) => set({ count: n }),
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
}));

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
