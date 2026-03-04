import Link from "next/link";
import { ChevronRight, Truck, Clock, MapPin, Package, Zap } from "lucide-react";

export const metadata = { title: "Shipping Policy – Racketek Outlet" };

export default function ShippingPolicyPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <ChevronRight size={11} />
            <span className="text-gray-800 font-medium">Shipping Policy</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <Truck size={12} /> Shipping &amp; Delivery
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">Shipping Policy</h1>
          <p className="text-gray-400 text-sm">Last updated: January 2025</p>
        </div>

        {/* Highlight cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Truck,   title: "Free Shipping",    desc: "On all orders above ₹999 across India." },
            { icon: Clock,   title: "5–7 Business Days", desc: "Standard delivery timeline after dispatch." },
            { icon: Zap,     title: "Express Available", desc: "2–3 day delivery at checkout (charges apply)." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-brand-50 border border-brand-100 rounded-2xl p-5 text-center">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-brand-100">
                <Icon size={18} className="text-brand-600" />
              </div>
              <p className="font-black text-gray-900 text-sm mb-1">{title}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Shipping rates */}
        <section className="mb-10">
          <h2 className="text-xl font-black text-gray-900 mb-4">Shipping Rates</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Order Value","Standard Delivery","Express Delivery"].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-black text-gray-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["Below ₹499","₹79","₹149"],
                  ["₹499 – ₹999","₹49","₹99"],
                  ["Above ₹999","FREE","₹79"],
                ].map(([value, std, exp]) => (
                  <tr key={value} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-700">{value}</td>
                    <td className="px-5 py-3 text-gray-600">{std}</td>
                    <td className="px-5 py-3 font-semibold text-brand-600">{exp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Delivery timeline */}
        <section className="mb-10">
          <h2 className="text-xl font-black text-gray-900 mb-4">Delivery Timeline by Region</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Region","Standard","Express"].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-black text-gray-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["Metro cities (Hyderabad, Mumbai, Delhi, Bengaluru)","3–5 business days","1–2 business days"],
                  ["Tier-2 cities","5–7 business days","2–3 business days"],
                  ["Tier-3 cities & rural areas","7–10 business days","3–5 business days"],
                  ["Remote / hilly regions","10–14 business days","Not available"],
                ].map(([region, std, exp]) => (
                  <tr key={region} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700">{region}</td>
                    <td className="px-5 py-3 text-gray-600">{std}</td>
                    <td className="px-5 py-3 text-gray-600">{exp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-5 text-sm text-gray-600 leading-relaxed">
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h3 className="font-black text-gray-900 mb-2 flex items-center gap-2"><Package size={15} className="text-brand-600" /> Order Processing</h3>
            <p>Orders placed before 2:00 PM IST on weekdays are typically dispatched the same day. Orders placed on weekends or public holidays are dispatched the next business day. You'll receive a shipping confirmation email with a tracking link once your order is dispatched.</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h3 className="font-black text-gray-900 mb-2 flex items-center gap-2"><MapPin size={15} className="text-brand-600" /> Serviceable Areas</h3>
            <p>We ship to all 28 states and 8 union territories across India. Some remote pin codes may have limited delivery options. You can check serviceability at checkout by entering your pin code.</p>
          </div>
          <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-100">
            <h3 className="font-black text-yellow-800 mb-2">Important Notes</h3>
            <ul className="space-y-1.5">
              {[
                "Delivery timelines are estimates and may vary due to weather, strikes, or carrier delays.",
                "For COD orders, please ensure someone is available at the address during the estimated delivery window.",
                "Racketek is not responsible for delays caused by incorrect or incomplete shipping addresses.",
                "Bulk orders (10+ items) may have extended processing times — contact support in advance.",
              ].map(note => (
                <li key={note} className="flex items-start gap-2 text-yellow-800"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />{note}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 bg-brand-50 border border-brand-100 rounded-2xl p-6 text-center">
          <p className="font-semibold text-gray-800 mb-3">Track your existing order</p>
          <Link href="/track-order" className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-brand-700 transition-colors text-sm">
            <Truck size={15} /> Track Order
          </Link>
        </div>
      </div>
    </div>
  );
}
