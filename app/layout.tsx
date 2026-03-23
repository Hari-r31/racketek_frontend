import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "react-hot-toast";
import { Suspense } from "react";
import NavigationLoader from "@/components/layout/NavigationLoader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Racketek Outlet — Premium Sports Equipment",
    template: "%s | Racketek Outlet",
  },
  description:
    "Shop authentic badminton, cricket, tennis, running gear & sports accessories. Free shipping above ₹999. India's biggest sports store.",
  keywords: ["badminton", "cricket", "sports", "running", "equipment", "India", "racketek"],
  icons: {
    icon: [
      { url: "/logo.jpg", type: "image/jpeg" },
    ],
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },
  openGraph: {
    title:       "Racketek Outlet — Premium Sports Equipment",
    description: "India's biggest online sports store. Authentic gear, best prices, fast delivery.",
    type:        "website",
    locale:      "en_IN",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[rgb(var(--surface-1))] font-sans antialiased">
        <Providers>
          {/*
            NavigationLoader: fires IMMEDIATELY on link click.
            Must be in Suspense because it uses useSearchParams internally.
          */}
          <Suspense fallback={null}>
            <NavigationLoader />
          </Suspense>

          {children}

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { fontSize: "14px", borderRadius: "12px" },
              success: { iconTheme: { primary: "#16a34a", secondary: "#fff" } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
