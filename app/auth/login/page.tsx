"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogIn, Zap } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/uiStore";
import toast from "react-hot-toast";
import { TokenResponse } from "@/types";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { setCount } = useCartStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const afterLogin = async (data: TokenResponse) => {
    setUser(data.user, data.access_token, data.refresh_token);
    toast.success(`Welcome back, ${data.user.full_name.split(" ")[0]}! 🎉`);
    try {
      const cartRes = await api.get("/cart");
      const active = cartRes.data.items?.filter((i: any) => !i.save_for_later).length || 0;
      setCount(active);
    } catch {}
    const isAdmin = ["admin", "super_admin"].includes(data.user.role);
    router.push(isAdmin ? "/admin" : "/");
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.post<TokenResponse>("/auth/login", data);
      await afterLogin(res.data);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOAuth = async () => {
    setOauthLoading(true);
    try {
      // In production: use Google Identity Services to get id_token
      // For dev: uses mock token (requires DEBUG=true in backend .env)
      const id_token = await getGoogleIdToken();
      const res = await api.post<TokenResponse>("/auth/oauth/google", { id_token });
      await afterLogin(res.data);
      if (res.data.is_new_user) toast.success("Account created via Google! Welcome 🎉");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Google login failed");
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-brand-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Sporty background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
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
          <p className="text-gray-400 mt-3 text-sm">Sign in to your account</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          <h1 className="text-2xl font-black text-gray-900 mb-6">Welcome back 👋</h1>

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleOAuth}
            disabled={oauthLoading}
            className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl py-3 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all mb-4 disabled:opacity-60"
          >
            {oauthLoading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input type="email" {...register("email")} placeholder="you@example.com" className="input" autoFocus />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Min 6 characters"
                  className="input pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><LogIn size={18} /> Sign In</>
              )}
            </button>
          </form>

          {/* Default credentials hint */}
          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-700 font-semibold mb-1">🔑 Demo Credentials</p>
            <p className="text-xs text-blue-600">Admin: <span className="font-mono">admin@racketek.com / Admin@123</span></p>
            <p className="text-xs text-blue-600">Staff: <span className="font-mono">staff@racketek.com / Staff@123</span></p>
          </div>

          <p className="text-center text-sm text-gray-600 mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-brand-600 font-semibold hover:underline">Sign up free</Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          <Link href="/" className="hover:text-gray-300 transition-colors">← Back to Store</Link>
        </p>
      </div>
    </div>
  );
}

// ── Google ID Token helper ────────────────────────────────────────────────────
async function getGoogleIdToken(): Promise<string> {
  // Production: integrate Google Identity Services
  // The real flow:
  //   1. Load https://accounts.google.com/gsi/client
  //   2. Call google.accounts.id.initialize({ client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID, callback })
  //   3. callback receives { credential: id_token }
  //   4. Send that id_token to /auth/oauth/google
  //
  // For dev with DEBUG=true backend: return mock token
  if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_OAUTH_MOCK === "true") {
    return "mock_test_token";
  }
  // Production: show Google popup (requires @react-oauth/google package)
  throw new Error("Configure NEXT_PUBLIC_GOOGLE_CLIENT_ID and install @react-oauth/google");
}
