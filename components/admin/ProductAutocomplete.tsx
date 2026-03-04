"use client";
/**
 * ProductAutocomplete
 * ───────────────────
 * Searchable selector for admin panel product_id fields.
 *
 * Features
 *   • 300 ms debounced search against GET /admin/products/search?q=
 *   • Search by name, SKU, or category
 *   • Returns top 10 results
 *   • Stores product_id internally; displays name + SKU to the user
 *   • Prevents free-text entry of invalid IDs
 *   • Keyboard navigable (↑ ↓ Enter Escape)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Check, ChevronDown, Package, Loader2 } from "lucide-react";
import api from "@/lib/api";

/* ─── Types ─────────────────────────────────────────────────────────────── */
export interface ProductOption {
  id:            number;
  name:          string;
  sku:           string | null;
  price:         number;
  stock:         number;
  status:        string;
  category_name: string | null;
}

export interface ProductAutocompleteProps {
  /** Currently selected product_id (controlled) */
  value:     number | null | undefined;
  /** Called with the new product_id (or null on clear) */
  onChange:  (id: number | null) => void;
  /** Optional label shown inside the trigger button when nothing is selected */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Class overrides on the outer wrapper */
  className?: string;
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function formatPrice(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function StatusDot({ status }: { status: string }) {
  const colour =
    status === "active"       ? "bg-emerald-500" :
    status === "out_of_stock" ? "bg-red-500"     :
                                "bg-gray-400";
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${colour} shrink-0`} />;
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function ProductAutocomplete({
  value,
  onChange,
  placeholder = "Search products…",
  required,
  className = "",
}: ProductAutocompleteProps) {
  const [open,        setOpen]        = useState(false);
  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState<ProductOption[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [selected,    setSelected]    = useState<ProductOption | null>(null);
  const [cursor,      setCursor]      = useState(-1);

  const wrapperRef  = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Fetch selected product info when value changes externally ─────────── */
  useEffect(() => {
    if (!value) { setSelected(null); return; }
    if (selected?.id === value) return;          // already in sync

    // Fetch by ID so we always show name + SKU for pre-filled IDs
    api
      .get(`/admin/products/search?q=&id=${value}`)
      .then(r => {
        // Our search endpoint doesn't support ?id=, so fall back to the
        // full product endpoint to hydrate a pre-existing value.
      })
      .catch(() => {});

    api.get(`/admin/products/${value}`).then(r => {
      const p = r.data;
      setSelected({
        id:            p.id,
        name:          p.name,
        sku:           p.sku ?? null,
        price:         p.price,
        stock:         p.stock,
        status:        p.status,
        category_name: p.category?.name ?? null,
      });
    }).catch(() => setSelected(null));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Debounced search ────────────────────────────────────────────────── */
  const runSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); setLoading(false); return; }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get<ProductOption[]>(
          `/admin/products/search?q=${encodeURIComponent(q.trim())}`
        );
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setCursor(-1);
    runSearch(q);
  };

  /* ── Selection ───────────────────────────────────────────────────────── */
  const select = (opt: ProductOption) => {
    setSelected(opt);
    onChange(opt.id);
    setOpen(false);
    setQuery("");
    setResults([]);
    setCursor(-1);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(null);
    onChange(null);
  };

  /* ── Open / close ────────────────────────────────────────────────────── */
  const openDropdown = () => {
    setOpen(true);
    setQuery("");
    setResults([]);
    setCursor(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Close on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  /* ── Keyboard navigation ─────────────────────────────────────────────── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && cursor >= 0) { e.preventDefault(); select(results[cursor]); }
    if (e.key === "Escape")    { setOpen(false); }
  };

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div ref={wrapperRef} className={`relative ${className}`}>

      {/* ── Trigger ──────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={openDropdown}
        className={[
          "w-full flex items-center gap-2 px-3.5 py-2.5 text-sm rounded-lg border transition-all text-left",
          open
            ? "border-brand-500 ring-3 ring-brand-500/10 bg-white"
            : "border-gray-300 bg-white hover:border-gray-400",
        ].join(" ")}
      >
        {selected ? (
          <>
            <Check size={13} className="text-emerald-500 shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="font-medium text-gray-900 truncate block">{selected.name}</span>
              {selected.sku && (
                <span className="text-[11px] text-gray-400 font-mono">{selected.sku}</span>
              )}
            </span>
            <button
              type="button"
              onClick={clear}
              className="ml-1 p-0.5 text-gray-400 hover:text-red-500 transition-colors rounded"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <Search size={13} className="text-gray-400 shrink-0" />
            <span className="text-gray-400 flex-1">
              {placeholder}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </span>
            <ChevronDown size={13} className="text-gray-400 shrink-0" />
          </>
        )}
      </button>

      {/* Hidden input so forms can read the numeric value */}
      <input
        type="hidden"
        value={selected?.id ?? ""}
        readOnly
      />

      {/* ── Dropdown ─────────────────────────────────────────────────── */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search box */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
            {loading
              ? <Loader2 size={13} className="text-brand-500 animate-spin shrink-0" />
              : <Search size={13} className="text-gray-400 shrink-0" />
            }
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              placeholder="Name, SKU or category…"
              className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-64 overflow-y-auto py-1">
            {!query.trim() ? (
              <div className="flex flex-col items-center gap-1.5 py-8 text-gray-400">
                <Search size={20} className="text-gray-300" />
                <p className="text-xs">Type to search products</p>
              </div>
            ) : loading && results.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-8 text-gray-400 text-xs">
                <Loader2 size={14} className="animate-spin" /> Searching…
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-8 text-gray-400">
                <Package size={20} className="text-gray-300" />
                <p className="text-xs">No products found for "{query}"</p>
              </div>
            ) : (
              results.map((opt, i) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => select(opt)}
                  className={[
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    i === cursor
                      ? "bg-brand-50 text-brand-700"
                      : "hover:bg-gray-50 text-gray-800",
                    selected?.id === opt.id ? "bg-emerald-50" : "",
                  ].join(" ")}
                >
                  {/* Status dot */}
                  <StatusDot status={opt.status} />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{opt.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {opt.sku && (
                        <span className="text-[11px] text-gray-400 font-mono">{opt.sku}</span>
                      )}
                      {opt.category_name && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-[11px] text-gray-400">{opt.category_name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Price + stock */}
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-gray-700">{formatPrice(opt.price)}</p>
                    <p className={`text-[10px] mt-0.5 ${opt.stock === 0 ? "text-red-500" : "text-gray-400"}`}>
                      {opt.stock === 0 ? "Out of stock" : `${opt.stock} in stock`}
                    </p>
                  </div>

                  {/* Selected checkmark */}
                  {selected?.id === opt.id && (
                    <Check size={13} className="text-emerald-500 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer hint */}
          {results.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 text-[10px] text-gray-400 flex items-center gap-1">
              <span className="font-mono bg-gray-100 rounded px-1">↑↓</span> navigate ·
              <span className="font-mono bg-gray-100 rounded px-1">↵</span> select ·
              <span className="font-mono bg-gray-100 rounded px-1">Esc</span> close
              <span className="ml-auto">{results.length} result{results.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
