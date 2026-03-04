"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Edit3, ChevronRight, ChevronDown, FolderOpen,
  Folder, Check, X, Image as ImageIcon, Search, AlertTriangle,
  GripVertical, Eye, EyeOff, RefreshCw,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import CloudinaryUploader from "@/components/admin/CloudinaryUploader";

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id: number | null;
  is_active: boolean;
  sort_order: number;
  children?: Category[];
  products?: { id: number }[];
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  image: string;
  parent_id: number | null;
  is_active: boolean;
  sort_order: number;
}

const EMPTY_FORM: FormState = {
  name: "", slug: "", description: "", image: "", parent_id: null, is_active: true, sort_order: 0,
};

const inp = "w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all";

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/* ── Category Form Modal ────────────────────────────────────────────────────── */
function CategoryFormModal({
  mode, initial, parents, onClose, onSave,
}: {
  mode: "create" | "edit";
  initial: FormState;
  parents: Category[];
  onClose: () => void;
  onSave: (data: FormState) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof FormState, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleNameChange = (name: string) => {
    set("name", name);
    if (mode === "create") set("slug", slugify(name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!form.slug.trim()) { toast.error("Slug is required"); return; }
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  };

  const Lbl = ({ children, req }: { children: React.ReactNode; req?: boolean }) => (
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
      {children}{req && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {mode === "create" ? "New Category" : "Edit Category"}
            </h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
              {form.parent_id ? "Sub-category" : "Top-level sport category"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors">
            <X size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Parent selector */}
          <div>
            <Lbl>Type</Lbl>
            <div className="grid grid-cols-2 gap-3">
              <button type="button"
                onClick={() => set("parent_id", null)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  form.parent_id === null
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400"
                }`}>
                <Folder size={20} className={form.parent_id === null ? "text-brand-600 dark:text-brand-400" : "text-gray-400 dark:text-gray-500"} />
                <div>
                  <p className="text-sm font-semibold">Parent Sport</p>
                  <p className="text-xs opacity-70">e.g. Badminton, Cricket</p>
                </div>
              </button>
              <button type="button"
                onClick={() => set("parent_id", form.parent_id || (parents[0]?.id ?? null))}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  form.parent_id !== null
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400"
                }`}>
                <FolderOpen size={20} className={form.parent_id !== null ? "text-brand-600 dark:text-brand-400" : "text-gray-400 dark:text-gray-500"} />
                <div>
                  <p className="text-sm font-semibold">Sub-category</p>
                  <p className="text-xs opacity-70">e.g. Rackets, Shoes</p>
                </div>
              </button>
            </div>
          </div>

          {/* Parent picker */}
          {form.parent_id !== null && (
            <div>
              <Lbl req>Parent Sport</Lbl>
              <select value={form.parent_id || ""} onChange={e => set("parent_id", parseInt(e.target.value) || null)} className={inp}>
                <option value="">— Select parent sport —</option>
                {parents.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Name + Slug */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Lbl req>Category Name</Lbl>
              <input value={form.name} onChange={e => handleNameChange(e.target.value)}
                placeholder={form.parent_id ? "e.g. Rackets" : "e.g. Badminton"} className={inp} />
            </div>
            <div>
              <Lbl req>URL Slug</Lbl>
              <input value={form.slug} onChange={e => set("slug", slugify(e.target.value))}
                placeholder="badminton-rackets" className={`${inp} font-mono text-xs`} />
            </div>
          </div>

          {/* Description */}
          <div>
            <Lbl>Description</Lbl>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              rows={2} placeholder="Short description for this category…"
              className={`${inp} resize-none leading-relaxed`} />
          </div>

          {/* Image */}
          <div>
            <Lbl>Category Image</Lbl>
            <CloudinaryUploader
              value={form.image} onChange={v => set("image", v)}
              aspect="wide" hint="Recommended: 800 × 400 px"
              folder="racketek/categories"
            />
          </div>

          {/* Sort order + visibility */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Lbl>Sort Order</Lbl>
              <input type="number" value={form.sort_order} onChange={e => set("sort_order", parseInt(e.target.value) || 0)}
                className={inp} placeholder="0" />
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Lower number = appears first</p>
            </div>
            <div>
              <Lbl>Visibility</Lbl>
              <button type="button" onClick={() => set("is_active", !form.is_active)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border-2 transition-all ${
                  form.is_active ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                }`}>
                {form.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
                <span className="text-sm font-semibold">{form.is_active ? "Visible in store" : "Hidden"}</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                : <><Check size={15} />{mode === "create" ? "Create Category" : "Save Changes"}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Category Row ───────────────────────────────────────────────────────────── */
function CategoryRow({
  cat, level = 0, allParents, onEdit, onDelete, onToggle,
}: {
  cat: Category; level?: number;
  allParents: Category[];
  onEdit: (cat: Category) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, active: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = cat.children && cat.children.length > 0;
  const productCount = cat.products?.length ?? 0;

  return (
    <>
      <tr className={`group transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/50 ${!cat.is_active ? "opacity-60" : ""}`}>
        <td className="px-4 py-3 w-10">
          <GripVertical size={14} className="text-gray-300 dark:text-gray-600 cursor-grab" />
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: level * 20 }}>
            {/* Expand toggle */}
            {hasChildren ? (
              <button onClick={() => setExpanded(e => !e)}
                className="w-5 h-5 rounded flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0">
                {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            ) : (
              <span className="w-5 h-5 shrink-0 flex items-center justify-center">
                {level > 0 && <span className="w-3 h-px bg-gray-300 dark:bg-gray-600" />}
              </span>
            )}

            {/* Icon */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              level === 0 ? "bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            }`}>
              {cat.image
                ? <img src={cat.image} alt="" className="w-full h-full object-cover rounded-lg" />
                : level === 0 ? <Folder size={14} /> : <FolderOpen size={13} />
              }
            </div>

            {/* Name */}
            <div className="min-w-0">
              <p className={`text-sm font-semibold text-gray-800 dark:text-gray-200 truncate ${level === 0 ? "" : "font-medium"}`}>
                {cat.name}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono truncate">{cat.slug}</p>
            </div>
          </div>
        </td>

        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
          {cat.description
            ? <span className="truncate max-w-[200px] block">{cat.description}</span>
            : <span className="text-gray-300 dark:text-gray-600">—</span>}
        </td>

        <td className="px-4 py-3 text-center">
          {hasChildren && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-700">
              {cat.children!.length} sub
            </span>
          )}
        </td>

        <td className="px-4 py-3 text-center">
          {productCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-700">
              {productCount} products
            </span>
          )}
        </td>

        <td className="px-4 py-3 text-center">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
            cat.is_active ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cat.is_active ? "bg-emerald-500" : "bg-gray-400 dark:bg-gray-500"}`} />
            {cat.is_active ? "Active" : "Hidden"}
          </span>
        </td>

        <td className="px-4 py-3">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(cat)}
              className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:border-brand-300 dark:hover:border-brand-600 transition-colors">
              <Edit3 size={12} className="text-gray-500 dark:text-gray-400" />
            </button>
            <button onClick={() => onToggle(cat.id, !cat.is_active)}
              className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              {cat.is_active ? <EyeOff size={12} className="text-gray-400 dark:text-gray-500" /> : <Eye size={12} className="text-gray-400 dark:text-gray-500" />}
            </button>
            <button onClick={() => {
              if (confirm(`Delete "${cat.name}"? ${hasChildren ? "⚠️ This will also delete all sub-categories!" : ""}`)) onDelete(cat.id);
            }}
              className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-700 transition-colors">
              <Trash2 size={12} className="text-red-400 dark:text-red-500" />
            </button>
          </div>
        </td>
      </tr>

      {/* Children */}
      {hasChildren && expanded && cat.children!.map(child => (
        <CategoryRow key={child.id} cat={child} level={level + 1}
          allParents={allParents} onEdit={onEdit} onDelete={onDelete} onToggle={onToggle} />
      ))}
    </>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────────── */
export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState<null | "create" | "edit">(null);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [initParentId, setInitParentId] = useState<number | null>(null);

  /* ── Queries ────────────────────────────────────────────────────────────── */
  const { data: tree = [], isLoading, refetch } = useQuery<Category[]>({
    queryKey: ["admin-categories"],
    queryFn: () => api.get("/categories").then(r => r.data),
  });

  const { data: allFlat = [] } = useQuery<Category[]>({
    queryKey: ["admin-categories-flat"],
    queryFn: () => api.get("/categories/all").then(r => r.data),
  });

  /* ── Derived data ───────────────────────────────────────────────────────── */
  const parents = tree; // root-level only
  const filtered = search
    ? allFlat.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.includes(search.toLowerCase()))
    : null;

  /* ── Mutations ──────────────────────────────────────────────────────────── */
  // Invalidates both admin views AND all customer-facing category caches
  const invalidateCategories = () => {
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["admin-categories-flat"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["categories-root"] });
    qc.invalidateQueries({ queryKey: ["categories-sub"] });
  };

  const createMut = useMutation({
    mutationFn: (data: Partial<FormState>) => api.post("/categories", data),
    onSuccess: () => {
      toast.success("Category created");
      invalidateCategories();
      setModal(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Create failed"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormState> }) => api.put(`/categories/${id}`, data),
    onSuccess: () => {
      toast.success("Category updated");
      invalidateCategories();
      setModal(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Update failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      toast.success("Category deleted");
      invalidateCategories();
    },
    onError: () => toast.error("Delete failed"),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.put(`/categories/${id}`, { is_active }),
    onSuccess: () => invalidateCategories(),
    onError: () => toast.error("Update failed"),
  });

  /* ── Handlers ───────────────────────────────────────────────────────────── */
  const openCreate = (parentId: number | null = null) => {
    setInitParentId(parentId);
    setEditTarget(null);
    setModal("create");
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setModal("edit");
  };

  const handleSave = async (form: FormState) => {
    if (modal === "create") {
      await createMut.mutateAsync(form);
    } else if (editTarget) {
      await updateMut.mutateAsync({ id: editTarget.id, data: form });
    }
  };

  const getInitialForm = (): FormState => {
    if (modal === "edit" && editTarget) {
      return {
        name: editTarget.name,
        slug: editTarget.slug,
        description: editTarget.description || "",
        image: editTarget.image || "",
        parent_id: editTarget.parent_id,
        is_active: editTarget.is_active,
        sort_order: editTarget.sort_order,
      };
    }
    return { ...EMPTY_FORM, parent_id: initParentId };
  };

  /* ── Stats ──────────────────────────────────────────────────────────────── */
  const totalParents = tree.length;
  const totalSubs    = allFlat.filter(c => c.parent_id !== null).length;
  const totalActive  = allFlat.filter(c => c.is_active).length;

  const displayTree = filtered ?? tree;

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Categories</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {totalParents} sports · {totalSubs} sub-categories · {totalActive} active
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()}
            className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <RefreshCw size={14} className="text-gray-500 dark:text-gray-400" />
          </button>
          <button onClick={() => openCreate(null)}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm">
            <Plus size={15} /> Add Sport / Category
          </button>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Parent Sports",   value: totalParents, iconBg: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",    icon: Folder },
          { label: "Sub-categories",  value: totalSubs,    iconBg: "bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400",        icon: FolderOpen },
          { label: "Active",          value: totalActive,  iconBg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400", icon: Eye },
        ].map(({ label, value, iconBg, icon: Icon }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search categories…"
            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
        </div>
        {search && (
          <button onClick={() => setSearch("")}
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : displayTree.length === 0 ? (
          <div className="py-20 text-center">
            <Folder size={40} className="text-gray-200 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">No categories yet</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Add your first sport category to organise your products.</p>
            <button onClick={() => openCreate(null)}
              className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors">
              <Plus size={14} /> Add First Category
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 text-left">
                <th className="w-10 px-4 py-3" />
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sub-cats</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Products</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {search
                ? /* Flat results when searching */
                  (filtered ?? []).map(cat => (
                    <CategoryRow key={cat.id} cat={cat} allParents={parents}
                      onEdit={openEdit}
                      onDelete={id => deleteMut.mutate(id)}
                      onToggle={(id, active) => toggleMut.mutate({ id, is_active: active })}
                    />
                  ))
                : /* Tree when not searching */
                  tree.map(cat => (
                    <CategoryRow key={cat.id} cat={cat} allParents={parents}
                      onEdit={openEdit}
                      onDelete={id => deleteMut.mutate(id)}
                      onToggle={(id, active) => toggleMut.mutate({ id, is_active: active })}
                    />
                  ))
              }
            </tbody>
          </table>
        )}
      </div>

      {/* ── Quick-add sub-category shortcuts ─────────────────────────────── */}
      {!search && tree.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Plus size={14} className="text-brand-600 dark:text-brand-400" /> Quick-add sub-category under…
          </h3>
          <div className="flex flex-wrap gap-2">
            {tree.map(parent => (
              <button key={parent.id} onClick={() => openCreate(parent.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 hover:bg-brand-50 dark:hover:bg-brand-900/20 border border-gray-200 dark:border-gray-600 hover:border-brand-300 dark:hover:border-brand-600 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-brand-700 dark:hover:text-brand-300 transition-all">
                <FolderOpen size={12} className="text-gray-400 dark:text-gray-500" />
                {parent.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {modal && (
        <CategoryFormModal
          mode={modal}
          initial={getInitialForm()}
          parents={parents}
          onClose={() => { setModal(null); setEditTarget(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
