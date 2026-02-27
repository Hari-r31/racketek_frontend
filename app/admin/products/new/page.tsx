"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

const variantSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
  price_modifier: z.number().default(0),
  stock: z.number().min(0).default(0),
});

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  description: z.string().optional(),
  short_description: z.string().optional(),
  brand: z.string().optional(),
  sku: z.string().optional(),
  price: z.coerce.number().min(0),
  compare_price: z.coerce.number().optional(),
  cost_price: z.coerce.number().optional(),
  stock: z.coerce.number().min(0).default(0),
  low_stock_threshold: z.coerce.number().min(0).default(5),
  weight: z.coerce.number().optional(),
  status: z.enum(["active", "inactive", "draft"]).default("active"),
  is_featured: z.boolean().default(false),
  is_best_seller: z.boolean().default(false),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  variants: z.array(variantSchema).default([]),
});
type FormData = z.infer<typeof schema>;

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "active", variants: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  const nameValue = watch("name");

  const autoSlug = () => {
    if (nameValue) {
      const slug = nameValue.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      setValue("slug", slug);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post("/products", data);
      toast.success("Product created!");
      router.push("/admin/products");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-gray-800">Basic Information</h2>

          <div>
            <label className="label">Product Name *</label>
            <input {...register("name")} className="input" onBlur={autoSlug} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Slug (URL) *</label>
            <input {...register("slug")} className="input" placeholder="product-slug" />
            {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug.message}</p>}
          </div>

          <div>
            <label className="label">Short Description</label>
            <input {...register("short_description")} className="input" placeholder="One line summary" />
          </div>

          <div>
            <label className="label">Full Description</label>
            <textarea {...register("description")} rows={5} className="input resize-none" placeholder="Detailed product description..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Brand</label>
              <input {...register("brand")} className="input" />
            </div>
            <div>
              <label className="label">SKU</label>
              <input {...register("sku")} className="input" />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-gray-800">Pricing & Stock</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Selling Price (₹) *</label>
              <input type="number" {...register("price")} className="input" />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="label">Compare Price (₹)</label>
              <input type="number" {...register("compare_price")} className="input" />
            </div>
            <div>
              <label className="label">Cost Price (₹)</label>
              <input type="number" {...register("cost_price")} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Stock Quantity *</label>
              <input type="number" {...register("stock")} className="input" />
            </div>
            <div>
              <label className="label">Low Stock Alert</label>
              <input type="number" {...register("low_stock_threshold")} className="input" />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input type="number" step="0.01" {...register("weight")} className="input" />
            </div>
          </div>
        </div>

        {/* Status & Flags */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-gray-800">Status & Visibility</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Status</label>
              <select {...register("status")} className="input">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register("is_featured")} className="w-4 h-4 text-brand-600 rounded" />
              <span className="text-sm text-gray-700">Featured Product</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register("is_best_seller")} className="w-4 h-4 text-brand-600 rounded" />
              <span className="text-sm text-gray-700">Best Seller</span>
            </label>
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Variants (Size, Color, Weight)</h2>
            <button
              type="button"
              onClick={() => append({ name: "", value: "", price_modifier: 0, stock: 0 })}
              className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              <Plus size={14} /> Add Variant
            </button>
          </div>
          {fields.length === 0 ? (
            <p className="text-sm text-gray-400">No variants added. Add size/color options if needed.</p>
          ) : (
            <div className="space-y-3">
              {fields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-5 gap-3 items-end">
                  <div>
                    <label className="label text-xs">Type (e.g. Size)</label>
                    <input {...register(`variants.${i}.name`)} className="input text-sm" placeholder="Size" />
                  </div>
                  <div>
                    <label className="label text-xs">Value (e.g. XL)</label>
                    <input {...register(`variants.${i}.value`)} className="input text-sm" placeholder="XL" />
                  </div>
                  <div>
                    <label className="label text-xs">Price Adj (₹)</label>
                    <input type="number" {...register(`variants.${i}.price_modifier`, { valueAsNumber: true })} className="input text-sm" placeholder="0" />
                  </div>
                  <div>
                    <label className="label text-xs">Stock</label>
                    <input type="number" {...register(`variants.${i}.stock`, { valueAsNumber: true })} className="input text-sm" placeholder="0" />
                  </div>
                  <button type="button" onClick={() => remove(i)} className="h-10 flex items-center justify-center text-red-400 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SEO */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-gray-800">SEO (Optional)</h2>
          <div>
            <label className="label">Meta Title</label>
            <input {...register("meta_title")} className="input" />
          </div>
          <div>
            <label className="label">Meta Description</label>
            <textarea {...register("meta_description")} rows={2} className="input resize-none" />
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
            {loading ? "Creating..." : "Create Product"}
          </button>
          <Link href="/admin/products" className="btn-outline flex-1 py-3 text-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
