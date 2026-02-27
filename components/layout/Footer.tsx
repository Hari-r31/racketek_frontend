import Link from "next/link";
import { Mail, Phone, Instagram, Facebook, Youtube, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-black text-white mb-3">RACKETEK</h3>
            <p className="text-sm text-gray-400 mb-4">
              India&apos;s premier destination for professional sports equipment.
              Badminton, Cricket, Running and more.
            </p>
            <div className="flex gap-3">
              {[Instagram, Facebook, Youtube, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-600 transition-colors">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Badminton", href: "/products?category=badminton" },
                { label: "Cricket", href: "/products?category=cricket" },
                { label: "Running Gear", href: "/products?category=running" },
                { label: "Accessories", href: "/products?category=accessories" },
                { label: "Sportswear", href: "/products?category=sportswear" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-brand-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-semibold text-white mb-3">Policies</h4>
            <ul className="space-y-2 text-sm">
              {[
                "Return Policy",
                "Shipping Policy",
                "Privacy Policy",
                "Terms of Service",
                "Size Guide",
              ].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-brand-400 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-3">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-brand-400 shrink-0" />
                <span>support@racketek.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-brand-400 shrink-0" />
                <span>+91 98765 43210</span>
              </li>
            </ul>

            {/* Newsletter */}
            <div className="mt-4">
              <p className="text-sm font-medium text-white mb-2">Newsletter</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-white placeholder-gray-500"
                />
                <button className="bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Racketek Outlet. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>🔒 Secure Payments</span>
            <span>📦 Easy Returns</span>
            <span>🚚 Free Shipping ₹999+</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
