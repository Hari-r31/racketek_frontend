"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Trash2, ArrowLeft, Upload, X, Star, ImageIcon,
  RefreshCw, Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

/* ─── Zod schema ─────────────────────────────────────────────────────────── */
const variantSchema = z.object({
  name:           z.string().min(1, "Required"),
  value:          z.string().min(1, "Required"),
  price_modifier: z.number().default(0),
  stock:          z.number().min(0).default(0),
  is_active:      z.boolean().default(true),
});

const schema = z.object({
  name:               z.string().min(2, "Product name must be at least 2 characters"),
  slug:               z.string().min(2, "Slug required").regex(/^[a-z0-9-]+$/, "Lowercase, numbers, hyphens only"),
  sku:                z.string().optional(),
  description:        z.string().optional(),
  short_description:  z.string().optional(),
  brand:              z.string().optional(),
  price:              z.coerce.number().min(1, "Price must be greater than 0"),
  compare_price:      z.coerce.number().optional(),
  cost_price:         z.coerce.number().optional(),
  stock:              z.coerce.number().min(0).default(0),
  low_stock_threshold:z.coerce.number().min(0).default(5),
  weight:             z.coerce.number().optional(),
  status:             z.enum(["active","inactive","draft"]).default("active"),
  is_featured:        z.boolean().default(false),
  is_best_seller:     z.boolean().default(false),
  category_id:        z.coerce.number().optional().nullable(),
  meta_title:         z.string().optional(),
  meta_description:   z.string().optional(),
  variants:           z.array(variantSchema).default([]),
});

type FormData = z.infer<typeof schema>;

/* ─── Image state type ───────────────────────────────────────────────────── */
interface UploadedImage {
  url:        string;
  public_id?: string;
  alt_text:   string;
  is_primary: boolean;
}

/* ─── Shared input class ─────────────────────────────────────────────────── */
const iCls = "w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all bg-white";
const iErr = "border-red-400 focus:border-red-400 focus:ring-red-400/10";

/* ─── Sub-components ─────────────────────────────────────────────────────── */
const Req = () => <span className="text-red-500 ml-0.5">*</span>;

function Lbl({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {children}{required && <Req />}
    </label>
  );
}

function ErrMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1 flex items-center gap-1">⚠ {msg}</p>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="font-bold text-gray-900">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

/* ─── Slug + SKU generators ─────────────────────────────────────────────── */
function toSlug(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function toSku(name: string, brand: string) {
  const namePart  = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 12);
  const brandPart = brand.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 4) || "PRD";
  const rand      = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${brandPart}-${namePart}-${rand}`;
}

/* ════════════════════════════════════════════════════════════════════════════
   IMAGE UPLOAD PANEL
════════════════════════════════════════════════════════════════════════════ */
function ImageUploadPanel({
  images, setImages,
}: {
  images: UploadedImage[];
  setImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
}) {
  const [uploading, setUploading] = useState(false);

  const upload = async (files: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await api.post("/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const isPrimary = images.length === 0; // first image auto-primary
        setImages(prev => [
          ...prev,
          { url: data.url, public_id: data.public_id, alt_text: "", is_primary: isPrimary },
        ]);
      }
      toast.success("Image(s) uploaded");
    } catch {
      toast.error("Upload failed. Check file type/size.");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
  }, [images]);

  const setPrimary = (idx: number) => {
    setImages(prev => prev.map((img, i) => ({ ...img, is_primary: i === idx })));
  };

  const removeImage = (idx: number) => {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== idx);
      // if we removed the primary and there are still images, make first one primary
      if (prev[idx].is_primary && next.length > 0) next[0].is_primary = true;
      return next;
    });
  };

  const updateAlt = (idx: number, alt: string) => {
    setImages(prev => prev.map((img, i) => i === idx ? { ...img, alt_text: alt } : img));
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
        className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-brand-400 transition-colors cursor-pointer group"
        onClick={() => document.getElementById("img-input")?.click()}
      >
        <input
          id="img-input" type="file" accept="image/*" multiple className="hidden"
          onChange={e => e.target.files && upload(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-brand-600">
            <RefreshCw size={28} className="animate-spin" />
            <p className="text-sm font-medium">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-brand-500 transition-colors">
            <Upload size={28} />
            <p className="text-sm font-medium">Drop images here or click to browse</p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP — Max 5 MB each</p>
          </div>
        )}
      </div>

      {/* Uploaded images grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {images.length} image{images.length !== 1 ? "s" : ""} — click ★ to set primary
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className={`relative rounded-xl overflow-hidden border-2 transition-all ${img.is_primary ? "border-brand-500 shadow-md" : "border-gray-200"}`}>
                {/* Image */}
                <div className="relative aspect-square bg-gray-50">
                  <img src={img.url} alt={img.alt_text || "Product image"} className="w-full h-full object-cover" />
                </div>

                {/* Primary badge */}
                {img.is_primary && (
                  <div className="absolute top-1.5 left-1.5 bg-brand-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star size={9} fill="white" /> Primary
                  </div>
                )}

                {/* Actions */}
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  {!img.is_primary && (
                    <button
                      type="button"
                      onClick={() => setPrimary(idx)}
                      title="Set as primary"
                      className="w-6 h-6 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-500 hover:text-brand-600 shadow transition-colors"
                    >
                      <Star size={11} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="w-6 h-6 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 shadow transition-colors"
                  >
                    <X size={11} />
                  </button>
                </div>

                {/* Alt text input */}
                <div className="p-2 bg-white border-t border-gray-100">
                  <input
                    type="text"
                    value={img.alt_text}
                    onChange={e => updateAlt(idx, e.target.value)}
                    placeholder="Alt text (optional)"
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          <ImageIcon size={13} /> At least one product image is recommended
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════════════ */
export default function NewProductPage() {
  const router = useRouter();
  const qc     = useQueryClient();
  const [loading,     setLoading]     = useState(false);
  const [parentCatId, setParentCatId] = useState<number | "">("");
  const [images,      setImages]      = useState<UploadedImage[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register, handleSubmit, control, setValue, watch, getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "active", variants: [], category_id: null },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  const nameValue  = watch("name");
  const brandValue = watch("brand");

  /* ── Category queries ─────────────────────────────────────────────────── */
  const { data: parentCats = [] } = useQuery<any[]>({
    queryKey: ["categories-root"],
    queryFn: () => api.get("/categories?parent_only=true").then(r => r.data),
  });

  const { data: subCats = [] } = useQuery<any[]>({
    queryKey: ["categories-sub", parentCatId],
    queryFn: () => api.get(`/categories?parent_id=${parentCatId}`).then(r => r.data),
    enabled: !!parentCatId,
  });

  /* ── Auto-generate slug + SKU ─────────────────────────────────────────── */
  const autoGenSlug = () => {
    const name = getValues("name");
    if (name) setValue("slug", toSlug(name), { shouldValidate: true });
  };

  const autoGenSku = () => {
    const name  = getValues("name");
    const brand = getValues("brand") || "";
    if (name) setValue("sku", toSku(name, brand));
  };

  /* ── Submit ───────────────────────────────────────────────────────────── */
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError(null);
    try {
      const payload = {
        ...data,
        images: images.map(img => ({
          url:        img.url,
          public_id:  img.public_id,
          alt_text:   img.alt_text,
          is_primary: img.is_primary,
        })),
      };
      await api.post("/products", payload);
      // Bust all product caches so lists reflect the new product instantly
      await qc.invalidateQueries({ queryKey: ["admin-products"] });
      await qc.invalidateQueries({ queryKey: ["products"] });
      await qc.invalidateQueries({ queryKey: ["admin-inventory"] });
      toast.success("Product created!");
      router.push("/admin/products");
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      // Show a friendly, specific error in the UI
      if (typeof detail === "string") {
        if (detail.toLowerCase().includes("slug")) {
          setServerError("A product with this URL slug already exists. Please use a different slug.");
        } else if (detail.toLowerCase().includes("sku")) {
          setServerError("This SKU is already in use. Please use a unique SKU.");
        } else if (detail.toLowerCase().includes("name") || detail.toLowerCase().includes("duplicate")) {
          setServerError("A product with this name already exists.");
        } else {
          setServerError(detail);
        }
      } else {
        setServerError("Failed to create product. Please check all fields and try again.");
      }
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/products"
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-sm text-gray-400 mt-0.5">Fields marked <span className="text-red-500">*</span> are required</p>
        </div>
      </div>

      {/* Server error banner */}
      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <span className="text-red-500 text-lg shrink-0">⚠</span>
          <div>
            <p className="font-bold text-red-700 text-sm">Could not create product</p>
            <p className="text-red-600 text-sm mt-0.5">{serverError}</p>
          </div>
          <button onClick={() => setServerError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X size={15} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Basic Info ──────────────────────────────────────────────── */}
        <Card title="Basic Information">
          {/* Name */}
          <div>
            <Lbl required>Product Name</Lbl>
            <input
              {...register("name")}
              onBlur={autoGenSlug}
              className={`${iCls} ${errors.name ? iErr : ""}`}
              placeholder="e.g. Yonex Arcsaber 11 Pro"
            />
            <ErrMsg msg={errors.name?.message} />
          </div>

          {/* Slug */}
          <div>
            <Lbl required>URL Slug</Lbl>
            <div className="flex gap-2">
              <input
                {...register("slug")}
                className={`${iCls} font-mono text-sm flex-1 ${errors.slug ? iErr : ""}`}
                placeholder="yonex-arcsaber-11-pro"
              />
              <button type="button" onClick={autoGenSlug} title="Re-generate from name"
                className="px-3 border border-gray-300 rounded-lg text-gray-500 hover:text-brand-600 hover:border-brand-400 transition-colors">
                <RefreshCw size={14} />
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">yoursite.com/products/<strong>{watch("slug") || "your-slug"}</strong></p>
            <ErrMsg msg={errors.slug?.message} />
          </div>

          {/* Short description */}
          <div>
            <Lbl>Short Description</Lbl>
            <input {...register("short_description")} className={iCls} placeholder="One-line summary shown in listings" />
          </div>

          {/* Full description */}
          <div>
            <Lbl>Full Description</Lbl>
            <textarea {...register("description")} rows={5}
              className={`${iCls} resize-none leading-relaxed`}
              placeholder="Detailed product description…" />
          </div>

          {/* Brand + SKU */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Lbl>Brand</Lbl>
              <input {...register("brand")} className={iCls} placeholder="Yonex" />
            </div>
            <div>
              <Lbl>SKU</Lbl>
              <div className="flex gap-2">
                <input {...register("sku")} className={`${iCls} font-mono flex-1`} placeholder="YON-ARC11P-4U5" />
                <button type="button" onClick={autoGenSku} title="Auto-generate SKU"
                  className="px-3 border border-gray-300 rounded-lg text-gray-500 hover:text-brand-600 hover:border-brand-400 transition-colors">
                  <Sparkles size={14} />
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Click ✦ to auto-generate</p>
            </div>
          </div>
        </Card>

        {/* ── Images ──────────────────────────────────────────────────── */}
        <Card title="Product Images">
          <ImageUploadPanel images={images} setImages={setImages} />
        </Card>

        {/* ── Category ────────────────────────────────────────────────── */}
        <Card title="Category">
          <div className="grid grid-cols-2 gap-5">
            {/* Parent select — uncontrolled, separate from RHF to avoid reset bug */}
            <div>
              <Lbl>Sport / Parent Category</Lbl>
              <select
                value={parentCatId}
                onChange={e => {
                  const v = e.target.value ? Number(e.target.value) : "";
                  setParentCatId(v);
                  setValue("category_id", null);
                }}
                className={iCls}
              >
                <option value="">— Select Sport —</option>
                {parentCats.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Sub-category — registered with RHF */}
            <div>
              <Lbl>Sub-Category</Lbl>
              <select
                {...register("category_id")}
                disabled={!parentCatId}
                className={`${iCls} disabled:bg-gray-50 disabled:cursor-not-allowed`}
              >
                <option value="">{parentCatId ? "— Select Sub-category —" : "Select a sport first"}</option>
                {subCats.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {parentCatId && subCats.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No sub-categories yet —{" "}
                  <Link href="/admin/categories" className="underline">Create one</Link>
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* ── Pricing & Stock ──────────────────────────────────────────── */}
        <Card title="Pricing & Stock">
          <div className="grid grid-cols-3 gap-5">
            <div>
              <Lbl required>Selling Price (₹)</Lbl>
              <input type="number" step="0.01" {...register("price")}
                className={`${iCls} ${errors.price ? iErr : ""}`} placeholder="2499" />
              <ErrMsg msg={errors.price?.message} />
            </div>
            <div>
              <Lbl>Compare Price (₹)</Lbl>
              <input type="number" step="0.01" {...register("compare_price")} className={iCls} placeholder="3499" />
              <p className="text-[11px] text-gray-400 mt-1">Shown as strikethrough</p>
            </div>
            <div>
              <Lbl>Cost Price (₹)</Lbl>
              <input type="number" step="0.01" {...register("cost_price")} className={iCls} placeholder="1200" />
              <p className="text-[11px] text-gray-400 mt-1">Internal use only</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-5">
            <div>
              <Lbl required>Stock Qty</Lbl>
              <input type="number" {...register("stock")}
                className={`${iCls} ${errors.stock ? iErr : ""}`} placeholder="100" />
              <ErrMsg msg={errors.stock?.message} />
            </div>
            <div>
              <Lbl>Low Stock Alert</Lbl>
              <input type="number" {...register("low_stock_threshold")} className={iCls} placeholder="5" />
            </div>
            <div>
              <Lbl>Weight (kg)</Lbl>
              <input type="number" step="0.001" {...register("weight")} className={iCls} placeholder="0.085" />
            </div>
          </div>
        </Card>

        {/* ── Status & Visibility ──────────────────────────────────────── */}
        <Card title="Status & Visibility">
          <div>
            <Lbl>Status</Lbl>
            <select {...register("status")} className={iCls}>
              <option value="active">Active — visible in store</option>
              <option value="inactive">Inactive — hidden from store</option>
              <option value="draft">Draft — work in progress</option>
            </select>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" {...register("is_featured")}
                className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500" />
              <span className="text-sm text-gray-700">Featured Product</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" {...register("is_best_seller")}
                className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500" />
              <span className="text-sm text-gray-700">Best Seller</span>
            </label>
          </div>
        </Card>

        {/* ── Variants ─────────────────────────────────────────────────── */}
        <Card title="Variants — Size, Colour, Weight">
          <div className="flex items-center justify-between -mt-2">
            <p className="text-sm text-gray-500">Leave empty if the product has no variants.</p>
            <button type="button"
              onClick={() => append({ name: "", value: "", price_modifier: 0, stock: 0, is_active: true })}
              className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-semibold">
              <Plus size={14} /> Add Variant
            </button>
          </div>
          {fields.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No variants added.</p>
          ) : (
            <div className="space-y-3">
              {fields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-5 gap-3 items-end">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Type <Req /></label>
                    <input {...register(`variants.${i}.name`)} className={iCls} placeholder="Size" />
                    <ErrMsg msg={(errors.variants as any)?.[i]?.name?.message} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Value <Req /></label>
                    <input {...register(`variants.${i}.value`)} className={iCls} placeholder="XL" />
                    <ErrMsg msg={(errors.variants as any)?.[i]?.value?.message} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Price Adj (₹)</label>
                    <input type="number" {...register(`variants.${i}.price_modifier`, { valueAsNumber: true })}
                      className={iCls} placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Stock</label>
                    <input type="number" {...register(`variants.${i}.stock`, { valueAsNumber: true })}
                      className={iCls} placeholder="0" />
                  </div>
                  <button type="button" onClick={() => remove(i)}
                    className="h-[42px] flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── SEO ─────────────────────────────────────────────────────── */}
        <Card title="SEO (Optional)">
          <div>
            <Lbl>Meta Title</Lbl>
            <input {...register("meta_title")} className={iCls}
              placeholder="Buy Yonex Arcsaber 11 Pro Online | RacketOutlet" />
          </div>
          <div>
            <Lbl>Meta Description</Lbl>
            <textarea {...register("meta_description")} rows={2}
              className={`${iCls} resize-none`}
              placeholder="Shop the Yonex Arcsaber 11 Pro at best price…" />
          </div>
        </Card>

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <div className="flex gap-4 pb-6">
          <button type="submit" disabled={loading}
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? "Creating…" : "Create Product"}
          </button>
          <Link href="/admin/products"
            className="flex-1 border-2 border-gray-300 text-gray-700 font-bold py-3 rounded-xl text-center hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
