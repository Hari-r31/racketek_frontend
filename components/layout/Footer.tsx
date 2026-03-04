import Link from "next/link";
import { Instagram, Youtube, Facebook, Twitter, Mail, Phone, MapPin } from "lucide-react";

const SPORT_LINKS = [
  { label: "Badminton",  href: "/products?category=badminton"  },
  { label: "Cricket",    href: "/products?category=cricket"    },
  { label: "Running",    href: "/products?category=running"    },
  { label: "Football",   href: "/products?category=football"   },
  { label: "Tennis",     href: "/products?category=tennis"     },
  { label: "Fitness",    href: "/products?category=fitness"    },
  { label: "Sportswear", href: "/products?category=sportswear" },
];

const ACCOUNT_LINKS = [
  { label: "My Account",   href: "/account"           },
  { label: "My Orders",    href: "/account/orders"    },
  { label: "Track Order",  href: "/track-order"       },
  { label: "Wishlist",     href: "/account/wishlist"  },
  { label: "Returns",      href: "/account/returns"   },
  { label: "Support",      href: "/account/support"   },
];

const POLICY_LINKS = [
  { label: "Return Policy",    href: "/policies/return-policy"    },
  { label: "Shipping Policy",  href: "/policies/shipping-policy"  },
  { label: "Privacy Policy",   href: "/policies/privacy-policy"   },
  { label: "Terms of Service", href: "/policies/terms-of-service" },
  { label: "Size Guide",       href: "/policies/size-guide"       },
];

const SOCIAL = [
  { Icon: Instagram, href: "https://instagram.com",  label: "Instagram", hover: "hover:text-pink-400"  },
  { Icon: Youtube,   href: "https://youtube.com",    label: "YouTube",   hover: "hover:text-red-500"   },
  { Icon: Facebook,  href: "https://facebook.com",   label: "Facebook",  hover: "hover:text-blue-400"  },
  { Icon: Twitter,   href: "https://twitter.com",    label: "Twitter",   hover: "hover:text-sky-400"   },
];

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-10">

          {/* ── Brand column ─────────────────────────────────────── */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-black text-white tracking-tight">RACKETEK</span>
              <span className="text-brand-500 text-xs ml-1.5 font-bold tracking-widest">OUTLET</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-5 max-w-xs">
              India&apos;s premier destination for 100% authentic professional sports equipment.
              Based in Hyderabad, delivering pan-India.
            </p>
            {/* Social */}
            <div className="flex gap-3 mb-6">
              {SOCIAL.map(({ Icon, href, label, hover }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className={`w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center text-gray-500 ${hover} hover:bg-gray-700 transition-all`}>
                  <Icon size={15} />
                </a>
              ))}
            </div>
            {/* Contact */}
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2.5">
                <Mail size={13} className="text-brand-500 shrink-0" />
                <a href="mailto:support@racketek.com" className="text-gray-500 hover:text-brand-400 transition-colors">
                  support@racketek.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={13} className="text-brand-500 shrink-0" />
                <a href="tel:+919491147433" className="text-gray-500 hover:text-brand-400 transition-colors">
                  +91 94911 47433
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={13} className="text-brand-500 shrink-0 mt-0.5" />
                <span className="text-gray-500">Hyderabad, Telangana, India</span>
              </li>
            </ul>
          </div>

          {/* ── Sports ───────────────────────────────────────────── */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">Sports</h4>
            <ul className="space-y-2.5">
              {SPORT_LINKS.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-brand-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Account ──────────────────────────────────────────── */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">Account</h4>
            <ul className="space-y-2.5">
              {ACCOUNT_LINKS.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-brand-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Policies ─────────────────────────────────────────── */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">Policies</h4>
            <ul className="space-y-2.5">
              {POLICY_LINKS.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-brand-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Newsletter */}
            <h4 className="text-xs font-black text-white uppercase tracking-widest mt-7 mb-3">Newsletter</h4>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
              <button className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shrink-0">
                Go
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ───────────────────────────────────────────── */}
        <div className="border-t border-gray-800 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} Racketek Outlet. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="flex items-center gap-1">🔒 Secure Payments</span>
            <span className="flex items-center gap-1">📦 Easy 7-Day Returns</span>
            <span className="flex items-center gap-1">🚚 Free Shipping ₹999+</span>
            <span className="flex items-center gap-1">✅ 100% Genuine</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
