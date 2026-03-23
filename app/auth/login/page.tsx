"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogIn, Zap } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/context/AuthContext";
import { useCartStore, useThemeStore } from "@/store/uiStore";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ThemeProvider from "@/components/providers/ThemeProvider";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import toast from "react-hot-toast";
import { TokenResponse } from "@/types";

const schema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router          = useRouter();
  const { setUser }     = useAuthStore();
  const { syncUser }    = useAuth();
  const { setCount }    = useCartStore();
  const { theme }       = useThemeStore();
  const isDark          = theme === "dark";

  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);

  const searchParams = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : null;
  const nextUrl = searchParams?.get("next") || "/";

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const afterLogin = async (data: TokenResponse) => {
    setUser(data.user, data.access_token);
    syncUser(data.user, data.access_token);
    try {
      const cartRes = await api.get("/cart");
      const active = cartRes.data.items?.filter((i: any) => !i.save_for_later).length || 0;
      setCount(active);
    } catch {}
    const isAdmin = ["admin", "super_admin"].includes(data.user.role);
    router.push(isAdmin ? "/admin" : (nextUrl !== "/" ? nextUrl : "/"));
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.post<TokenResponse>("/auth/login", data);
      toast.success(`Welcome back, ${res.data.user.full_name.split(" ")[0]}! 🎉`);
      await afterLogin(res.data);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Invalid credentials");
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
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
                <Zap size={20} className="text-white" />
              </div>
              <div className="text-left">
                <span className="text-2xl font-black text-white tracking-tight block leading-none">RACKETEK</span>
                <span className="text-brand-400 text-xs font-semibold tracking-widest">OUTLET</span>
              </div>
            </Link>
            <p className="text-white/50 mt-3 text-sm">Sign in to your account</p>
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
              Welcome back 👋
            </h1>

            {/* ── Google Sign-In (official GSI button) ───────────────────── */}
            <GoogleLoginButton
              className="mb-4"
              onSuccess={(data) => {
                afterLogin(data);
              }}
              onError={(err) => {
                // Errors already toasted inside GoogleLoginButton;
                // log here for debugging if needed.
                console.error("[GoogleLoginButton] error:", err.message);
              }}
            />

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb" }} />
              <span className="text-xs font-medium" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>
                or sign in with email
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb" }} />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  autoFocus
                  className="input"
                />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: isDark ? "#94a3b8" : "#4b5563" }}
                  >
                    Password
                  </label>
                  <Link href="/auth/forgot-password"
                    className="text-xs font-semibold text-brand-500 hover:underline">
                    Forgot password?
                  </Link>
                </div>
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

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><LogIn size={18} /> Sign In</>
                }
              </button>
            </form>

            <p
              className="text-center text-sm mt-4"
              style={{ color: isDark ? "#64748b" : "#6b7280" }}
            >
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-brand-500 font-semibold hover:underline">
                Sign up free
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
