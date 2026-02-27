import Link from "next/link";
import { ReactNode } from "react";
import { Package, Heart, MapPin, User, Headphones, RotateCcw } from "lucide-react";

const NAV = [
  { href: "/account", label: "Dashboard", icon: User },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/support", label: "Support", icon: Headphones },
  { href: "/account/returns", label: "Returns", icon: RotateCcw },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="card p-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="lg:col-span-3">{children}</main>
      </div>
    </div>
  );
}
