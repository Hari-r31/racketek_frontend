"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Search, Save, RefreshCw, Package } from "lucide-react";
import { SkeletonTable } from "@/components/ui/loaders";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface InventoryProduct {
  id: number;
  name: string;
  sku?: string;
  brand?: string;
  stock: number;
  low_stock_threshold: number;
  status: string;
  sold_count: number;
  images: { url: string; is_primary: boolean }[];
}

export default function AdminInventoryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [stockEdits, setStockEdits] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  const { data, isLoading, refetch } = useQuery<{ items: InventoryProduct[]; total: number }>({
    queryKey: ["admin-inventory", filter, search],
    queryFn: () => {
      const p = new URLSearchParams({ filter, per_page: "50" });
      if (search) p.set("search", search);
      return api.get(`/admin/inventory?${p.toString()}`).then((r) => r.data);
    },
  });

  const invalidateAfterStockChange = () => {
    qc.invalidateQueries({ queryKey: ["admin-inventory"] });
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const updateStock = async (productId: number) => {
    const newStock = parseInt(stockEdits[productId]);
    if (isNaN(newStock) || newStock < 0) {
      toast.error("Enter a valid stock number");
      return;
    }
    setSaving((s) => ({ ...s, [productId]: true }));
    try {
      await api.put(`/admin/products/${productId}`, { stock: newStock });
      invalidateAfterStockChange();
      setStockEdits((e) => { const n = { ...e }; delete n[productId]; return n; });
      toast.success("Stock updated");
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving((s) => ({ ...s, [productId]: false }));
    }
  };

  const bulkUpdateAll = useMutation({
    mutationFn: () => {
      const updates = Object.entries(stockEdits).map(([id, stock]) => ({
        product_id: parseInt(id),
        stock: parseInt(stock),
      }));
      return api.post("/admin/inventory/bulk-update", { updates });
    },
    onSuccess: () => {
      invalidateAfterStockChange();
      setStockEdits({});
      toast.success(`${Object.keys(stockEdits).length} products updated!`);
    },
    onError: () => toast.error("Bulk update failed"),
  });

  const pendingEdits = Object.keys(stockEdits).length;
  const products = data?.items || [];

  const lowStock = products.filter(
    (p) => p.stock > 0 && p.stock <= p.low_stock_threshold
  ).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Inventory Management</h1>
          <p className="text-sm text-gray-400 mt-1">{data?.total || 0} products tracked</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingEdits > 0 && (
            <button
              onClick={() => bulkUpdateAll.mutate()}
              disabled={bulkUpdateAll.isPending}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Save size={14} />
              Save All ({pendingEdits})
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setFilter("all")}
          className={`card p-4 text-left transition-all ${filter === "all" ? "ring-2 ring-brand-500" : "hover:shadow-md"}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{data?.total || 0}</p>
              <p className="text-xs text-gray-500">All Products</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setFilter("low")}
          className={`card p-4 text-left transition-all ${filter === "low" ? "ring-2 ring-amber-500" : "hover:shadow-md"}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <AlertTriangle size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-amber-700">{lowStock}</p>
              <p className="text-xs text-gray-500">Low Stock</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setFilter("out")}
          className={`card p-4 text-left transition-all ${filter === "out" ? "ring-2 ring-red-500" : "hover:shadow-md"}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-red-700">{outOfStock}</p>
              <p className="text-xs text-gray-500">Out of Stock</p>
            </div>
          </div>
        </button>
      </div>

      {/* Search + filter bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-8 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "low", "out"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "All" : f === "low" ? "Low Stock" : "Out of Stock"}
            </button>
          ))}
        </div>
        {pendingEdits > 0 && (
          <span className="text-xs text-amber-600 font-medium ml-auto">
            ⚠ {pendingEdits} unsaved change{pendingEdits > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-200 rounded-lg" />
            ))}
          </div>
        ) : isLoading ? (
          <table className="w-full"><tbody><SkeletonTable rows={8} cols={7} /></tbody></table>
        ) : products.length === 0 ? (
          <div className="p-16 text-center">
            <Package size={48} className="text-gray-200 mx-auto mb-4" />
            <h3 className="font-bold text-gray-700 mb-2">
              {filter === "low"
                ? "No low-stock products 🎉"
                : filter === "out"
                ? "No out-of-stock products 🎉"
                : "No products found"}
            </h3>
            <p className="text-gray-400 text-sm">
              {filter !== "all" ? "All stock levels look healthy" : "Try adjusting your search"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left bg-gray-50">
                <th className="px-4 py-3 font-semibold text-gray-600">Product</th>
                <th className="px-4 py-3 font-semibold text-gray-600">SKU</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Current Stock</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Alert At</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Sold</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Update Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => {
                const isOut = p.stock === 0;
                const isLow = p.stock > 0 && p.stock <= p.low_stock_threshold;
                const editVal = stockEdits[p.id];
                const isDirty = editVal !== undefined;
                return (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${isOut ? "bg-red-50/30" : isLow ? "bg-amber-50/30" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                          {p.images?.[0] ? (
                            <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">🏆</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate max-w-[200px]">{p.name}</p>
                          {p.brand && <p className="text-xs text-gray-400">{p.brand}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-lg font-black ${
                          isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-green-600"
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.low_stock_threshold}</td>
                    <td className="px-4 py-3 text-gray-600">{p.sold_count}</td>
                    <td className="px-4 py-3">
                      {isOut ? (
                        <span className="badge bg-red-100 text-red-700">Out of Stock</span>
                      ) : isLow ? (
                        <span className="badge bg-amber-100 text-amber-700">Low Stock</span>
                      ) : (
                        <span className="badge bg-green-100 text-green-700">In Stock</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={editVal !== undefined ? editVal : p.stock}
                          onChange={(e) =>
                            setStockEdits((prev) => ({ ...prev, [p.id]: e.target.value }))
                          }
                          className={`w-24 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 ${
                            isDirty
                              ? "border-brand-400 ring-brand-200 bg-brand-50"
                              : "border-gray-200 focus:ring-brand-500"
                          }`}
                        />
                        {isDirty && (
                          <button
                            onClick={() => updateStock(p.id)}
                            disabled={saving[p.id]}
                            className="h-8 px-3 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
                          >
                            {saving[p.id] ? "..." : "Save"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
