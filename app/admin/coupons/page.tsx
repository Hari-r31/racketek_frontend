"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Tag, Trash2, X, CheckCircle2, XCircle, Calendar,
} from "lucide-react";
import api from "@/lib/api";
import { Coupon } from "@/types";
import { formatDate, formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

const schema = z.object({
  code: z
    .string()
    .min(3, "Minimum 3 characters")
    .max(20, "Maximum 20 characters")
    .regex(/^[A-Z0-9_-]+$/i, "Letters, numbers, hyphens, underscores only")
    .transform((val) => val.trim().toUpperCase()),

  description: z.string().optional(),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.coerce.number().min(0.01),
  min_order_value: z.coerce.number().min(0).default(0),
  max_discount_amount: z.coerce.number().optional(),
  usage_limit: z.coerce.number().optional(),
  usage_per_user: z.coerce.number().min(1).default(1),
  expires_at: z.string().optional(),
  is_active: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

function CouponBadge({ coupon }: { coupon: Coupon }) {
  const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
  const isExhausted = coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit;

  if (!coupon.is_active) return <span className="badge bg-gray-100 text-gray-600">Inactive</span>;
  if (isExpired) return <span className="badge bg-red-100 text-red-700">Expired</span>;
  if (isExhausted) return <span className="badge bg-orange-100 text-orange-700">Exhausted</span>;
  return <span className="badge bg-green-100 text-green-700">Active</span>;
}

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: ["admin-coupons"],
    queryFn: () => api.get("/admin/coupons").then((r) => r.data),
  });

  const invalidateCoupons = () => {
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    qc.invalidateQueries({ queryKey: ["coupons"] }); // customer coupon validation cache
  };

  const createCoupon = useMutation({
    mutationFn: (data: FormData) => api.post("/admin/coupons", data),
    onSuccess: () => {
      invalidateCoupons();
      toast.success("Coupon created!");
      setShowForm(false);
      reset();
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Failed to create coupon"),
  });

  const deleteCoupon = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/coupons/${id}`),
    onSuccess: () => { invalidateCoupons(); toast.success("Coupon deleted"); },
  });

  const toggleCoupon = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.put(`/admin/coupons/${id}`, { is_active }),
    onSuccess: () => invalidateCoupons(),
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { discount_type: "percentage", is_active: true, usage_per_user: 1, min_order_value: 0 },
  });

  const discountType = watch("discount_type");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-400 mt-1">{coupons?.length || 0} coupons total</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={15} /> Create Coupon
        </button>
      </div>

      {/* ── Create Form ─────────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-white rounded-xl border border-brand-200 dark:border-brand-800 dark:bg-[rgb(var(--surface-0))] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-black text-gray-900">New Coupon</h2>
            <button onClick={() => { setShowForm(false); reset(); }} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit((d) => createCoupon.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Coupon Code *</label>
                <input
                  {...register("code")}
                  className="input uppercase"
                  placeholder="SPORT20"
                  style={{ textTransform: "uppercase" }}
                />
                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
              </div>
              <div>
                <label className="label">Description</label>
                <input {...register("description")} className="input" placeholder="20% off on all products" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Discount Type *</label>
                <select {...register("discount_type")} className="input">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="label">
                  Discount Value * {discountType === "percentage" ? "(%)" : "(₹)"}
                </label>
                <input type="number" step="0.01" {...register("discount_value")} className="input" placeholder={discountType === "percentage" ? "20" : "100"} />
                {errors.discount_value && <p className="text-xs text-red-500 mt-1">{errors.discount_value.message}</p>}
              </div>
              {discountType === "percentage" && (
                <div>
                  <label className="label">Max Discount (₹) <span className="text-gray-400">(cap)</span></label>
                  <input type="number" {...register("max_discount_amount")} className="input" placeholder="500" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Min Order Value (₹)</label>
                <input type="number" {...register("min_order_value")} className="input" placeholder="499" />
              </div>
              <div>
                <label className="label">Total Usage Limit</label>
                <input type="number" {...register("usage_limit")} className="input" placeholder="100 (blank = unlimited)" />
              </div>
              <div>
                <label className="label">Uses Per User</label>
                <input type="number" {...register("usage_per_user")} className="input" defaultValue={1} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="label">Expiry Date</label>
                <input type="datetime-local" {...register("expires_at")} className="input" />
              </div>
              <div className="flex items-center pb-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register("is_active")} className="w-4 h-4 text-brand-600 rounded" />
                  <span className="text-sm text-gray-700">Active immediately</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={createCoupon.isLoading} className="btn-primary flex-1">
                {createCoupon.isLoading ? "Creating..." : "Create Coupon"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); }} className="btn-outline flex-1">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Coupons Table ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-lg" />
            ))}
          </div>
        ) : !coupons?.length ? (
          <div className="p-16 text-center">
            <Tag size={48} className="text-gray-200 mx-auto mb-4" />
            <h3 className="font-bold text-gray-700 mb-2">No coupons yet</h3>
            <p className="text-gray-400 text-sm mb-6">Create your first coupon to offer discounts</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
              Create First Coupon
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left bg-gray-50">
                  <th className="px-4 py-3 font-semibold text-gray-600">Code</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Discount</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Min Order</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Usage</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Expiry</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-mono font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/40 px-2 py-0.5 rounded text-sm">
                          {c.code}
                        </span>
                        {c.description && (
                          <p className="text-xs text-gray-400 mt-1">{c.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900">
                        {c.discount_type === "percentage"
                          ? `${c.discount_value}%`
                          : formatPrice(c.discount_value)}
                      </span>
                      {c.max_discount_amount && (
                        <p className="text-xs text-gray-400">
                          Max: {formatPrice(c.max_discount_amount)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.min_order_value > 0 ? formatPrice(c.min_order_value) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-gray-800">{c.used_count}</span>
                        <span className="text-gray-400">
                          {c.usage_limit != null ? ` / ${c.usage_limit}` : " / ∞"}
                        </span>
                        {c.usage_limit != null && (
                          <div className="w-20 h-1.5 bg-gray-200 dark:bg-[rgb(var(--surface-3))] rounded-full mt-1">
                            <div
                              className="h-full bg-brand-500 dark:bg-brand-400 rounded-full"
                              style={{ width: `${Math.min((c.used_count / c.usage_limit) * 100, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.expires_at ? (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar size={12} />
                          <span className="text-xs">{formatDate(c.expires_at)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No expiry</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <CouponBadge coupon={c} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleCoupon.mutate({ id: c.id, is_active: !c.is_active })}
                          title={c.is_active ? "Deactivate" : "Activate"}
                          className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {c.is_active
                            ? <XCircle size={13} className="text-orange-500" />
                            : <CheckCircle2 size={13} className="text-green-500" />}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete coupon "${c.code}"?`)) deleteCoupon.mutate(c.id);
                          }}
                          className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                        >
                          <Trash2 size={13} className="text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
