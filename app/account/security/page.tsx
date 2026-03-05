"use client";
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import {
  Lock, Eye, EyeOff, Loader2, Trash2, AlertTriangle, ShieldCheck,
  Mail, Phone, CheckCircle2, RefreshCw,
} from "lucide-react";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

/* ── OTP input ───────────────────────────────────────────────────────── */
function OtpInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handleChange = (i: number, ch: string) => {
    const digit = ch.replace(/\D/, "").slice(-1);
    const arr   = value.split("").concat(Array(OTP_LENGTH).fill("")).slice(0, OTP_LENGTH);
    arr[i]      = digit;
    onChange(arr.join(""));
    if (digit && i < OTP_LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pasted) { onChange(pasted.padEnd(OTP_LENGTH, "")); inputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2" onPaste={handlePaste}>
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={value[i] || ""}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          className="w-10 h-12 text-center text-lg font-black rounded-xl border-2 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all bg-gray-50 text-gray-900 disabled:opacity-40"
          style={{ borderColor: value[i] ? "#16a34a" : "#e5e7eb" }}
        />
      ))}
    </div>
  );
}

/* ── Resend countdown ────────────────────────────────────────────────── */
function ResendTimer({ resendKey, onResend, loading }: { resendKey: number; onResend: () => void; loading: boolean }) {
  const [secs, setSecs] = useState(RESEND_SECONDS);
  useEffect(() => {
    setSecs(RESEND_SECONDS);
    const t = setInterval(() => setSecs(s => { if (s <= 1) { clearInterval(t); return 0; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, [resendKey]);

  if (secs > 0) return (
    <p className="text-xs text-gray-400">Resend in <span className="font-bold text-brand-600">{secs}s</span></p>
  );
  return (
    <button onClick={onResend} disabled={loading}
      className="flex items-center gap-1 text-xs text-brand-600 font-semibold hover:underline disabled:opacity-50">
      <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Resend OTP
    </button>
  );
}

/* ── Reusable OTP verify card ────────────────────────────────────────── */
function OtpVerifyCard({
  type, icon: Icon, label, contact, isVerified,
  sendEndpoint, verifyEndpoint, onVerified,
}: {
  type: "email" | "phone";
  icon: React.ElementType;
  label: string;
  contact: string;
  isVerified: boolean;
  sendEndpoint: string;
  verifyEndpoint: string;
  onVerified: () => void;
}) {
  const [phase,      setPhase]      = useState<"idle" | "otp">("idle");
  const [otp,        setOtp]        = useState("");
  const [resendKey,  setResendKey]  = useState(0);
  const [sendLoad,   setSendLoad]   = useState(false);
  const [verifyLoad, setVerifyLoad] = useState(false);

  const sendOtp = async () => {
    setSendLoad(true);
    try {
      await api.post(sendEndpoint);
      toast.success(`OTP sent to your ${type}!`);
      setOtp("");
      setPhase("otp");
      setResendKey(k => k + 1);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || `Failed to send OTP`);
    } finally {
      setSendLoad(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.replace(/\s/g,"").length < OTP_LENGTH) { toast.error("Enter the full 6-digit OTP"); return; }
    setVerifyLoad(true);
    try {
      await api.post(verifyEndpoint, { otp: otp.trim() });
      toast.success(`${label} verified successfully! ✓`);
      setPhase("idle");
      onVerified();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Invalid or expired OTP.");
    } finally {
      setVerifyLoad(false);
    }
  };

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isVerified ? "bg-green-100" : "bg-orange-100"}`}>
            <Icon size={16} className={isVerified ? "text-green-600" : "text-orange-600"} />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{label} Verification</p>
            <p className="text-xs text-gray-400 font-mono">{contact || "—"}</p>
          </div>
        </div>
        {isVerified ? (
          <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            <CheckCircle2 size={12} /> Verified
          </span>
        ) : (
          <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
            Unverified
          </span>
        )}
      </div>

      <div className="p-5">
        {phase === "idle" ? (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {isVerified
                ? `Your ${type} is verified and secure.`
                : `Verify your ${type} with a one-time code.`}
            </p>
            <button
              onClick={sendOtp}
              disabled={sendLoad || (!contact)}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-50 transition-all ml-4 shrink-0"
            >
              {sendLoad ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
              {isVerified ? "Re-verify" : "Send OTP"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-3">
                Enter the 6-digit code sent to <span className="font-semibold text-gray-700">{contact}</span>
              </p>
              <OtpInput value={otp} onChange={setOtp} disabled={verifyLoad} />
            </div>
            <div className="flex items-center justify-between">
              <ResendTimer resendKey={resendKey} onResend={sendOtp} loading={sendLoad} />
              <div className="flex gap-2">
                <button
                  onClick={() => { setPhase("idle"); setOtp(""); }}
                  className="text-xs text-gray-500 hover:text-gray-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={verifyOtp}
                  disabled={verifyLoad || otp.replace(/\s/g,"").length < OTP_LENGTH}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-1.5 rounded-xl disabled:opacity-50 transition-all"
                >
                  {verifyLoad ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                  Verify
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
export default function SecurityPage() {
  const { user, logout, updateUser } = useAuthStore();
  const router = useRouter();

  const [pw, setPw] = useState({ current: "", new: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm]   = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  // local optimistic state for verified flags
  const [emailVerified, setEmailVerified] = useState(!!user?.is_email_verified);
  const [phoneVerified, setPhoneVerified] = useState(!!user?.is_phone_verified);

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
    onError:   (e: any) => toast.error(e?.response?.data?.detail || "Failed to delete account"),
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

      {/* ── Email Verification ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
            <Mail size={16} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-black text-gray-900">Email Verification</h2>
            <p className="text-xs text-gray-500">Verify your email address via OTP</p>
          </div>
        </div>
        <div className="p-5">
          <OtpVerifyCard
            type="email"
            icon={Mail}
            label="Email"
            contact={user?.email || ""}
            isVerified={emailVerified}
            sendEndpoint="/users/send-email-otp"
            verifyEndpoint="/users/verify-email-otp"
            onVerified={() => {
              setEmailVerified(true);
              updateUser({ ...user!, is_email_verified: true });
            }}
          />
        </div>
      </div>

      {/* ── Phone Verification ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
            <Phone size={16} className="text-purple-600" />
          </div>
          <div>
            <h2 className="font-black text-gray-900">Phone Verification</h2>
            <p className="text-xs text-gray-500">Verify your mobile number via OTP</p>
          </div>
        </div>
        <div className="p-5">
          {user?.phone ? (
            <OtpVerifyCard
              type="phone"
              icon={Phone}
              label="Phone"
              contact={user?.phone || ""}
              isVerified={phoneVerified}
              sendEndpoint="/users/send-phone-otp"
              verifyEndpoint="/users/verify-phone-otp"
              onVerified={() => {
                setPhoneVerified(true);
                updateUser({ ...user!, is_phone_verified: true });
              }}
            />
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">No phone number added to your account.</p>
              <a href="/account"
                className="text-xs text-brand-600 font-semibold hover:underline shrink-0 ml-4">
                Add phone →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Change Password ─────────────────────────────────────────── */}
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

      {/* ── Account info ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-black text-gray-900 mb-4">Account Information</h3>
        <dl className="space-y-0">
          {[
            { label: "Account ID",     value: `#${user?.id}` },
            { label: "Email",          value: user?.email },
            { label: "Email Status",   value: emailVerified ? "✓ Verified" : "⚠ Not Verified" },
            { label: "Phone",          value: user?.phone || "—" },
            { label: "Phone Status",   value: user?.phone ? (phoneVerified ? "✓ Verified" : "⚠ Not Verified") : "—" },
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

      {/* ── Danger zone ──────────────────────────────────────────────── */}
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
