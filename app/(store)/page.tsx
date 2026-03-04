"use client";
/**
 * Homepage — optimised
 * ─────────────────────────────────────────────────────────────────────────────
 * • Single data fetch for homepage sections (no duplicate calls)
 * • React.lazy + Suspense for all heavy below-fold sections
 * • Inline skeletons for above-fold sections
 * • useMemo to prevent re-renders
 */
import React, { Suspense, useMemo, lazy } from "react";
import { useQuery }       from "@tanstack/react-query";
import api                from "@/lib/api";
import { Category }       from "@/types";
import {
  SkeletonHero,
  SkeletonProductGrid,
  Skeleton,
  LoadingCard,
} from "@/components/ui/loaders";

/* ── Above-fold: eager imports (critical for LCP) ───────────────────────── */
import HeroBanners     from "@/components/home/HeroBanners";
import QuickCategories from "@/components/home/QuickCategories";
import TrustIndicators from "@/components/home/TrustIndicators";

/* ── Below-fold: lazy imports (reduce initial JS bundle) ────────────────── */
const MovementSection     = lazy(() => import("@/components/home/MovementSection"));
const HomepageVideos      = lazy(() => import("@/components/home/HomepageVideos"));
const FeaturedProduct     = lazy(() => import("@/components/home/FeaturedProduct"));
const CraftedForChampions = lazy(() => import("@/components/home/CraftedForChampions"));
const BundleBuilder       = lazy(() => import("@/components/home/BundleBuilder"));
const DealOfDay           = lazy(() => import("@/components/home/DealOfDay"));
const ShopTheLook         = lazy(() => import("@/components/home/ShopTheLook"));
const Testimonial         = lazy(() => import("@/components/home/Testimonial"));
const FeaturedCollections = lazy(() => import("@/components/home/FeaturedCollections"));
const BrandSpotlight      = lazy(() => import("@/components/home/BrandSpotlight"));
const AboutRacketOutlet   = lazy(() => import("@/components/home/AboutRacketOutlet"));
const InfoCards           = lazy(() => import("@/components/home/InfoCards"));

/* ── Fallbacks ───────────────────────────────────────────────────────────── */
const SectionFallback  = () => <div className="py-12"><LoadingCard /></div>;
const ProductFallback  = () => (
  <div className="py-16 max-w-7xl mx-auto px-4">
    <Skeleton className="h-8 w-56 mb-8" />
    <SkeletonProductGrid count={4} cols={4} />
  </div>
);
const FeaturedFallback = () => (
  <div className="py-16 max-w-7xl mx-auto px-4">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <Skeleton className="aspect-square rounded-2xl" />
      <div className="space-y-4 py-8">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-12 w-40 mt-4" />
      </div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  /* ── One fetch for all homepage sections ─────────────────────────────── */
  const { data: homepage, isLoading } = useQuery({
    queryKey: ["homepage"],
    queryFn:  () => api.get("/homepage").then(r => r.data.sections),
    staleTime: 1000 * 60 * 5,   // 5 min
    cacheTime: 1000 * 60 * 10,
  });

  /* ── Categories fetch — shared with Navbar, no duplicate ────────────── */
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["root-categories"],
    queryFn:  () => api.get("/categories").then(r => r.data),
    staleTime: 1000 * 60 * 10,
  });

  /* ── Memoised section data — no re-creation on every render ─────────── */
  const s = useMemo(() => homepage || {}, [homepage]);

  return (
    <main>
      {/* ── HERO — above fold, eager ───────────────────────────────────── */}
      <section aria-label="Hero banners">
        {isLoading ? <SkeletonHero /> : <HeroBanners data={s.hero_banners} />}
      </section>

      {/* ── Quick categories — above fold, eager ──────────────────────── */}
      <section aria-label="Shop by sport">
        {isLoading ? (
          <div className="py-10 px-4 max-w-7xl mx-auto">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="w-16 h-16 rounded-2xl" />
                  <Skeleton className="h-3 w-14" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <QuickCategories data={s.quick_categories} categories={categories || []} />
        )}
      </section>

      {/* ── Below-fold: all lazy ──────────────────────────────────────── */}

      <Suspense fallback={<SectionFallback />}>
        <MovementSection data={s.movement_section} />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <HomepageVideos data={s.homepage_videos} />
      </Suspense>

      <Suspense fallback={<FeaturedFallback />}>
        <FeaturedProduct data={s.featured_product} />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <CraftedForChampions data={s.crafted_section} />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <BundleBuilder data={s.bundle_builder} />
      </Suspense>

      {/* TrustIndicators is eager — small + critical for credibility */}
      <TrustIndicators />

      <Suspense fallback={<SectionFallback />}>
        <DealOfDay data={s.deal_of_day} />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <ShopTheLook data={s.shop_the_look} />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <Testimonial data={s.testimonials} />
      </Suspense>

      <Suspense fallback={<ProductFallback />}>
        <FeaturedCollections data={s.featured_collections} />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <BrandSpotlight data={s.brand_spotlight} />
      </Suspense>

      <Suspense fallback={null}>
        <InfoCards />
      </Suspense>

      <Suspense fallback={null}>
        <AboutRacketOutlet data={s.about_section} />
      </Suspense>

    </main>
  );
}
