import { Suspense } from "react";
import VerifyEmailPage from "./page";
import { Loader2 } from "lucide-react";

export default function VerifyEmailLayout() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    }>
      <VerifyEmailPage />
    </Suspense>
  );
}
