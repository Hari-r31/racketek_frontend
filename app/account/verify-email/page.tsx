"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { updateUser, isAuthenticated } = useAuthStore();
  const [status, setStatus]   = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("error"); setMessage("No verification token found in the URL."); return; }
    if (!isAuthenticated) { router.push(`/auth/login?next=/account/verify-email?token=${token}`); return; }
    api.post(`/users/verify-email?token=${token}`)
      .then((r) => {
        setStatus("success");
        setMessage(r.data.message || "Email verified successfully!");
        updateUser({ is_email_verified: true });
      })
      .catch((e) => {
        setStatus("error");
        setMessage(e?.response?.data?.detail || "Verification failed. The link may have expired.");
      });
  }, []);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 size={40} className="animate-spin text-brand-600 mx-auto mb-4" />
            <h2 className="text-xl font-black text-gray-900">Verifying your email…</h2>
            <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-black text-gray-900">Email Verified!</h2>
            <p className="text-gray-500 text-sm mt-2">{message}</p>
            <Link href="/account"
              className="inline-flex items-center gap-2 mt-6 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all">
              Go to My Account
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900">Verification Failed</h2>
            <p className="text-gray-500 text-sm mt-2">{message}</p>
            <Link href="/account"
              className="inline-flex items-center gap-2 mt-6 border border-brand-200 text-brand-600 font-bold px-6 py-2.5 rounded-xl hover:bg-brand-50 transition-colors">
              Back to Account
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
