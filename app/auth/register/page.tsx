"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, UserPlus, Zap } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/context/AuthContext";
import { useThemeStore } from "@/store/uiStore";
import ThemeProvider from "@/components/providers/ThemeProvider";
import ThemeToggle from "@/components/ui/ThemeToggle";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import toast from "react-hot-toast";
import { TokenResponse } from "@/types";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email:     z.string().email("Enter a valid email"),
  phone:     z.string().optional(),
  password:  z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router       = useRouter();
  const { setUser }  = useAuthStore();
  const { syncUser } = useAuth();
  const { theme }    = useThemeStore();
  const isDark       = theme === "dark";

  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const afterLogin = (data: TokenResponse) => {
    setUser(data.user, data.access_token);
    syncUser(data.user);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { confirm_password, ...payload } = data;
      const res = await api.post<TokenResponse>("/auth/register", payload);
      afterLogin(res.data);
      toast.success("Account created! Welcome to Racketek 🎉");
      router.push("/");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

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
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
          {isDark && (
            <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
          )}
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
            <Link href="/" className="inline-flex items-center gap-2 justify-center">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
                <Zap size={20} className="text-white" />
              </div>
              <div className="text-left">
                <span className="text-2xl font-black text-white tracking-tight block leading-none">RACKETEK</span>
                <span className="text-brand-400 text-xs font-semibold tracking-widest">OUTLET</span>
              </div>
            </Link>
            <p className="text-white/50 mt-3 text-sm">Create your free account</p>
          </div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="rounded-2xl shadow-2xl p-8 border transition-colors duration-300"
            style={{
              backgroundColor: isDark ? "rgba(15,15,25,0.95)" : "rgba(255,255,255,0.97)",
              borderColor:     isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.3)",
              backdropFilter:  "blur(12px)",
            }}
          >
            <h1
              className="text-2xl font-black mb-6 transition-colors"
              style={{ color: isDark ? "#f1f5f9" : "#111827" }}
            >
              Join Racketek 🏆
            </h1>

            {/* ── Google Sign-In (official GSI button) ───────────────────── */}
            <GoogleLoginButton
              className="mb-4"
              onSuccess={(data) => {
                afterLogin(data);
                router.push("/");
              }}
              onError={(err) => {
                console.error("[GoogleLoginButton] error:", err.message);
              }}
            />

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb" }} />
              <span className="text-xs font-medium" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>
                or register with email
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb" }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label
                  className="text-xs font-bold uppercase tracking-wider block mb-1"
                  style={{ color: isDark ? "#94a3b8" : "#4b5563" }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  {...register("full_name")}
                  placeholder="Arjun Sharma"
                  autoFocus
                  className="input"
                />
                {errors.full_name && <p className="text-xs text-red-400 mt-1">{errors.full_name.message}</p>}
              </div>

              <div>
                <label
                  className="text-xs font-bold uppercase tracking-wider block mb-1"
                  style={{ color: isDark ? "#94a3b8" : "#4b5563" }}
                >
                  Email address
                </label>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="you@example.com"
                  className="input"
                />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label
                  className="text-xs font-bold uppercase tracking-wider block mb-1"
                  style={{ color: isDark ? "#94a3b8" : "#4b5563" }}
                >
                  Phone{" "}
                  <span style={{ color: isDark ? "#475569" : "#9ca3af", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                    (optional)
                  </span>
                </label>
                <input
                  type="tel"
                  {...register("phone")}
                  placeholder="+91 98765 43210"
                  className="input"
                />
              </div>

              <div>
                <label
                  className="text-xs font-bold uppercase tracking-wider block mb-1"
                  style={{ color: isDark ? "#94a3b8" : "#4b5563" }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="Min 6 characters"
                    className="input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: isDark ? "#64748b" : "#9ca3af" }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label
                  className="text-xs font-bold uppercase tracking-wider block mb-1"
                  style={{ color: isDark ? "#94a3b8" : "#4b5563" }}
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  {...register("confirm_password")}
                  placeholder="Repeat password"
                  className="input"
                />
                {errors.confirm_password && (
                  <p className="text-xs text-red-400 mt-1">{errors.confirm_password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><UserPlus size={18} /> Create Account</>
                )}
              </button>
            </form>

            <p
              className="text-center text-sm mt-5"
              style={{ color: isDark ? "#64748b" : "#6b7280" }}
            >
              Already have an account?{" "}
              <Link href="/auth/login" className="text-brand-500 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>

          <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.35)" }}>
            <Link href="/" className="hover:text-white/60 transition-colors">← Back to Store</Link>
          </p>
        </div>
      </div>
    </ThemeProvider>
  );
}
