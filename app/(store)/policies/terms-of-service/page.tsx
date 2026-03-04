import Link from "next/link";
import { ChevronRight, FileText, ShoppingCart, AlertCircle, Scale, Mail } from "lucide-react";

export const metadata = { title: "Terms of Service – Racketek Outlet" };

const SECTIONS = [
  {
    title: "Acceptance of Terms",
    content: "By accessing or using the Racketek Outlet website (racketek.com), you confirm that you are at least 18 years of age, have read and understood these Terms, and agree to be bound by them. If you do not agree, please do not use our services.",
  },
  {
    title: "Use of Our Platform",
    content: "You may use Racketek Outlet solely for lawful, personal, non-commercial purposes. You agree not to: scrape or copy content without permission; attempt to gain unauthorised access to any part of our system; use automated tools to place orders; or engage in any conduct that disrupts the operation of our platform.",
  },
  {
    title: "Account Registration",
    content: "To place an order, you must create an account with accurate and complete information. You are responsible for maintaining the confidentiality of your login credentials. Notify us immediately at support@racketek.com if you suspect any unauthorised access to your account.",
  },
  {
    title: "Product Listings & Pricing",
    content: "We strive to ensure all product descriptions and prices are accurate. In the event of a pricing error, we reserve the right to cancel the order and issue a full refund. Product availability is subject to change without notice. Images are for illustration purposes; minor variations in colour may exist due to photography or display settings.",
  },
  {
    title: "Orders & Payment",
    content: "An order confirmation email does not constitute acceptance of your order. We reserve the right to refuse or cancel any order at our sole discretion, including for reasons of suspected fraud. Payment must be completed in full before dispatch. We accept UPI, credit/debit cards, net banking, wallets via Razorpay, and Cash on Delivery.",
  },
  {
    title: "Intellectual Property",
    content: "All content on this website — including logos, product images, text, and design — is the property of Racketek Outlet or its licensors and is protected under applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.",
  },
  {
    title: "Disclaimer of Warranties",
    content: "Our website and services are provided \"as is\" without any warranties of any kind, either express or implied. We do not warrant that the site will be error-free, uninterrupted, or free of viruses. To the extent permitted by law, we disclaim all implied warranties including merchantability and fitness for a particular purpose.",
  },
  {
    title: "Limitation of Liability",
    content: "To the maximum extent permitted by applicable law, Racketek Outlet shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our platform, even if we have been advised of the possibility of such damages. Our total liability in any matter shall not exceed the amount paid for the relevant order.",
  },
  {
    title: "Governing Law",
    content: "These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana.",
  },
  {
    title: "Changes to Terms",
    content: "We reserve the right to modify these Terms at any time. Changes become effective upon posting to our website. Continued use of our platform after changes constitutes your acceptance of the updated Terms. We encourage you to review this page periodically.",
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <ChevronRight size={11} />
            <span className="text-gray-800 font-medium">Terms of Service</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <Scale size={12} /> Legal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-400 text-sm">Last updated: January 2025 · Effective for all users of racketek.com</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-10 flex items-start gap-3">
          <AlertCircle size={16} className="text-yellow-600 mt-0.5 shrink-0" />
          <p className="text-sm text-yellow-800 leading-relaxed">
            Please read these Terms carefully before using our website. By accessing or purchasing from Racketek Outlet, you agree to these Terms in full.
          </p>
        </div>

        <div className="space-y-8">
          {SECTIONS.map(({ title, content }, idx) => (
            <section key={title} className="border-b border-gray-100 pb-8 last:border-0">
              <h2 className="text-base font-black text-gray-900 mb-3">
                <span className="text-brand-500 mr-2">{idx + 1}.</span>{title}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h3 className="font-black text-gray-900 mb-2 flex items-center gap-2"><Mail size={15} className="text-brand-600" /> Contact Us</h3>
          <p className="text-sm text-gray-500 mb-3">For questions about these Terms, please email us at:</p>
          <a href="mailto:legal@racketek.com" className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors text-sm">
            legal@racketek.com
          </a>
        </div>
      </div>
    </div>
  );
}
