"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2, Trash2, AlertTriangle, ShieldCheck } from "lucide-react";

export default function SecurityPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const [pw, setPw] = useState({ current: "", new: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  const strength = (() => {
    const p = pw.new;
    if (!p) return { score: 0, label: "", color: "" };
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    const levels = [
      { label: "Weak",   color: "bg-red-500"   },
      { label: "Fair",   color: "bg-orange-400" },
      { label: "Good",   color: "bg-yellow-500" },
      { label: "Strong", color: "bg-green-500"  },
    ];
    return { score: s, ...levels[Math.min(s - 1, 3)] };
  })();

  const changePwMutation = useMutation({
    mutationFn: () =>
      api.post("/users/change-password", {
        current_password: pw.current,
        new_password:     pw.new,
        confirm_password: pw.confirm,
      }),
    onSuccess: () => {
      toast.success("Password changed! Please log in again.");
      setPw({ current: "", new: "", confirm: "" });
      setTimeout(() => { logout(); router.push("/auth/login"); }, 1500);
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Failed to change password"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete("/users/account", { data: { password: deletePassword } }),
    onSuccess: () => { toast.success("Account deleted."); logout(); router.push("/"); },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Failed to delete account"),
  });

  const handleChangePw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw.current || !pw.new || !pw.confirm) { toast.error("All fields required"); return; }
    if (pw.new !== pw.confirm) { toast.error("Passwords do not match"); return; }
    if (pw.new.length < 6) { toast.error("Minimum 6 characters"); return; }
    changePwMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
            <Lock size={16} className="text-brand-600" />
          </div>
          <div>
            <h2 className="font-black text-gray-900">Change Password</h2>
            <p className="text-xs text-gray-500">Use a strong password you don't use elsewhere</p>
          </div>
        </div>
        <form onSubmit={handleChangePw} className="p-6 space-y-4">
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <input type={showCurrent ? "text" : "password"} value={pw.current}
                onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                className="input pr-10" placeholder="Your current password" autoComplete="current-password" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input type={showNew ? "text" : "password"} value={pw.new}
                onChange={(e) => setPw((p) => ({ ...p, new: e.target.value }))}
                className="input pr-10" placeholder="Minimum 6 characters" autoComplete="new-password" />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {pw.new && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : "bg-gray-200"}`} />
                  ))}
                </div>
                <p className={`text-xs font-semibold ${strength.score >= 3 ? "text-green-600" : strength.score >= 2 ? "text-yellow-600" : "text-red-500"}`}>
                  {strength.label}
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <div className="relative">
              <input type={showConfirm ? "text" : "password"} value={pw.confirm}
                onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                className={`input pr-10 ${pw.confirm && pw.new !== pw.confirm ? "border-red-300 focus:ring-red-400" : ""}`}
                placeholder="Repeat new password" autoComplete="new-password" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {pw.confirm && pw.new !== pw.confirm && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
          </div>
          <button type="submit" disabled={changePwMutation.isLoading}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-60">
            {changePwMutation.isLoading
              ? <><Loader2 size={15} className="animate-spin" /> Updating…</>
              : <><ShieldCheck size={15} /> Update Password</>}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-black text-gray-900 mb-4">Account Information</h3>
        <dl className="space-y-0">
          {[
            { label: "Account ID",     value: `#${user?.id}` },
            { label: "Email",          value: user?.email },
            { label: "Email Status",   value: user?.is_email_verified ? "✓ Verified" : "⚠ Not Verified" },
            { label: "Role",           value: user?.role?.replace("_", " ") },
            { label: "Account Status", value: "Active" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
              <dt className="text-sm text-gray-500 font-medium">{label}</dt>
              <dd className="text-sm text-gray-900 font-semibold capitalize">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-3">
          <AlertTriangle size={16} className="text-red-500" />
          <div>
            <h2 className="font-black text-red-900">Danger Zone</h2>
            <p className="text-xs text-red-600">These actions are permanent and cannot be undone</p>
          </div>
        </div>
        <div className="p-6">
          {!showDeleteSection ? (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-gray-900 text-sm">Delete Account</p>
                <p className="text-xs text-gray-500 mt-0.5">Permanently remove your account and all associated data</p>
              </div>
              <button onClick={() => setShowDeleteSection(true)}
                className="shrink-0 flex items-center gap-1.5 border border-red-300 text-red-600 hover:bg-red-50 font-bold text-sm px-4 py-2 rounded-xl transition-colors">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-50 rounded-xl p-4 text-sm text-red-700">
                <p className="font-bold mb-1">⚠ This will permanently delete:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>Your profile and personal data</li>
                  <li>Your order history and wishlist</li>
                  <li>All reviews you've written</li>
                </ul>
              </div>
              <div>
                <label className="label">Type <strong>DELETE</strong> to confirm</label>
                <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} className="input" placeholder="DELETE" />
              </div>
              <div>
                <label className="label">Enter your password</label>
                <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="input" placeholder="Your current password" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteSection(false); setDeleteConfirm(""); setDeletePassword(""); }}
                  className="flex-1 border border-gray-300 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-50 text-sm">Cancel</button>
                <button onClick={() => deleteMutation.mutate()}
                  disabled={deleteConfirm !== "DELETE" || !deletePassword || deleteMutation.isLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl disabled:opacity-50 text-sm">
                  {deleteMutation.isLoading
                    ? <><Loader2 size={14} className="animate-spin" /> Deleting…</>
                    : <><Trash2 size={14} /> Delete Account</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
