import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-brand-600" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}