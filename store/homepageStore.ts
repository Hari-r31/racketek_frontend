"use client";
import { create } from "zustand";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface HomepageSections {
  hero_banners?:          { banners: any[] };
  movement_section?:      { headline: string; highlight_word: string; paragraph: string; cta_text: string; cta_link: string };
  homepage_videos?:       { videos: any[] };
  featured_product?:      { product?: any; badge?: string; product_id?: number };
  crafted_section?:       { before_image?: string; after_image?: string; headline?: string; subtext?: string };
  athletes_image?:        { image_url?: string; alt?: string; caption?: string };
  shop_the_look?:         { player_image?: string; headline?: string; products?: any[] };
  testimonials?:          { testimonials?: any[] };
  featured_collections?:  { title?: string; products?: any[] };
  about_section?:         { brand_description?: string; top_categories?: string[]; top_cities?: string[]; goal?: string };
}

interface HomepageStore {
  sections: HomepageSections;
  loading: boolean;
  error: string | null;
  fetched: boolean;
  fetchHomepage: () => Promise<void>;
}

export const useHomepageStore = create<HomepageStore>((set, get) => ({
  sections: {},
  loading: false,
  error: null,
  fetched: false,

  fetchHomepage: async () => {
    if (get().fetched) return;            // prevent duplicate fetches
    set({ loading: true, error: null });
    try {
      const res = await api.get("/homepage");
      set({ sections: res.data.sections, loading: false, fetched: true });
    } catch (e: any) {
      set({ loading: false, error: "Failed to load homepage content" });
    }
  },
}));
