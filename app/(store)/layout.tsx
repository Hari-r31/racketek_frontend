import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AIChatWidget from "@/components/ai/AIChatWidget";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* AI Assistant - floats on all store pages */}
      <AIChatWidget />
    </div>
  );
}
