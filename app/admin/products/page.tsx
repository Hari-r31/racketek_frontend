"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, Edit3, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", page, search],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), per_page: "20" });
      if (search) p.set("search", search);
      return api.get(`/products?${p.toString()}`).then((r) => r.data);
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: number) => api.delete(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.put(`/products/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Products</h1>
        <Link href="/admin/products/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-8 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-4 py-3 font-semibold text-gray-600 w-12"></th>
              <th className="px-4 py-3 font-semibold text-gray-600">Product</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Price</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Stock</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Sold</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data?.items?.map((product: any) => {
              const img = product.images?.find((i: any) => i.is_primary) || product.images?.[0];
              return (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                      {img ? (
                        <Image src={img.url} alt="" width={40} height={40} className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">🏆</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800 line-clamp-1">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.brand || product.sku || "—"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-medium ${
                        product.stock === 0
                          ? "text-red-600"
                          : product.stock <= product.low_stock_threshold
                          ? "text-amber-600"
                          : "text-green-600"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        product.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{product.sold_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-brand-50 hover:border-brand-300 transition-colors"
                      >
                        <Edit3 size={12} className="text-gray-500" />
                      </Link>
                      <button
                        onClick={() =>
                          toggleStatus.mutate({
                            id: product.id,
                            status: product.status === "active" ? "inactive" : "active",
                          })
                        }
                        className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {product.status === "active" ? (
                          <EyeOff size={12} className="text-gray-500" />
                        ) : (
                          <Eye size={12} className="text-gray-500" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this product?")) deleteProduct.mutate(product.id);
                        }}
                        className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                      >
                        <Trash2 size={12} className="text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {data?.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{data.total} products total</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 border rounded-lg disabled:opacity-40">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages} className="p-1.5 border rounded-lg disabled:opacity-40">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
