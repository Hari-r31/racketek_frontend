"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ArrowLeft, Upload, X, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import toast from "react-hot-toast";

const variantSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Required"),
  value: z.string().min(1, "Required"),
  price_modifier: z.number().default(0),
  stock: z.number().min(0).default(0),
  is_active: z.boolean().default(true),
});

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Lowercase, numbers, hyphens only"),
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
  status: z.enum(["active", "inactive", "draft", "out_of_stock"]).default("active"),
  is_featured: z.boolean().default(false),
  is_best_seller: z.boolean().default(false),
  is_returnable: z.boolean().default(true),
  return_window_days: z.coerce.number().min(1).default(7),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  variants: z.array(variantSchema).default([]),
});
type FormData = z.infer<typeof schema>;

export default function EditProductPage() {
  const router = useRouter();
  const qc     = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [images, setImages] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  const nameValue = watch("name");

  // Fetch existing product data
  useEffect(() => {
    if (!id) return;
    api.get(`/admin/products/${id}`)  // now hits GET /admin/products/{id}
      .then((r) => {
        const p = r.data;
        setProduct(p);
        setImages(p.images || []);
        reset({
          name: p.name,
          slug: p.slug,
          description: p.description || "",
          short_description: p.short_description || "",
          brand: p.brand || "",
          sku: p.sku || "",
          price: p.price,
          compare_price: p.compare_price || undefined,
          cost_price: p.cost_price || undefined,
          stock: p.stock,
          low_stock_threshold: p.low_stock_threshold,
          weight: p.weight || undefined,
          status: p.status,
          is_featured: p.is_featured,
          is_best_seller: p.is_best_seller,
          is_returnable: p.is_returnable ?? true,
          return_window_days: p.return_window_days ?? 7,
          meta_title: p.meta_title || "",
          meta_description: p.meta_description || "",
          variants: p.variants || [],
        });
      })
      .catch(() => toast.error("Failed to load product"))
      .finally(() => setFetching(false));
  }, [id, reset]);

  const autoSlug = () => {
    if (nameValue) {
      const slug = nameValue.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      setValue("slug", slug);
    }
  };

  const invalidateProduct = () => {
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["admin-product", id] });
    if (product?.slug) qc.invalidateQueries({ queryKey: ["product", product.slug] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post(`/products/${id}/images`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImages((prev) => [...prev, data]);
      invalidateProduct();
      toast.success("Image uploaded!");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const removeImage = async (imageId: number) => {
    try {
      await api.delete(`/products/${id}/images/${imageId}`);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      invalidateProduct();
      toast.success("Image removed");
    } catch {
      toast.error("Failed to remove image");
    }
  };

  const setPrimaryImage = async (imageId: number) => {
    try {
      await api.put(`/products/${id}/images/${imageId}/primary`);
      setImages((prev) =>
        prev.map((img) => ({ ...img, is_primary: img.id === imageId }))
      );
      invalidateProduct();
      toast.success("Primary image set");
    } catch {
      toast.error("Failed to set primary image");
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: updated } = await api.put(`/admin/products/${id}`, data);
      // Bust every cached query that could show stale product data
      await qc.invalidateQueries({ queryKey: ["admin-products"] });
      await qc.invalidateQueries({ queryKey: ["admin-product", id] });
      await qc.invalidateQueries({ queryKey: ["product", updated.slug] });
      await qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated!");
      router.push("/admin/products");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="max-w-3xl animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Product not found</p>
        <Link href="/admin/products" className="btn-primary mt-4 inline-block">Back to Products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Edit Product</h1>
          <p className="text-sm text-gray-400 truncate">{product.name}</p>
        </div>
      </div>

      {/* ── Images Management ────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ImageIcon size={16} /> Product Images
        </h2>
        <div className="flex flex-wrap gap-3 mb-4">
          {images.map((img) => (
            <div key={img.id} className="relative group w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200">
              <Image src={img.url} alt="" fill className="object-cover" />
              {img.is_primary && (
                <div className="absolute bottom-0 left-0 right-0 bg-brand-600 text-white text-xs text-center py-0.5">
                  Primary
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                {!img.is_primary && (
                  <button
                    onClick={() => setPrimaryImage(img.id)}
                    className="text-white text-xs bg-brand-600 px-2 py-0.5 rounded"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  onClick={() => removeImage(img.id)}
                  className="text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
          {/* Upload button */}
          <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 transition-colors text-gray-400 hover:text-brand-500">
            {uploadingImage ? (
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Upload size={18} />
                <span className="text-xs mt-1">Upload</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
          </label>
        </div>
        <p className="text-xs text-gray-400">Click an image to set as primary or remove. Upload new images via the + button.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Basic Info ────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-gray-800">Basic Information</h2>
          <div>
            <label className="label">Product Name *</label>
            <input {...register("name")} className="input" onBlur={autoSlug} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Slug (URL) *</label>
            <input {...register("slug")} className="input" />
            {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug.message}</p>}
          </div>
          <div>
            <label className="label">Short Description</label>
            <input {...register("short_description")} className="input" />
          </div>
          <div>
            <label className="label">Full Description</label>
            <textarea {...register("description")} rows={5} className="input resize-none" />
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

        {/* ── Pricing & Stock ───────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-gray-800">Pricing & Stock</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Selling Price (₹) *</label>
              <input type="number" step="0.01" {...register("price")} className="input" />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="label">Compare Price (₹)</label>
              <input type="number" step="0.01" {...register("compare_price")} className="input" />
            </div>
            <div>
              <label className="label">Cost Price (₹)</label>
              <input type="number" step="0.01" {...register("cost_price")} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Stock Qty *</label>
              <input type="number" {...register("stock")} className="input" />
            </div>
            <div>
              <label className="label">Low Stock Alert At</label>
              <input type="number" {...register("low_stock_threshold")} className="input" />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input type="number" step="0.01" {...register("weight")} className="input" />
            </div>
          </div>
        </div>

        {/* ── Status & Flags ────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-gray-800">Status & Visibility</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select {...register("status")} className="input">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
                <option value="out_of_stock">Out of Stock</option>
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register("is_returnable")} className="w-4 h-4 text-brand-600 rounded" />
              <span className="text-sm text-gray-700">Returnable</span>
            </label>
          </div>
          {watch("is_returnable") && (
            <div className="w-40">
              <label className="label">Return Window (days)</label>
              <input type="number" min="1" max="30" {...register("return_window_days")} className="input" />
            </div>
          )}
        </div>

        {/* ── Variants ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Variants (Size, Color, Weight)</h2>
            <button
              type="button"
              onClick={() => append({ name: "", value: "", price_modifier: 0, stock: 0, is_active: true })}
              className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              <Plus size={14} /> Add Variant
            </button>
          </div>
          {fields.length === 0 ? (
            <p className="text-sm text-gray-400">No variants. Add size/color options if needed.</p>
          ) : (
            <div className="space-y-3">
              {fields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-5 gap-3 items-end">
                  <div>
                    <label className="label text-xs">Type</label>
                    <input {...register(`variants.${i}.name`)} className="input text-sm" placeholder="Size" />
                  </div>
                  <div>
                    <label className="label text-xs">Value</label>
                    <input {...register(`variants.${i}.value`)} className="input text-sm" placeholder="XL" />
                  </div>
                  <div>
                    <label className="label text-xs">Price Adj (₹)</label>
                    <input type="number" {...register(`variants.${i}.price_modifier`, { valueAsNumber: true })} className="input text-sm" />
                  </div>
                  <div>
                    <label className="label text-xs">Stock</label>
                    <input type="number" {...register(`variants.${i}.stock`, { valueAsNumber: true })} className="input text-sm" />
                  </div>
                  <button type="button" onClick={() => remove(i)} className="h-10 flex items-center justify-center text-red-400 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── SEO ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-gray-800">SEO</h2>
          <div>
            <label className="label">Meta Title</label>
            <input {...register("meta_title")} className="input" />
          </div>
          <div>
            <label className="label">Meta Description</label>
            <textarea {...register("meta_description")} rows={2} className="input resize-none" />
          </div>
        </div>

        <div className="flex gap-4 pb-10">
          <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : "Save Changes"}
          </button>
          <Link href="/admin/products" className="btn-outline flex-1 py-3 text-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
