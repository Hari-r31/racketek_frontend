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
import { useThemeStore } from "@/store/uiStore";
import ThemeProvider from "@/components/providers/ThemeProvider";
import ThemeToggle from "@/components/ui/ThemeToggle";
import toast from "react-hot-toast";
import { TokenResponse } from "@/types";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router        = useRouter();
  const { setUser }   = useAuthStore();
  const { theme }     = useThemeStore();
  const isDark        = theme === "dark";

  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const afterLogin = (data: TokenResponse) => {
    setUser(data.user, data.access_token, data.refresh_token);
  };

  const handleGoogleOAuth = async () => {
    setOauthLoading(true);
    try {
      const id_token =
        process.env.NEXT_PUBLIC_OAUTH_MOCK === "true" || process.env.NODE_ENV === "development"
          ? "mock_test_token"
          : (() => { throw new Error("Configure NEXT_PUBLIC_GOOGLE_CLIENT_ID"); })();
      const res = await api.post<TokenResponse>("/auth/oauth/google", { id_token });
      afterLogin(res.data);
      toast.success(
        res.data.is_new_user
          ? "Account created via Google! Welcome 🎉"
          : `Welcome back, ${res.data.user.full_name.split(" ")[0]}!`
      );
      router.push("/");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Google sign-up failed");
    } finally {
      setOauthLoading(false);
    }
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

        {/* Theme toggle — top right */}
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

            {/* Google OAuth */}
            <button
              onClick={handleGoogleOAuth}
              disabled={oauthLoading}
              className="w-full flex items-center justify-center gap-3 rounded-xl py-3 px-4 text-sm font-semibold transition-all mb-4 disabled:opacity-60"
              style={{
                border:          isDark ? "2px solid rgba(255,255,255,0.12)" : "2px solid #e5e7eb",
                color:           isDark ? "#e2e8f0" : "#374151",
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.08)" : "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.04)" : "transparent")}
            >
              {oauthLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Continue with Google
            </button>

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

              {/* Full Name */}
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

              {/* Email */}
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

              {/* Phone (optional) */}
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

              {/* Password */}
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

              {/* Confirm Password */}
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
