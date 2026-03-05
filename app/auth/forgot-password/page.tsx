"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Zap, Mail, Phone, ArrowLeft, ShieldCheck, Loader2, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { useThemeStore } from "@/store/uiStore";
import ThemeProvider from "@/components/providers/ThemeProvider";
import ThemeToggle from "@/components/ui/ThemeToggle";
import toast from "react-hot-toast";

type Step = "contact" | "otp" | "reset" | "done";
type Method = "email" | "phone";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

/* ── tiny OTP input ────────────────────────────────────────────────────── */
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handleChange = (i: number, ch: string) => {
    const digit = ch.replace(/\D/, "").slice(-1);
    const arr   = value.split("").concat(Array(OTP_LENGTH).fill("")).slice(0, OTP_LENGTH);
    arr[i]      = digit;
    const next  = arr.join("");
    onChange(next);
    if (digit && i < OTP_LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pasted) { onChange(pasted.padEnd(OTP_LENGTH, "")); inputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          className="w-12 h-14 text-center text-xl font-black rounded-xl border-2 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all bg-gray-50 text-gray-900 dark:bg-[rgb(28,28,42)] dark:text-gray-100 dark:focus:ring-brand-900"
          style={{ borderColor: value[i] ? "#16a34a" : undefined }}
        />
      ))}
    </div>
  );
}

/* ── Resend countdown ──────────────────────────────────────────────────── */
function ResendTimer({ onResend, loading }: { onResend: () => void; loading: boolean }) {
  const [secs, setSecs] = useState(RESEND_SECONDS);

  useEffect(() => {
    setSecs(RESEND_SECONDS);
    const t = setInterval(() => setSecs(s => { if (s <= 1) { clearInterval(t); return 0; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, []);

  if (secs > 0) return (
    <p className="text-sm text-gray-500 text-center">
      Resend OTP in <span className="font-bold text-brand-600">{secs}s</span>
    </p>
  );

  return (
    <button onClick={onResend} disabled={loading}
      className="flex items-center gap-1.5 text-sm text-brand-600 font-semibold hover:underline mx-auto disabled:opacity-50">
      <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
      Resend OTP
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const [step,        setStep]        = useState<Step>("contact");
  const [method,      setMethod]      = useState<Method>("email");
  const [contact,     setContact]     = useState("");
  const [otp,         setOtp]         = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [resendKey,   setResendKey]   = useState(0); // bump to reset ResendTimer

  const cardBg    = isDark ? "rgba(15,15,25,0.95)"  : "rgba(255,255,255,0.97)";
  const cardBorder= isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.3)";
  const labelCl   = isDark ? "#94a3b8" : "#4b5563";
  const inputSt   = {
    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f9fafb",
    border:          isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e5e7eb",
    color:           isDark ? "#f1f5f9" : "#111827",
  };

  /* ── Step 1: send OTP ─────────────────────────────────────────────── */
  const sendOtp = async () => {
    if (!contact.trim()) { toast.error("Enter your email or phone number"); return; }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password/send-otp", {
        [method]: method === "email" ? contact.trim() : contact.trim().replace(/\D/g, ""),
      });
      toast.success(`OTP sent to your ${method}!`);
      setOtp("");
      setStep("otp");
      setResendKey(k => k + 1);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Could not send OTP. Check your details.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: verify OTP ───────────────────────────────────────────── */
  const verifyOtp = async () => {
    if (otp.replace(/\s/g, "").length < OTP_LENGTH) { toast.error("Enter the full 6-digit OTP"); return; }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password/verify-otp", {
        [method]: method === "email" ? contact.trim() : contact.trim().replace(/\D/g, ""),
        otp: otp.trim(),
      });
      toast.success("OTP verified! Set your new password.");
      setStep("reset");
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 3: reset password ───────────────────────────────────────── */
  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPw) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password/reset", {
        [method]: method === "email" ? contact.trim() : contact.trim().replace(/\D/g, ""),
        otp:          otp.trim(),
        new_password: newPassword,
      });
      setStep("done");
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to reset password. Please start over.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Password strength ────────────────────────────────────────────── */
  const strength = (() => {
    const p = newPassword;
    if (!p) return { score: 0, label: "", color: "" };
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return { score: s, ...([
      { label: "Weak",   color: "bg-red-500"    },
      { label: "Fair",   color: "bg-orange-400"  },
      { label: "Good",   color: "bg-yellow-500"  },
      { label: "Strong", color: "bg-green-500"   },
    ][Math.min(s - 1, 3)] ?? { label: "", color: "" }) };
  })();

  return (
    <ThemeProvider>
      <div
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300"
        style={{
          background: isDark
            ? "linear-gradient(135deg, #0a0a14 0%, #0d1117 50%, #0f1a0f 100%)"
            : "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #052e16 100%)",
        }}
      >
        {/* Blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
        </div>

        {/* Theme toggle */}
        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5">
            <span className="text-xs text-white/60 font-medium">{isDark ? "Dark" : "Light"}</span>
            <ThemeToggle />
          </div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
                <Zap size={20} className="text-white" />
              </div>
              <div className="text-left">
                <span className="text-2xl font-black text-white tracking-tight block leading-none">RACKETEK</span>
                <span className="text-brand-400 text-xs font-semibold tracking-widest">OUTLET</span>
              </div>
            </Link>
            <p className="text-white/50 mt-3 text-sm">Reset your password</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl shadow-2xl p-8 border"
              style={{ backgroundColor: cardBg, borderColor: cardBorder, backdropFilter: "blur(12px)" }}
            >

              {/* ── Step: contact ────────────────────────────────────── */}
              {step === "contact" && (
                <>
                  <h1 className="text-2xl font-black mb-1" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>
                    Forgot Password? 🔑
                  </h1>
                  <p className="text-sm mb-6" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>
                    We'll send a 6-digit OTP to verify your identity.
                  </p>

                  {/* Method toggle */}
                  <div className="flex rounded-xl overflow-hidden border mb-6" style={{ borderColor: isDark ? "rgba(255,255,255,0.12)" : "#e5e7eb" }}>
                    {(["email", "phone"] as Method[]).map(m => (
                      <button
                        key={m}
                        onClick={() => { setMethod(m); setContact(""); }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all"
                        style={{
                          backgroundColor: method === m ? "#16a34a" : "transparent",
                          color: method === m ? "#fff" : isDark ? "#94a3b8" : "#6b7280",
                        }}
                      >
                        {m === "email" ? <Mail size={14} /> : <Phone size={14} />}
                        {m === "email" ? "Email" : "Phone"}
                      </button>
                    ))}
                  </div>

                  <div className="mb-5">
                    <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: labelCl }}>
                      {method === "email" ? "Email Address" : "Mobile Number"}
                    </label>
                    <input
                      type={method === "email" ? "email" : "tel"}
                      value={contact}
                      onChange={e => setContact(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendOtp()}
                      placeholder={method === "email" ? "you@example.com" : "+91 XXXXX XXXXX"}
                      autoFocus
                      className="input"
                    />
                  </div>

                  <button onClick={sendOtp} disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
                    {loading
                      ? <Loader2 size={18} className="animate-spin" />
                      : <>{method === "email" ? <Mail size={18} /> : <Phone size={18} />} Send OTP</>}
                  </button>

                  <p className="text-center text-sm mt-4" style={{ color: isDark ? "#64748b" : "#6b7280" }}>
                    Remember your password?{" "}
                    <Link href="/auth/login" className="text-brand-500 font-semibold hover:underline">Sign in</Link>
                  </p>
                </>
              )}

              {/* ── Step: OTP ────────────────────────────────────────── */}
              {step === "otp" && (
                <>
                  <button onClick={() => setStep("contact")}
                    className="flex items-center gap-1.5 text-sm mb-5 hover:text-brand-600 transition-colors"
                    style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>
                    <ArrowLeft size={14} /> Back
                  </button>
                  <h1 className="text-2xl font-black mb-1" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>
                    Enter OTP 🔢
                  </h1>
                  <p className="text-sm mb-6" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold text-brand-500">{contact}</span>
                  </p>

                  <div className="mb-6">
                    <OtpInput value={otp} onChange={setOtp} />
                  </div>

                  <button onClick={verifyOtp} disabled={loading || otp.replace(/\s/g,"").length < OTP_LENGTH}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base mb-4 disabled:opacity-50">
                    {loading
                      ? <Loader2 size={18} className="animate-spin" />
                      : <><ShieldCheck size={18} /> Verify OTP</>}
                  </button>

                  <ResendTimer key={resendKey} onResend={sendOtp} loading={loading} />
                </>
              )}

              {/* ── Step: reset ──────────────────────────────────────── */}
              {step === "reset" && (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <ShieldCheck size={18} className="text-green-600" />
                    </div>
                    <div>
                      <h1 className="text-xl font-black" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>
                        Set New Password
                      </h1>
                      <p className="text-xs" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>
                        Identity verified ✓
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-5">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: labelCl }}>
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPw ? "text" : "password"}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          autoFocus
                          className="input pr-10"
                        />
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          style={{ color: isDark ? "#64748b" : "#9ca3af" }}>
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {newPassword && (
                        <div className="mt-2">
                          <div className="flex gap-1 mb-1">
                            {[1,2,3,4].map(i => (
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
                      <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: labelCl }}>
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          value={confirmPw}
                          onChange={e => setConfirmPw(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && resetPassword()}
                          placeholder="Repeat new password"
                          className={`input pr-10 ${confirmPw && newPassword !== confirmPw ? "border-red-400 focus:ring-red-300" : ""}`}
                        />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          style={{ color: isDark ? "#64748b" : "#9ca3af" }}>
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {confirmPw && newPassword !== confirmPw && (
                        <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                      )}
                    </div>
                  </div>

                  <button onClick={resetPassword} disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
                    {loading
                      ? <Loader2 size={18} className="animate-spin" />
                      : <><ShieldCheck size={18} /> Reset Password</>}
                  </button>
                </>
              )}

              {/* ── Step: done ───────────────────────────────────────── */}
              {step === "done" && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck size={32} className="text-green-600" />
                  </div>
                  <h1 className="text-2xl font-black mb-2" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>
                    Password Reset! 🎉
                  </h1>
                  <p className="text-sm mb-6" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>
                    Your password has been updated successfully. You can now sign in with your new password.
                  </p>
                  <button onClick={() => router.push("/auth/login")}
                    className="btn-primary w-full py-3 text-base">
                    Go to Sign In
                  </button>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.35)" }}>
            <Link href="/" className="hover:text-white/60 transition-colors">← Back to Store</Link>
          </p>
        </div>
      </div>
    </ThemeProvider>
  );
}
