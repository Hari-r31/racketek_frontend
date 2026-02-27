"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, UserPlus, Zap } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
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
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
      const id_token = process.env.NEXT_PUBLIC_OAUTH_MOCK === "true" || process.env.NODE_ENV === "development"
        ? "mock_test_token"
        : (() => { throw new Error("Configure NEXT_PUBLIC_GOOGLE_CLIENT_ID"); })();
      const res = await api.post<TokenResponse>("/auth/oauth/google", { id_token });
      afterLogin(res.data);
      toast.success(res.data.is_new_user ? "Account created via Google! Welcome 🎉" : `Welcome back, ${res.data.user.full_name.split(" ")[0]}!`);
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
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(22,101,255,0.15),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_70%,rgba(249,115,22,0.1),transparent_60%)]" />

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
          <p className="text-gray-400 mt-3 text-sm">Create your free account</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          <h1 className="text-2xl font-black text-gray-900 mb-6">Join Racketek 🏆</h1>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleOAuth}
            disabled={oauthLoading}
            className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl py-3 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all mb-4 disabled:opacity-60"
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

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or register with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input type="text" {...register("full_name")} placeholder="Arjun Sharma" className="input" autoFocus />
              {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="label">Email address</label>
              <input type="email" {...register("email")} placeholder="you@example.com" className="input" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="tel" {...register("phone")} placeholder="+91 98765 43210" className="input" />
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
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" {...register("confirm_password")} placeholder="Repeat password" className="input" />
              {errors.confirm_password && <p className="text-xs text-red-500 mt-1">{errors.confirm_password.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><UserPlus size={18} /> Create Account</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-5">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          <Link href="/" className="hover:text-gray-300 transition-colors">← Back to Store</Link>
        </p>
      </div>
    </div>
  );
}
