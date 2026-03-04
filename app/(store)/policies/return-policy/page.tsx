import Link from "next/link";
import { ChevronRight, RotateCcw, Package, Clock, CheckCircle, AlertCircle } from "lucide-react";

export const metadata = { title: "Return Policy – Racketek Outlet" };

export default function ReturnPolicyPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <ChevronRight size={11} />
            <span className="text-gray-800 font-medium">Return Policy</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <RotateCcw size={12} /> Returns &amp; Refunds
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">Return Policy</h1>
          <p className="text-gray-400 text-sm">Last updated: January 2025</p>
        </div>

        {/* 7-day banner */}
        <div className="bg-brand-600 text-white rounded-2xl p-6 mb-10 flex items-center gap-5">
          <div className="text-5xl font-black shrink-0 leading-none">7</div>
          <div>
            <p className="font-black text-lg">Day Hassle-Free Returns</p>
            <p className="text-brand-200 text-sm mt-1">Not satisfied? Return within 7 days of delivery — no questions asked (conditions apply).</p>
          </div>
        </div>

        {/* Steps */}
        <section className="mb-10">
          <h2 className="text-xl font-black text-gray-900 mb-5">How to Return</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Package,     step: 1, title: "Initiate Return",  desc: "Go to My Orders → select item → click 'Return Item' within 7 days of delivery." },
              { icon: Clock,       step: 2, title: "Schedule Pickup",  desc: "Our logistics partner will arrange a pickup from your address within 48 hours." },
              { icon: RotateCcw,   step: 3, title: "Item Inspected",   desc: "Once received, our team inspects the item within 2 business days." },
              { icon: CheckCircle, step: 4, title: "Refund Credited",  desc: "Refund is sent to your original payment method within 5–7 business days." },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="flex gap-4 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                  <Icon size={16} className="text-brand-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1"><span className="text-brand-500">Step {step}. </span>{title}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Eligible / Not eligible */}
        <div className="grid sm:grid-cols-2 gap-6 mb-10">
          <div className="bg-green-50 border border-green-100 rounded-2xl p-6">
            <h2 className="font-black text-green-800 mb-4 flex items-center gap-2 text-base"><CheckCircle size={15} /> Eligible for Return</h2>
            <ul className="space-y-2">
              {["Damaged or defective item received","Wrong item delivered","Item not as described","Manufacturing defect found within 7 days"].map(i => (
                <li key={i} className="flex items-start gap-2 text-sm text-green-700"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />{i}</li>
              ))}
            </ul>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
            <h2 className="font-black text-red-800 mb-4 flex items-center gap-2 text-base"><AlertCircle size={15} /> Not Eligible</h2>
            <ul className="space-y-2">
              {["Used, washed or altered items","Items without original tags/packaging","Returns after 7 days of delivery","Customised or personalised products","Items from non-returnable sales"].map(i => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-700"><span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />{i}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Refund timeline table */}
        <section className="mb-10">
          <h2 className="text-xl font-black text-gray-900 mb-4">Refund Timeline</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Payment Method","Refund To","Timeline"].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-black text-gray-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["Credit / Debit Card","Original card","5–7 business days"],
                  ["UPI / Net Banking","Original account","3–5 business days"],
                  ["Razorpay Wallet","Wallet balance","1–2 business days"],
                  ["Cash on Delivery","Bank transfer (NEFT)","7–10 business days"],
                ].map(([method, to, time]) => (
                  <tr key={method} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700">{method}</td>
                    <td className="px-5 py-3 text-gray-500">{to}</td>
                    <td className="px-5 py-3 font-semibold text-brand-600">{time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
          <p className="text-gray-700 font-semibold mb-3">Ready to return an item?</p>
          <Link href="/account/orders" className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-brand-700 transition-colors text-sm">
            Go to My Orders
          </Link>
          <p className="text-xs text-gray-400 mt-3">
            Need help?{" "}
            <Link href="/account/support" className="text-brand-600 hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
