"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Mail, Phone, MapPin, Globe, Instagram, Youtube, Facebook,
  Twitter, Save, Store, Clock, MessageSquare, AlertCircle,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

// ── Types ────────────────────────────────────────────────────────────────────
interface StoreSettings {
  store_name:    string;
  tagline:       string;
  email:         string;
  phone:         string;
  address:       string;
  address_line1: string;
  address_line2: string;
  city:          string;
  state:         string;
  country:       string;
  pincode:       string;
  whatsapp:      string;
  instagram:     string;
  facebook:      string;
  youtube:       string;
  twitter:       string;
  map_embed_url: string;
  support_hours: string;
}

const DEFAULTS: StoreSettings = {
  store_name:    "Racketek Outlet",
  tagline:       "India's Biggest Sports E-Commerce Store",
  email:         "support@racketek.com",
  phone:         "+91 94911 47433",
  address:       "Hyderabad, Telangana, India",
  address_line1: "",
  address_line2: "",
  city:          "Hyderabad",
  state:         "Telangana",
  country:       "India",
  pincode:       "",
  whatsapp:      "+91 94911 47433",
  instagram:     "",
  facebook:      "",
  youtube:       "",
  twitter:       "",
  map_embed_url: "",
  support_hours: "Mon–Sat, 10 AM – 7 PM IST",
};

// ── Design primitives ────────────────────────────────────────────────────────
const iCls =
  "w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all bg-white";

function Field({
  label, sub, icon: Icon, children,
}: {
  label: string;
  sub?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon size={13} className="text-gray-400" />}
        {label}
      </label>
      {sub && <p className="text-xs text-gray-400 mb-1.5">{sub}</p>}
      {children}
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
        <Icon size={15} className="text-brand-600" />
        <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<StoreSettings>(DEFAULTS);
  const [dirty, setDirty] = useState(false);

  const { data, isLoading } = useQuery<StoreSettings>({
    queryKey: ["admin-settings"],
    queryFn: () => api.get("/admin/settings").then((r) => r.data),
  });

  // Seed form when data arrives
  useEffect(() => {
    if (data) {
      setForm({ ...DEFAULTS, ...data });
      setDirty(false);
    }
  }, [data]);

  const set = (key: keyof StoreSettings, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const saveMut = useMutation({
    mutationFn: (payload: Partial<StoreSettings>) =>
      api.put("/admin/settings", payload),
    onSuccess: () => {
      toast.success("Settings saved ✓");
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["store-settings"] });
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.detail || "Failed to save settings"),
  });

  const handleSave = () => saveMut.mutate(form);

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-5 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 h-48" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Contact details, social links and store information shown throughout the site
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveMut.isLoading || !dirty}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {saveMut.isLoading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {saveMut.isLoading ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {dirty && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle size={13} />
          You have unsaved changes — click Save Changes to publish them to the site.
        </div>
      )}

      {/* ── Store Identity ────────────────────────────────────────── */}
      <Card title="Store Identity" icon={Store}>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Store Name" icon={Store}>
            <input
              value={form.store_name}
              onChange={(e) => set("store_name", e.target.value)}
              className={iCls}
              placeholder="Racketek Outlet"
            />
          </Field>
          <Field label="Tagline" sub="Shown below the logo in the footer">
            <input
              value={form.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              className={iCls}
              placeholder="India's Biggest Sports E-Commerce Store"
            />
          </Field>
        </div>
      </Card>

      {/* ── Contact Details ───────────────────────────────────────── */}
      <Card title="Contact Details" icon={Phone}>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Email Address" icon={Mail}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={iCls}
              placeholder="support@racketek.com"
            />
          </Field>
          <Field label="Phone Number" icon={Phone}>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={iCls}
              placeholder="+91 94911 47433"
            />
          </Field>
          <Field label="WhatsApp Number" icon={MessageSquare} sub="Used for WhatsApp chat button">
            <input
              type="tel"
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              className={iCls}
              placeholder="+91 94911 47433"
            />
          </Field>
          <Field label="Support Hours" icon={Clock}>
            <input
              value={form.support_hours}
              onChange={(e) => set("support_hours", e.target.value)}
              className={iCls}
              placeholder="Mon–Sat, 10 AM – 7 PM IST"
            />
          </Field>
        </div>
      </Card>

      {/* ── Address ───────────────────────────────────────────────── */}
      <Card title="Store Address" icon={MapPin}>
        <Field label="Short Address" sub="Displayed in the footer (e.g. Hyderabad, Telangana, India)" icon={MapPin}>
          <input
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            className={iCls}
            placeholder="Hyderabad, Telangana, India"
          />
        </Field>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Address Line 1">
            <input
              value={form.address_line1}
              onChange={(e) => set("address_line1", e.target.value)}
              className={iCls}
              placeholder="Plot 42, Jubilee Hills"
            />
          </Field>
          <Field label="Address Line 2">
            <input
              value={form.address_line2}
              onChange={(e) => set("address_line2", e.target.value)}
              className={iCls}
              placeholder="Near ICICI Bank"
            />
          </Field>
          <Field label="City">
            <input
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className={iCls}
              placeholder="Hyderabad"
            />
          </Field>
          <Field label="State">
            <input
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              className={iCls}
              placeholder="Telangana"
            />
          </Field>
          <Field label="Country">
            <input
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              className={iCls}
              placeholder="India"
            />
          </Field>
          <Field label="Pincode">
            <input
              value={form.pincode}
              onChange={(e) => set("pincode", e.target.value)}
              className={iCls}
              placeholder="500033"
            />
          </Field>
        </div>
        <Field label="Google Maps Embed URL" icon={Globe} sub="Paste the src URL from Google Maps → Share → Embed">
          <input
            value={form.map_embed_url}
            onChange={(e) => set("map_embed_url", e.target.value)}
            className={iCls + " font-mono text-xs"}
            placeholder="https://www.google.com/maps/embed?pb=…"
          />
        </Field>
      </Card>

      {/* ── Social Links ──────────────────────────────────────────── */}
      <Card title="Social Media Links" icon={Globe}>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Instagram" icon={Instagram}>
            <input
              value={form.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              className={iCls}
              placeholder="https://instagram.com/racketekoutlet"
            />
          </Field>
          <Field label="Facebook" icon={Facebook}>
            <input
              value={form.facebook}
              onChange={(e) => set("facebook", e.target.value)}
              className={iCls}
              placeholder="https://facebook.com/racketekoutlet"
            />
          </Field>
          <Field label="YouTube" icon={Youtube}>
            <input
              value={form.youtube}
              onChange={(e) => set("youtube", e.target.value)}
              className={iCls}
              placeholder="https://youtube.com/@racketekoutlet"
            />
          </Field>
          <Field label="Twitter / X" icon={Twitter}>
            <input
              value={form.twitter}
              onChange={(e) => set("twitter", e.target.value)}
              className={iCls}
              placeholder="https://twitter.com/racketekoutlet"
            />
          </Field>
        </div>
      </Card>

      {/* Preview card */}
      <div className="bg-gray-950 rounded-xl p-6 text-gray-400">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Footer Preview</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2.5">
            <Mail size={13} className="text-brand-500 shrink-0" />
            <span>{form.email || "—"}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Phone size={13} className="text-brand-500 shrink-0" />
            <span>{form.phone || "—"}</span>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin size={13} className="text-brand-500 shrink-0 mt-0.5" />
            <span>{form.address || "—"}</span>
          </div>
          {form.support_hours && (
            <div className="flex items-center gap-2.5">
              <Clock size={13} className="text-brand-500 shrink-0" />
              <span>{form.support_hours}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sticky save bar */}
      {dirty && (
        <div className="sticky bottom-4 bg-white border border-gray-200 rounded-xl shadow-xl px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 font-medium">You have unsaved changes</p>
          <div className="flex gap-3">
            <button
              onClick={() => { setForm({ ...DEFAULTS, ...data }); setDirty(false); }}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saveMut.isLoading}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 py-2 rounded-lg transition-all disabled:opacity-50 text-sm"
            >
              {saveMut.isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
