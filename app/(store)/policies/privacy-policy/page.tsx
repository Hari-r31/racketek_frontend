import Link from "next/link";
import { ChevronRight, ShieldCheck, Lock, Eye, Database, UserCheck, Mail } from "lucide-react";

export const metadata = { title: "Privacy Policy – Racketek Outlet" };

const SECTIONS = [
  {
    icon: Database,
    title: "Information We Collect",
    content: [
      "Account information: name, email address, phone number, and password when you register.",
      "Order information: billing and shipping addresses, products purchased, and payment details (we never store full card numbers).",
      "Usage data: pages visited, search queries, product views, and device/browser type collected via cookies.",
      "Communication data: messages you send to our support team.",
    ],
  },
  {
    icon: Eye,
    title: "How We Use Your Information",
    content: [
      "To process and fulfil your orders, including shipping and delivery updates.",
      "To send order confirmations, invoices, and customer support responses.",
      "To personalise product recommendations and improve our website experience.",
      "To send promotional emails and offers — you can unsubscribe at any time.",
      "To detect and prevent fraud, abuse, or security incidents.",
      "To comply with legal obligations under Indian law.",
    ],
  },
  {
    icon: UserCheck,
    title: "Sharing Your Information",
    content: [
      "We never sell your personal data to third parties.",
      "We share data with payment processors (Razorpay) and logistics partners only to complete your order.",
      "We may share anonymised, aggregated data for analytics purposes.",
      "We may disclose information if required by law or a government authority.",
    ],
  },
  {
    icon: Lock,
    title: "Data Security",
    content: [
      "All data transmitted between your browser and our servers is encrypted using TLS/HTTPS.",
      "Passwords are hashed using bcrypt — we cannot see your plaintext password.",
      "Payment processing is handled by Razorpay, a PCI DSS compliant payment gateway.",
      "We conduct regular security audits and vulnerability assessments.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Your Rights",
    content: [
      "Access: you can request a copy of the personal data we hold about you.",
      "Correction: you can update your profile information at any time in Account Settings.",
      "Deletion: you can request account deletion by contacting support — we will delete your data within 30 days.",
      "Opt-out: you can unsubscribe from marketing emails via the link in any email.",
    ],
  },
  {
    icon: Mail,
    title: "Cookies",
    content: [
      "We use essential cookies to keep you logged in and remember your cart.",
      "We use analytics cookies (e.g. Google Analytics) to understand how visitors use our site.",
      "You can disable cookies in your browser settings, though some features may not work correctly.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <ChevronRight size={11} />
            <span className="text-gray-800 font-medium">Privacy Policy</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <ShieldCheck size={12} /> Privacy &amp; Data
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-400 text-sm">Last updated: January 2025 · Governs all data collected by Racketek Outlet</p>
        </div>

        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-10 text-sm text-brand-800 leading-relaxed">
          Your privacy is important to us. This policy explains what data we collect when you use <strong>racketek.com</strong>, how we use it, and the choices you have. By using our site, you agree to the terms described below.
        </div>

        <div className="space-y-8">
          {SECTIONS.map(({ icon: Icon, title, content }, idx) => (
            <section key={title} className="border-b border-gray-100 pb-8 last:border-0">
              <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-brand-600" />
                </span>
                <span className="text-gray-400 text-sm font-bold mr-1">{idx + 1}.</span> {title}
              </h2>
              <ul className="space-y-2.5">
                {content.map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-10 bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h3 className="font-black text-gray-900 mb-2">Contact Our Privacy Team</h3>
          <p className="text-sm text-gray-500 mb-3">If you have any questions about this policy or want to exercise your rights, please reach out:</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="mailto:privacy@racketek.com" className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors text-sm">
              <Mail size={14} /> privacy@racketek.com
            </a>
            <Link href="/account/support" className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 font-bold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
              Support Centre
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
