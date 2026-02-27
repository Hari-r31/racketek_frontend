"use client";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { PaginatedProducts, Category } from "@/types";
import ProductCard from "@/components/products/ProductCard";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "best_selling", label: "Best Selling" },
  { value: "rating", label: "Highest Rated" },
];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter state
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [inStock, setInStock] = useState(searchParams.get("in_stock") === "true");
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams();
  if (sort) queryParams.set("sort", sort);
  if (search) queryParams.set("search", search);
  if (minPrice) queryParams.set("min_price", minPrice);
  if (maxPrice) queryParams.set("max_price", maxPrice);
  if (inStock) queryParams.set("in_stock", "true");
  queryParams.set("page", String(page));
  queryParams.set("per_page", "20");

  const { data, isLoading } = useQuery<PaginatedProducts>({
    queryKey: ["products", queryParams.toString()],
    queryFn: () => api.get(`/products?${queryParams.toString()}`).then((r) => r.data),
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories/all").then((r) => r.data),
  });

  const handleFilterApply = () => {
    setPage(1);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setInStock(false);
    setSort("newest");
    setPage(1);
  };

  const hasFilters = search || minPrice || maxPrice || inStock;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {search ? `Results for "${search}"` : "All Products"}
          </h1>
          {data && (
            <p className="text-gray-500 text-sm mt-1">{data.total} products found</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="input w-auto text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Filter toggle */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal size={15} />
            Filters
            {hasFilters && <span className="w-2 h-2 bg-brand-600 rounded-full" />}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="shrink-0 card p-5 h-fit overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Filters</h3>
                <div className="flex items-center gap-2">
                  {hasFilters && (
                    <button onClick={clearFilters} className="text-xs text-red-500 hover:underline">
                      Clear all
                    </button>
                  )}
                  <button onClick={() => setFiltersOpen(false)}>
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="mb-5">
                <label className="label">Search</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Product name, brand..."
                  className="input text-sm"
                />
              </div>

              {/* Price Range */}
              <div className="mb-5">
                <label className="label">Price Range (₹)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="input text-sm w-1/2"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="input text-sm w-1/2"
                  />
                </div>
              </div>

              {/* In Stock */}
              <div className="mb-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded"
                  />
                  <span className="text-sm text-gray-700">In Stock Only</span>
                </label>
              </div>

              <button onClick={handleFilterApply} className="btn-primary w-full text-sm">
                Apply Filters
              </button>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-5 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.items?.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🔍</p>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters</p>
              <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {data?.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {data && data.total_pages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-10">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-medium text-gray-700">
                    Page {page} of {data.total_pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                    disabled={page === data.total_pages}
                    className="p-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  >
                    <ChevronRight size={18} />
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
