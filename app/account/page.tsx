"use client";
import { useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
  Save, Mail, CheckCircle, Loader2, Package,
  ChevronRight, Camera, Phone, Calendar, MapPin, X,
} from "lucide-react";
import Link from "next/link";
import { formatDate, formatPrice, getStatusColor, getInitials } from "@/lib/utils";
import { PaginatedOrders } from "@/types";

/* ─── reusable input styles ──────────────────────────────────────────────── */
const inp = "input";

function Lbl({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
      {children}{req && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

/* ─── simple avatar uploader ─────────────────────────────────────────────── */
function AvatarUploader({
  currentUrl,
  onUploaded,
}: {
  currentUrl: string;
  onUploaded: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading]   = useState(false);
  const [progress,  setProgress]    = useState(0);
  const [preview,   setPreview]     = useState(currentUrl);
  const [error,     setError]       = useState("");

  const pickFile = () => fileRef.current?.click();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large — max 10 MB.");
      return;
    }

    /* local preview immediately */
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setError("");
    setUploading(true);
    setProgress(0);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await api.post("/upload/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: e => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      const url: string = res.data?.url ?? res.data?.secure_url ?? "";
      if (!url) throw new Error("No URL returned");
      onUploaded(url);
      setPreview(url);
      toast.success("Photo uploaded!");
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.message ?? "Upload failed";
      setError(typeof msg === "string" ? msg : "Upload failed — please try again");
      setPreview(currentUrl);   /* revert preview */
    } finally {
      setUploading(false);
      setProgress(0);
      URL.revokeObjectURL(localUrl);
    }
  };

  return (
    <div className="flex items-center gap-5">
      {/* Avatar circle — click to upload */}
      <button
        type="button"
        onClick={pickFile}
        disabled={uploading}
        className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {preview ? (
          <img src={preview} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-3xl font-black">
            {getInitials("U")}
          </div>
        )}

        {/* Overlay on hover / uploading */}
        <div className={[
          "absolute inset-0 flex flex-col items-center justify-center gap-1 transition-all",
          uploading
            ? "bg-black/50"
            : "bg-black/0 group-hover:bg-black/50",
        ].join(" ")}>
          {uploading ? (
            <>
              <Loader2 size={20} className="text-white animate-spin" />
              <span className="text-white text-[11px] font-bold">{progress}%</span>
            </>
          ) : (
            <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </button>

      {/* Info + progress */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800">Profile Photo</p>
        <p className="text-xs text-gray-400 mt-0.5">Click the photo to upload a new one</p>
        <p className="text-xs text-gray-400">JPG, PNG, WebP · max 10 MB</p>

        {uploading && (
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden w-32">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {error && (
          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <X size={11} className="shrink-0" /> {error}
          </p>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          /* reset so same file can be re-selected */
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function AccountProfilePage() {
  const { user, updateUser, isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const [verificationSent, setVerificationSent] = useState(false);

  const [form, setForm] = useState({
    full_name:     user?.full_name     ?? "",
    phone:         user?.phone         ?? "",
    date_of_birth: user?.date_of_birth ?? "",
    address_line1: user?.address_line1 ?? "",
    city:          user?.city          ?? "",
    state:         user?.state         ?? "",
    pincode:       user?.pincode       ?? "",
    profile_image: user?.profile_image ?? "",
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  /* when avatar uploads, update form AND save immediately */
  const onAvatarUploaded = (url: string) => {
    const updated = { ...form, profile_image: url };
    setForm(updated);
    profileMut.mutate(updated);
  };

  /* ── queries & mutations ─────────────────────────────────────────────── */
  const { data: ordersData } = useQuery<PaginatedOrders>({
    queryKey: ["orders-recent"],
    queryFn: () => api.get("/orders?per_page=5").then(r => r.data),
    enabled: isAuthenticated,
  });

  const profileMut = useMutation({
    mutationFn: (data: typeof form) =>
      api.put("/users/profile", data).then(r => r.data),
    onSuccess: data => {
      updateUser(data); // update Zustand store
      // Bust all query caches that depend on user profile data
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile saved!");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail ?? "Failed to save profile"),
  });

  const verifyMut = useMutation({
    mutationFn: () =>
      api.post("/users/send-verification-email").then(r => r.data),
    onSuccess: data => {
      setVerificationSent(true);
      toast.success("Verification email sent!");
      if (data.verify_url) window.open(data.verify_url, "_blank");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail ?? "Could not send email"),
  });

  if (!user) return null;

  const recentOrders = ordersData?.items?.slice(0, 3) ?? [];

  function SaveBtn({ label = "Save Changes" }: { label?: string }) {
    return (
      <button
        onClick={() => profileMut.mutate(form)}
        disabled={profileMut.isPending}
        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm transition-all hover:scale-[1.01] active:scale-100 disabled:opacity-60"
      >
        {profileMut.isPending
          ? <Loader2 size={14} className="animate-spin" />
          : <Save size={14} />}
        {label}
      </button>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ══════════════════ LEFT COLUMN ══════════════════ */}
      <div className="lg:col-span-2 space-y-6">

        {/* Email banners */}
        {!user.is_email_verified && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-orange-400 text-xl shrink-0 mt-0.5">⚠</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-orange-800">Email not verified</p>
              <p className="text-xs text-orange-600 mt-0.5">
                Verify to secure your account and receive order updates.
              </p>
            </div>
            <button
              onClick={() => verifyMut.mutate()}
              disabled={verifyMut.isLoading || verificationSent}
              className="shrink-0 flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-60 transition-all"
            >
              {verifyMut.isLoading
                ? <Loader2 size={11} className="animate-spin" />
                : <Mail size={11} />}
              {verificationSent ? "Sent ✓" : "Verify Now"}
            </button>
          </div>
        )}

        {user.is_email_verified && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle size={16} className="text-green-600 shrink-0" />
            <p className="text-sm font-semibold text-green-800">
              Email verified — your account is secure
            </p>
          </div>
        )}

        {/* ── Profile photo card ─────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-black text-gray-900">Profile Photo</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Click your photo to change it — saves automatically
            </p>
          </div>
          <div className="p-6">
            <AvatarUploader
              currentUrl={form.profile_image}
              onUploaded={onAvatarUploaded}
            />
          </div>
        </div>

        {/* ── Personal info card ─────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-black text-gray-900">Personal Information</h2>
            <p className="text-xs text-gray-400 mt-0.5">Name, phone and date of birth</p>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Lbl req>Full Name</Lbl>
                <input value={form.full_name} onChange={e => set("full_name", e.target.value)}
                  placeholder="Your full name" className={inp} />
              </div>

              <div>
                <Lbl>Phone Number</Lbl>
                <div className="relative">
                  <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input value={form.phone} onChange={e => set("phone", e.target.value)}
                    placeholder="+91 XXXXX XXXXX" className={`${inp} pl-9`} />
                </div>
              </div>

              <div>
                <Lbl>Date of Birth</Lbl>
                <div className="relative">
                  <Calendar size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="date" value={form.date_of_birth}
                    onChange={e => set("date_of_birth", e.target.value)}
                    className={`${inp} pl-9`} />
                </div>
              </div>

              <div>
                <Lbl>Email</Lbl>
                <div className="relative">
                  <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input value={user.email} disabled
                    className={`${inp} pl-9 bg-gray-50 text-gray-400 cursor-not-allowed pr-24`} />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    user.is_email_verified
                      ? "bg-green-100 text-green-700 dark:bg-[rgb(12_45_22)] dark:text-[#86efac]"
                      : "bg-orange-100 text-orange-600 dark:bg-[rgb(55_22_5)] dark:text-[#fb923c]"
                  }`}>
                    {user.is_email_verified ? "✓ Verified" : "Unverified"}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Email cannot be changed.</p>
              </div>
            </div>
            <SaveBtn label="Save Personal Info" />
          </div>
        </div>

        {/* ── Delivery address card ──────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-black text-gray-900">Default Delivery Address</h2>
            <p className="text-xs text-gray-400 mt-0.5">Pre-fills at checkout automatically</p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <Lbl>Street Address</Lbl>
              <div className="relative">
                <MapPin size={13} className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" />
                <input value={form.address_line1}
                  onChange={e => set("address_line1", e.target.value)}
                  placeholder="House no., street name, area"
                  className={`${inp} pl-9`} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Lbl>City</Lbl>
                <input value={form.city} onChange={e => set("city", e.target.value)}
                  placeholder="City" className={inp} />
              </div>
              <div>
                <Lbl>State</Lbl>
                <input value={form.state} onChange={e => set("state", e.target.value)}
                  placeholder="State" className={inp} />
              </div>
              <div>
                <Lbl>Pincode</Lbl>
                <input value={form.pincode} onChange={e => set("pincode", e.target.value)}
                  placeholder="6-digit" maxLength={6} className={inp} />
              </div>
            </div>

            <SaveBtn label="Save Address" />
          </div>
        </div>

      </div>

      {/* ══════════════════ RIGHT COLUMN ══════════════════ */}
      <div className="space-y-5">

        {/* Account summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-gray-900 mb-4 text-sm">Account Summary</h3>
          {[
            { label: "Total Orders",    value: ordersData?.total ?? "—", href: "/account/orders" },
            { label: "Wishlist Items",  value: "View", href: "/account/wishlist" },
            { label: "Saved Addresses", value: "View", href: "/account/addresses" },
          ].map(s => (
            <Link key={s.href} href={s.href}
              className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 text-sm hover:text-brand-600 transition-colors">
              <span className="text-gray-600">{s.label}</span>
              <span className="font-bold text-gray-900 flex items-center gap-1">
                {s.value} <ChevronRight size={12} />
              </span>
            </Link>
          ))}
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-black text-gray-900 text-sm">Recent Orders</h3>
            <Link href="/account/orders" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-10 text-center">
              <Package size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No orders yet</p>
              <Link href="/products" className="inline-block mt-3 text-xs font-semibold text-brand-600 hover:underline">
                Start shopping →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOrders.map(order => (
                <Link key={order.id} href={`/account/orders/${order.order_number}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-gray-800">{order.order_number}</p>
                    <p className="text-[11px] text-gray-400">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">{formatPrice(order.total_amount)}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-gray-900 mb-3 text-sm">Quick Links</h3>
          {[
            { href: "/account/security", label: "🔒 Change Password" },
            { href: "/account/support",  label: "🎧 Support Tickets" },
            { href: "/account/returns",  label: "↩ Returns & Refunds" },
            { href: "/products",         label: "🛒 Continue Shopping" },
          ].map(l => (
            <Link key={l.href} href={l.href}
              className="block text-sm text-gray-600 hover:text-brand-600 py-2 transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
