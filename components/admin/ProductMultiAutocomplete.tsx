"use client";
/**
 * ProductMultiAutocomplete
 * ────────────────────────
 * Multi-select version of ProductAutocomplete for product_ids[] fields.
 *
 * Features
 *   • Same 300 ms debounced search as the single-select variant
 *   • Selected products shown as removable chips (name + SKU)
 *   • Duplicate selection is silently ignored
 *   • Keyboard: ↑ ↓ Enter Escape, Backspace removes last chip
 *   • max prop limits how many can be selected (default: unlimited)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Check, Package, Loader2, Plus } from "lucide-react";
import api from "@/lib/api";
import type { ProductOption } from "./ProductAutocomplete";

export interface ProductMultiAutocompleteProps {
  /** Controlled array of product IDs */
  value:      number[];
  /** Called with the updated full array */
  onChange:   (ids: number[]) => void;
  /** Max selections (default: unlimited) */
  max?:       number;
  placeholder?: string;
  className?: string;
  /** Compact chip mode — fewer lines of metadata shown */
  compact?:   boolean;
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
export default function ProductMultiAutocomplete({
  value,
  onChange,
  max,
  placeholder = "Search and add products…",
  className = "",
  compact = false,
}: ProductMultiAutocompleteProps) {
  const [open,        setOpen]        = useState(false);
  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState<ProductOption[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [selectedMap, setSelectedMap] = useState<Map<number, ProductOption>>(new Map());
  const [cursor,      setCursor]      = useState(-1);

  const wrapperRef  = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Hydrate pre-existing IDs → display info ────────────────────────── */
  useEffect(() => {
    if (!value.length) { setSelectedMap(new Map()); return; }

    const missing = value.filter(id => !selectedMap.has(id));
    if (!missing.length) return;

    // Fetch each missing product (N small calls — acceptable, IDs come from
    // saved config so this only runs once on mount / when IDs change externally)
    Promise.all(missing.map(id =>
      api.get(`/admin/products/${id}`).then(r => {
        const p = r.data;
        return [id, {
          id:            p.id,
          name:          p.name,
          sku:           p.sku ?? null,
          price:         p.price,
          stock:         p.stock,
          status:        p.status,
          category_name: p.category?.name ?? null,
        } as ProductOption] as [number, ProductOption];
      }).catch(() => null)
    )).then(pairs => {
      const valid = pairs.filter(Boolean) as [number, ProductOption][];
      if (!valid.length) return;
      setSelectedMap(prev => {
        const next = new Map(prev);
        valid.forEach(([id, opt]) => next.set(id, opt));
        return next;
      });
    });
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
    if (!open) setOpen(true);
  };

  /* ── Add / remove ────────────────────────────────────────────────────── */
  const addProduct = (opt: ProductOption) => {
    if (value.includes(opt.id)) return;      // no duplicates
    if (max && value.length >= max) return;  // respect cap
    setSelectedMap(prev => new Map(prev).set(opt.id, opt));
    onChange([...value, opt.id]);
    setQuery("");
    setResults([]);
    setCursor(-1);
    inputRef.current?.focus();
  };

  const removeProduct = (id: number) => {
    setSelectedMap(prev => { const n = new Map(prev); n.delete(id); return n; });
    onChange(value.filter(v => v !== id));
  };

  /* ── Keyboard ────────────────────────────────────────────────────────── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !query && value.length) {
      removeProduct(value[value.length - 1]);
      return;
    }
    if (!results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && cursor >= 0) { e.preventDefault(); addProduct(results[cursor]); }
    if (e.key === "Escape")    { setOpen(false); }
  };

  /* ── Outside click ───────────────────────────────────────────────────── */
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const atMax    = !!(max && value.length >= max);
  const orderedOptions = selectedMap;

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div ref={wrapperRef} className={`relative ${className}`}>

      {/* ── Chip area + search input ──────────────────────────────────── */}
      <div
        onClick={() => { if (!atMax) { setOpen(true); inputRef.current?.focus(); } }}
        className={[
          "min-h-[42px] w-full flex flex-wrap gap-1.5 px-2.5 py-2 rounded-lg border transition-all cursor-text",
          open
            ? "border-brand-500 ring-3 ring-brand-500/10 bg-white"
            : "border-gray-300 bg-white hover:border-gray-400",
        ].join(" ")}
      >
        {/* Chips for selected products */}
        {value.map(id => {
          const opt = orderedOptions.get(id);
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 bg-brand-50 border border-brand-200 text-brand-800 rounded-md pl-2 pr-1 py-0.5 text-xs font-medium max-w-[200px]"
            >
              <span className="truncate">{opt ? opt.name : `#${id}`}</span>
              {opt?.sku && (
                <span className="font-mono text-brand-400 text-[10px] shrink-0">{opt.sku}</span>
              )}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); removeProduct(id); }}
                className="shrink-0 text-brand-400 hover:text-red-500 transition-colors rounded p-0.5"
              >
                <X size={10} strokeWidth={2.5} />
              </button>
            </span>
          );
        })}

        {/* Search input */}
        {!atMax && (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setOpen(true)}
            placeholder={value.length ? "" : placeholder}
            className="flex-1 min-w-[140px] text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400 py-0.5"
          />
        )}

        {/* Loading indicator */}
        {loading && (
          <span className="self-center ml-1">
            <Loader2 size={12} className="text-brand-500 animate-spin" />
          </span>
        )}

        {/* Max reached hint */}
        {atMax && (
          <span className="text-[11px] text-gray-400 self-center ml-1">
            Max {max} selected
          </span>
        )}
      </div>

      {/* ── Dropdown ─────────────────────────────────────────────────── */}
      {open && !atMax && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Results list */}
          <div className="max-h-60 overflow-y-auto py-1">
            {!query.trim() ? (
              <div className="flex flex-col items-center gap-1.5 py-6 text-gray-400">
                <Search size={18} className="text-gray-300" />
                <p className="text-xs">Type to search products</p>
              </div>
            ) : loading && results.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6 text-gray-400 text-xs">
                <Loader2 size={13} className="animate-spin" /> Searching…
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-6 text-gray-400">
                <Package size={18} className="text-gray-300" />
                <p className="text-xs">No products found for "{query}"</p>
              </div>
            ) : (
              results.map((opt, i) => {
                const alreadyAdded = value.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => addProduct(opt)}
                    disabled={alreadyAdded}
                    className={[
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                      alreadyAdded
                        ? "opacity-50 cursor-not-allowed bg-gray-50"
                        : i === cursor
                          ? "bg-brand-50 text-brand-700"
                          : "hover:bg-gray-50 text-gray-800",
                    ].join(" ")}
                  >
                    <StatusDot status={opt.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{opt.name}</p>
                      {!compact && (
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
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-gray-700">{formatPrice(opt.price)}</p>
                      {!compact && (
                        <p className={`text-[10px] mt-0.5 ${opt.stock === 0 ? "text-red-500" : "text-gray-400"}`}>
                          {opt.stock === 0 ? "Out of stock" : `${opt.stock} in stock`}
                        </p>
                      )}
                    </div>
                    {alreadyAdded
                      ? <Check size={13} className="text-emerald-500 shrink-0" />
                      : <Plus  size={13} className="text-gray-300 shrink-0" />
                    }
                  </button>
                );
              })
            )}
          </div>

          {/* Footer hint */}
          {results.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 text-[10px] text-gray-400 flex items-center gap-1">
              <span className="font-mono bg-gray-100 rounded px-1">↑↓</span> navigate ·
              <span className="font-mono bg-gray-100 rounded px-1">↵</span> add ·
              <span className="font-mono bg-gray-100 rounded px-1">⌫</span> remove last ·
              <span className="font-mono bg-gray-100 rounded px-1">Esc</span> close
              <span className="ml-auto">{value.length}{max ? `/${max}` : ""} selected</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
