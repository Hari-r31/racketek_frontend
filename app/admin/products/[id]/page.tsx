"use client";
/**
 * Admin Edit Product Page — Catalog v2
 *
 * Pre-populates all existing fields including:
 *   - Highlights        (HighlightsEditor)
 *   - Specifications    (SpecificationBuilder)
 *   - Manufacturer Info (ManufacturerInfoEditor)
 *
 * Sends PATCH to /products/{id} with only changed fields.
 */
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Trash2, ArrowLeft, Upload, X, Star, ImageIcon,
  RefreshCw, Sparkles, Save,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import SpecificationBuilder, { Specifications } from "@/components/admin/product/SpecificationBuilder";
import HighlightsEditor     from "@/components/admin/product/HighlightsEditor";
import ManufacturerInfoEditor from "@/components/admin/product/ManufacturerInfoEditor";
import { ManufacturerInfo, Product } from "@/types";

/* ─── Zod schema (same as new product) ──────────────────────────────────── */
const variantSchema = z.object({
  name:           z.string().min(1, "Required"),
  value:          z.string().min(1, "Required"),
  price_modifier: z.number().default(0),
  stock:          z.number().min(0).default(0),
  is_active:      z.boolean().default(true),
});

const schema = z.object({
  name:                z.string().min(2, "Required"),
  slug:                z.string().min(2, "Required").regex(/^[a-z0-9-]+$/, "Lowercase, numbers, hyphens only"),
  sku:                 z.string().optional(),
  description:         z.string().optional(),
  short_description:   z.string().optional(),
  brand:               z.string().optional(),
  price:               z.coerce.number().min(1, "Required"),
  compare_price:       z.coerce.number().optional(),
  cost_price:          z.coerce.number().optional(),
  stock:               z.coerce.number().min(0).default(0),
  low_stock_threshold: z.coerce.number().min(0).default(5),
  weight:              z.coerce.number().optional(),
  status:              z.enum(["active","inactive","draft","out_of_stock"]).default("active"),
  is_featured:         z.boolean().default(false),
  is_best_seller:      z.boolean().default(false),
  category_id:         z.coerce.number().optional().nullable(),
  meta_title:          z.string().optional(),
  meta_description:    z.string().optional(),
  difficulty_level:    z.enum(["beginner","intermediate","advanced",""]).optional(),
  gender:              z.enum(["male","female","unisex","boys","girls",""]).optional(),
  variants:            z.array(variantSchema).default([]),
});

type FormData = z.infer<typeof schema>;

interface UploadedImage {
  id?:        number;
  url:        string;
  public_id?: string;
  alt_text:   string;
  is_primary: boolean;
}

const iCls = "w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all bg-white";
const iErr = "border-red-400 focus:border-red-400 focus:ring-red-400/10";

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

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
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
        const isPrimary = images.length === 0;
        setImages(prev => [
          ...prev,
          { url: data.url, public_id: data.public_id, alt_text: "", is_primary: isPrimary },
        ]);
      }
      toast.success("Image(s) uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
  }, [images]);

  const setPrimary = (idx: number) =>
    setImages(prev => prev.map((img, i) => ({ ...img, is_primary: i === idx })));

  const removeImage = (idx: number) =>
    setImages(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (prev[idx].is_primary && next.length > 0) next[0].is_primary = true;
      return next;
    });

  const updateAlt = (idx: number, alt: string) =>
    setImages(prev => prev.map((img, i) => i === idx ? { ...img, alt_text: alt } : img));

  return (
    <div className="space-y-4">
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
        className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-brand-400 transition-colors cursor-pointer group"
        onClick={() => document.getElementById("img-input-edit")?.click()}
      >
        <input
          id="img-input-edit" type="file" accept="image/*" multiple className="hidden"
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

      {images.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {images.length} image{images.length !== 1 ? "s" : ""} — click ★ to set primary
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className={`relative rounded-xl overflow-hidden border-2 transition-all ${img.is_primary ? "border-brand-500 shadow-md" : "border-gray-200"}`}>
                <div className="relative aspect-square bg-gray-50">
                  <img src={img.url} alt={img.alt_text || "Product image"} className="w-full h-full object-cover" />
                </div>
                {img.is_primary && (
                  <div className="absolute top-1.5 left-1.5 bg-brand-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star size={9} fill="white" /> Primary
                  </div>
                )}
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  {!img.is_primary && (
                    <button type="button" onClick={() => setPrimary(idx)}
                      className="w-6 h-6 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-500 hover:text-brand-600 shadow transition-colors">
                      <Star size={11} />
                    </button>
                  )}
                  <button type="button" onClick={() => removeImage(idx)}
                    className="w-6 h-6 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 shadow transition-colors">
                    <X size={11} />
                  </button>
                </div>
                <div className="p-2 bg-white border-t border-gray-100">
                  <input
                    type="text" value={img.alt_text}
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
export default function EditProductPage() {
  const router     = useRouter();
  const { id }     = useParams<{ id: string }>();
  const qc         = useQueryClient();
  const [loading,          setLoading]          = useState(false);
  const [parentCatId,      setParentCatId]      = useState<number | "">("");
  const [images,           setImages]           = useState<UploadedImage[]>([]);
  const [serverError,      setServerError]      = useState<string | null>(null);
  const [initialized,      setInitialized]      = useState(false);

  // Catalog v2 state
  const [highlights,       setHighlights]       = useState<string[]>([]);
  const [specifications,   setSpecifications]   = useState<Specifications>({});
  const [manufacturerInfo, setManufacturerInfo] = useState<ManufacturerInfo>({});

  const {
    register, handleSubmit, control, setValue, watch, reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "active", variants: [], category_id: null },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  // ── Fetch product ────────────────────────────────────────────────────────
  const { data: product, isLoading: fetching } = useQuery<Product>({
    queryKey: ["admin-product", id],
    queryFn: () => api.get(`/products/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const { data: parentCats = [] } = useQuery<any[]>({
    queryKey: ["categories-root"],
    queryFn: () => api.get("/categories?parent_only=true").then(r => r.data),
  });

  const { data: subCats = [] } = useQuery<any[]>({
    queryKey: ["categories-sub", parentCatId],
    queryFn: () => api.get(`/categories?parent_id=${parentCatId}`).then(r => r.data),
    enabled: !!parentCatId,
  });

  // ── Pre-populate form when product data arrives ──────────────────────────
  useEffect(() => {
    if (!product || initialized) return;

    reset({
      name:                product.name,
      slug:                product.slug,
      sku:                 product.sku        ?? "",
      description:         product.description       ?? "",
      short_description:   product.short_description ?? "",
      brand:               product.brand      ?? "",
      price:               product.price,
      compare_price:       product.compare_price ?? undefined,
      cost_price:          undefined,
      stock:               product.stock,
      low_stock_threshold: 5,
      weight:              undefined,
      status:              product.status as any,
      is_featured:         product.is_featured,
      is_best_seller:      product.is_best_seller,
      category_id:         product.category_id ?? null,
      meta_title:          "",
      meta_description:    "",
      difficulty_level:    (product.difficulty_level as any) ?? "",
      gender:              (product.gender as any) ?? "",
      variants: (product.variants ?? []).map(v => ({
        name:           v.name,
        value:          v.value,
        price_modifier: v.price_modifier,
        stock:          v.stock,
        is_active:      v.is_active,
      })),
    });

    // Images
    setImages((product.images ?? []).map(img => ({
      id:         img.id,
      url:        img.url,
      alt_text:   img.alt_text ?? "",
      is_primary: img.is_primary,
    })));

    // Catalog v2
    setHighlights(product.highlights ?? []);
    setSpecifications((product.specifications as Specifications) ?? {});
    setManufacturerInfo((product.manufacturer_info as ManufacturerInfo) ?? {});

    setInitialized(true);
  }, [product, initialized, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError(null);
    try {
      const payload = {
        ...data,
        difficulty_level:  data.difficulty_level || null,
        gender:            data.gender           || null,
        // Catalog v2
        highlights:        highlights.filter(h => h.trim()),
        specifications:    Object.keys(specifications).length ? specifications : null,
        manufacturer_info: Object.keys(manufacturerInfo).length ? manufacturerInfo : null,
        images: images.map(img => ({
          url: img.url, public_id: img.public_id,
          alt_text: img.alt_text, is_primary: img.is_primary,
        })),
      };
      await api.put(`/products/${id}`, payload);
      await qc.invalidateQueries({ queryKey: ["admin-products"] });
      await qc.invalidateQueries({ queryKey: ["products"] });
      await qc.invalidateQueries({ queryKey: ["product"] });
      await qc.invalidateQueries({ queryKey: ["admin-product", id] });
      toast.success("Product updated!");
      router.push("/admin/products");
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      if (typeof detail === "string") {
        setServerError(detail);
      } else if (Array.isArray(detail)) {
        const msgs = detail.map((d: any) => {
          const loc = d.loc?.slice(1).join(" → ") || "field";
          return `${loc}: ${d.msg}`;
        }).join("\n");
        setServerError(msgs);
      } else {
        setServerError("Failed to update product.");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="max-w-3xl space-y-5 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 h-40" />
        ))}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Product not found.</p>
        <Link href="/admin/products" className="text-brand-600 underline mt-2 inline-block">Back to products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/products"
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-sm text-gray-400 mt-0.5">{product.name}</p>
        </div>
      </div>

      {/* Server error banner */}
      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <span className="text-red-500 text-lg shrink-0">⚠</span>
          <div>
            <p className="font-bold text-red-700 text-sm">Could not update product</p>
            <pre className="text-red-600 text-sm mt-0.5 whitespace-pre-wrap font-sans">{serverError}</pre>
          </div>
          <button onClick={() => setServerError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X size={15} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Basic Info ──────────────────────────────────────────────── */}
        <Card title="Basic Information">
          <div>
            <Lbl required>Product Name</Lbl>
            <input {...register("name")} className={`${iCls} ${errors.name ? iErr : ""}`} />
            <ErrMsg msg={errors.name?.message} />
          </div>
          <div>
            <Lbl required>URL Slug</Lbl>
            <input {...register("slug")} className={`${iCls} font-mono text-sm ${errors.slug ? iErr : ""}`} />
            <ErrMsg msg={errors.slug?.message} />
          </div>
          <div>
            <Lbl>Short Description</Lbl>
            <input {...register("short_description")} className={iCls} />
          </div>
          <div>
            <Lbl>Full Description</Lbl>
            <textarea {...register("description")} rows={5} className={`${iCls} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Lbl>Brand</Lbl>
              <input {...register("brand")} className={iCls} />
            </div>
            <div>
              <Lbl>SKU</Lbl>
              <input {...register("sku")} className={`${iCls} font-mono`} />
            </div>
          </div>
        </Card>

        {/* ── Images ──────────────────────────────────────────────────── */}
        <Card title="Product Images">
          <ImageUploadPanel images={images} setImages={setImages} />
        </Card>

        {/* ── Catalog v2: Highlights ───────────────────────────────────── */}
        <Card
          title="Product Highlights"
          subtitle="Bullet points shown prominently on the product page"
        >
          <HighlightsEditor value={highlights} onChange={setHighlights} />
        </Card>

        {/* ── Catalog v2: Specifications ───────────────────────────────── */}
        <Card
          title="Specifications"
          subtitle="Grouped spec sections — fully dynamic, no hardcoded fields"
        >
          <SpecificationBuilder value={specifications} onChange={setSpecifications} />
        </Card>

        {/* ── Catalog v2: Manufacturer Info ────────────────────────────── */}
        <Card
          title="Manufacturer Information"
          subtitle="Compliance and manufacturer details"
        >
          <ManufacturerInfoEditor value={manufacturerInfo} onChange={setManufacturerInfo} />
        </Card>

        {/* ── Category ────────────────────────────────────────────────── */}
        <Card title="Category">
          <div className="grid grid-cols-2 gap-5">
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
            <div>
              <Lbl>Sub-Category</Lbl>
              <select
                {...register("category_id")}
                disabled={!parentCatId}
                className={`${iCls} disabled:bg-gray-50 disabled:cursor-not-allowed`}
              >
                <option value="">
                  {parentCatId ? "— Select Sub-category —" : "Select a sport first"}
                </option>
                {subCats.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* ── Pricing & Stock ──────────────────────────────────────────── */}
        <Card title="Pricing & Stock">
          <div className="grid grid-cols-3 gap-5">
            <div>
              <Lbl required>Selling Price (₹)</Lbl>
              <input type="number" step="0.01" {...register("price")}
                className={`${iCls} ${errors.price ? iErr : ""}`} />
              <ErrMsg msg={errors.price?.message} />
            </div>
            <div>
              <Lbl>Compare Price (₹)</Lbl>
              <input type="number" step="0.01" {...register("compare_price")} className={iCls} />
            </div>
            <div>
              <Lbl>Cost Price (₹)</Lbl>
              <input type="number" step="0.01" {...register("cost_price")} className={iCls} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-5">
            <div>
              <Lbl required>Stock Qty</Lbl>
              <input type="number" {...register("stock")}
                className={`${iCls} ${errors.stock ? iErr : ""}`} />
              <ErrMsg msg={errors.stock?.message} />
            </div>
            <div>
              <Lbl>Low Stock Alert</Lbl>
              <input type="number" {...register("low_stock_threshold")} className={iCls} />
            </div>
            <div>
              <Lbl>Weight (kg)</Lbl>
              <input type="number" step="0.001" {...register("weight")} className={iCls} />
            </div>
          </div>
        </Card>

        {/* ── Classification ────────────────────────────────────────────── */}
        <Card title="Classification">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Lbl>Difficulty Level</Lbl>
              <select {...register("difficulty_level")} className={iCls}>
                <option value="">— Not Set —</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <Lbl>Gender Category</Lbl>
              <select {...register("gender")} className={iCls}>
                <option value="">— Not Set —</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="unisex">Unisex</option>
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
              </select>
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
              <option value="out_of_stock">Out of Stock</option>
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
            <p className="text-sm text-gray-500">Note: editing variants here replaces the full variants list.</p>
            <button type="button"
              onClick={() => append({ name: "", value: "", price_modifier: 0, stock: 0, is_active: true })}
              className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-semibold">
              <Plus size={14} /> Add Variant
            </button>
          </div>
          {fields.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No variants.</p>
          ) : (
            <div className="space-y-3">
              {fields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-5 gap-3 items-end">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Type</label>
                    <input {...register(`variants.${i}.name`)} className={iCls} placeholder="Size" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Value</label>
                    <input {...register(`variants.${i}.value`)} className={iCls} placeholder="XL" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Price Adj (₹)</label>
                    <input type="number" {...register(`variants.${i}.price_modifier`, { valueAsNumber: true })}
                      className={iCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Stock</label>
                    <input type="number" {...register(`variants.${i}.stock`, { valueAsNumber: true })}
                      className={iCls} />
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
            <input {...register("meta_title")} className={iCls} />
          </div>
          <div>
            <Lbl>Meta Description</Lbl>
            <textarea {...register("meta_description")} rows={2} className={`${iCls} resize-none`} />
          </div>
        </Card>

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <div className="flex gap-4 pb-6">
          <button type="submit" disabled={loading}
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
              : <><Save size={16} /> Save Changes</>
            }
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
