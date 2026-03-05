"use client";
import { useQuery } from "@tanstack/react-query";
import {
  useState, useEffect, useRef, useMemo, useCallback, memo, Suspense,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { PaginatedProducts, Category } from "@/types";
import ProductCard from "@/components/products/ProductCard";
import { SkeletonProductCard } from "@/components/ui/loaders";
import {
  SlidersHorizontal, X, ChevronLeft, ChevronRight,
  Search as SearchIcon, Package, Star,
} from "lucide-react";
import { useDebounce } from "@/lib/hooks";

const MemoProductCard = memo(ProductCard);

const SORT_OPTIONS = [
  { value: "newest",       label: "Newest First" },
  { value: "price_asc",    label: "Price: Low → High" },
  { value: "price_desc",   label: "Price: High → Low" },
  { value: "best_selling", label: "Best Selling" },
  { value: "rating",       label: "Highest Rated" },
];

const RATING_OPTIONS = [
  { value: "", label: "Any Rating" },
  { value: "4", label: "4★ & above" },
  { value: "3", label: "3★ & above" },
  { value: "2", label: "2★ & above" },
];

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => <SkeletonProductCard key={i} />)}
    </div>
  );
}

function ProductsPageInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const urlSearch    = searchParams.get("search")    || "";
  const urlCategory  = searchParams.get("category")  || "";
  const urlBrand     = searchParams.get("brand")     || "";
  const urlSort      = searchParams.get("sort")      || "newest";
  const urlMinPrice  = searchParams.get("min_price") || "";
  const urlMaxPrice  = searchParams.get("max_price") || "";
  const urlInStock   = searchParams.get("in_stock")  === "true";
  const urlMinRating = searchParams.get("min_rating")|| "";
  const urlFeatured  = searchParams.get("is_featured")=== "true";
  const urlPage      = parseInt(searchParams.get("page") || "1");

  const [localSearch,   setLocalSearch]   = useState(urlSearch);
  const [localBrand,    setLocalBrand]    = useState(urlBrand);
  const [sort,          setSort]          = useState(urlSort);
  const [minPrice,      setMinPrice]      = useState(urlMinPrice);
  const [maxPrice,      setMaxPrice]      = useState(urlMaxPrice);
  const [inStock,       setInStock]       = useState(urlInStock);
  const [minRating,     setMinRating]     = useState(urlMinRating);
  const [isFeatured,    setIsFeatured]    = useState(urlFeatured);
  const [page,          setPage]          = useState(urlPage);
  const [filtersOpen,   setFiltersOpen]   = useState(false);

  useEffect(() => {
    setLocalSearch(urlSearch);
    setLocalBrand(urlBrand);
    setSort(urlSort);
    setMinPrice(urlMinPrice);
    setMaxPrice(urlMaxPrice);
    setInStock(urlInStock);
    setMinRating(urlMinRating);
    setIsFeatured(urlFeatured);
    setPage(urlPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const debouncedSearch = useDebounce(localSearch.trim(), 400);
  const debouncedBrand  = useDebounce(localBrand.trim(), 400);

  const queryKey = useMemo(() => {
    const p = new URLSearchParams();
    if (debouncedSearch) p.set("search",      debouncedSearch);
    if (urlCategory)     p.set("category",    urlCategory);
    if (debouncedBrand)  p.set("brand",       debouncedBrand);
    if (sort)            p.set("sort",        sort);
    if (minPrice)        p.set("min_price",   minPrice);
    if (maxPrice)        p.set("max_price",   maxPrice);
    if (inStock)         p.set("in_stock",    "true");
    if (minRating)       p.set("min_rating",  minRating);
    if (isFeatured)      p.set("is_featured", "true");
    p.set("page",     String(page));
    p.set("per_page", "20");
    return p.toString();
  }, [debouncedSearch, urlCategory, debouncedBrand, sort, minPrice, maxPrice, inStock, minRating, isFeatured, page]);

  const { data, isLoading, isFetching, isPreviousData } = useQuery<PaginatedProducts>({
    queryKey: ["products", queryKey],
    queryFn: ({ signal }) =>
      api.get(`/products?${queryKey}`, { signal }).then(r => r.data),
    keepPreviousData: true,
    staleTime: 30_000,
  });

  // Fetch distinct brands for the filter sidebar — uses dedicated /brands endpoint (no per_page limit)
  const { data: brandsData } = useQuery<string[]>({
    queryKey: ["product-brands", urlCategory],
    queryFn: () => {
      const p = new URLSearchParams();
      if (urlCategory) p.set("category", urlCategory);
      return api.get(`/products/brands${p.toString() ? `?${p.toString()}` : ""}`).then(r => r.data);
    },
    staleTime: 300_000,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories-flat"],
    queryFn: () => api.get("/categories/all").then(r => r.data),
    staleTime: 600_000,
  });

  const topRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isPreviousData && topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [page, isPreviousData]);

  const buildUrl = useCallback((overrides: Record<string, string> = {}) => {
    const p = new URLSearchParams();
    if (localSearch.trim()) p.set("search",      localSearch.trim());
    if (urlCategory)        p.set("category",    urlCategory);
    if (localBrand.trim())  p.set("brand",       localBrand.trim());
    if (sort)               p.set("sort",        sort);
    if (minPrice)           p.set("min_price",   minPrice);
    if (maxPrice)           p.set("max_price",   maxPrice);
    if (inStock)            p.set("in_stock",    "true");
    if (minRating)          p.set("min_rating",  minRating);
    if (isFeatured)         p.set("is_featured", "true");
    p.set("page", "1");
    Object.entries(overrides).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k));
    return `/products?${p.toString()}`;
  }, [localSearch, urlCategory, localBrand, sort, minPrice, maxPrice, inStock, minRating, isFeatured]);

  const applyFilters = useCallback(() => {
    router.push(buildUrl());
    setFiltersOpen(false);
  }, [buildUrl, router]);

  const clearFilters = useCallback(() => {
    const p = new URLSearchParams();
    if (urlCategory) p.set("category", urlCategory);
    router.push(`/products?${p.toString()}`);
  }, [urlCategory, router]);

  const changePage = useCallback((next: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("page", String(next));
    router.push(`/products?${p.toString()}`);
  }, [searchParams, router]);

  const activeCategory = categories?.find(c => c.slug === urlCategory);
  const hasFilters     = !!(localSearch || localBrand || minPrice || maxPrice || inStock || minRating || isFeatured);
  const showSkeleton   = isLoading;
  const showStale      = isFetching && !isLoading;

  const pageTitle = useMemo(() => {
    if (activeCategory) return activeCategory.name;
    if (urlSearch)      return `Results for "${urlSearch}"`;
    if (urlBrand)       return urlBrand;
    return "All Products";
  }, [activeCategory, urlSearch, urlBrand]);

  return (
    <div ref={topRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            {pageTitle}
            {showStale && <span className="inline-block w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />}
          </h1>
          {activeCategory?.description && <p className="text-sm text-gray-400 mt-0.5">{activeCategory.description}</p>}
          {data && <p className="text-xs text-gray-400 mt-1">{data.total} product{data.total !== 1 ? "s" : ""} found</p>}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={e => { setSort(e.target.value); router.push(buildUrl({ sort: e.target.value })); }}
            className="input py-2"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className={`flex items-center gap-2 border rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filtersOpen || hasFilters
                ? "border-brand-500 text-brand-600 bg-brand-50"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal size={14} />
            Filters
            {hasFilters && <span className="w-1.5 h-1.5 bg-brand-600 rounded-full" />}
          </button>
        </div>
      </div>

      <div className="flex gap-6">

        {/* Filters sidebar */}
        {filtersOpen && (
          <aside className="shrink-0 w-64 bg-white rounded-xl border border-gray-200 p-5 h-fit self-start sticky top-20">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Filters</h3>
              <div className="flex items-center gap-2">
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-red-500 hover:underline">Clear all</button>
                )}
                <button onClick={() => setFiltersOpen(false)} className="text-gray-400 hover:text-gray-700">
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Search</label>
              <div className="relative">
                <SearchIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  placeholder="Product name…"
                  className="input py-2 pl-8 pr-3"
                />
              </div>
            </div>

            {/* Brand filter */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Brand</label>
              {brandsData && brandsData.length > 0 ? (
                <select
                  value={localBrand}
                  onChange={e => setLocalBrand(e.target.value)}
                  className="input py-2"
                >
                  <option value="">All Brands</option>
                  {brandsData.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              ) : (
                <input
                  type="text" value={localBrand}
                  onChange={e => setLocalBrand(e.target.value)}
                  placeholder="e.g. Yonex"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              )}
            </div>

            {/* Price */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Price Range (₹)</label>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <input type="number" placeholder="Max" value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>

            {/* Rating */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1">
                <Star size={11} className="text-yellow-400 fill-yellow-400" /> Min. Rating
              </label>
              <div className="space-y-1.5">
                {RATING_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio" name="rating"
                      checked={minRating === opt.value}
                      onChange={() => setMinRating(opt.value)}
                      className="text-brand-600"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2.5 mb-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-gray-300" />
                <span className="text-sm text-gray-700">In Stock Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-gray-300" />
                <span className="text-sm text-gray-700">Featured Only</span>
              </label>
            </div>

            <button onClick={applyFilters}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
              Apply Filters
            </button>
          </aside>
        )}

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {showSkeleton ? (
            <ProductSkeleton />
          ) : data?.items?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Package size={48} className="text-gray-200 mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">No products found</h3>
              <p className="text-sm text-gray-400 mb-6">Try adjusting your filters or search term</p>
              <button onClick={clearFilters}
                className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 transition-opacity duration-200 ${showStale ? "opacity-60" : "opacity-100"}`}>
                {data?.items.map((product, idx) => (
                  <MemoProductCard key={product.id} product={product} priority={idx < 4} />
                ))}
                {showStale && Array.from({ length: 4 }).map((_, i) => <SkeletonProductCard key={`sk-${i}`} />)}
              </div>

              {data && data.total_pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button onClick={() => changePage(Math.max(1, page - 1))} disabled={page === 1}
                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: data.total_pages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === data.total_pages || Math.abs(p - page) <= 2)
                      .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === "…"
                          ? <span key={`e-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                          : <button key={p} onClick={() => changePage(p as number)}
                              className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${p === page ? "bg-brand-600 text-white shadow-sm" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                              {p}
                            </button>
                      )}
                  </div>
                  <button onClick={() => changePage(Math.min(data.total_pages, page + 1))} disabled={page === data.total_pages}
                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ProductsPageInner />
    </Suspense>
  );
}
