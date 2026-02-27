import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Racketek Outlet - Premium Sports Equipment",
    template: "%s | Racketek Outlet",
  },
  description:
    "Shop premium badminton, cricket, running gear, and sports accessories. Free shipping above ₹999.",
  keywords: ["badminton", "cricket", "sports", "running", "equipment", "India"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { fontSize: "14px" },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
