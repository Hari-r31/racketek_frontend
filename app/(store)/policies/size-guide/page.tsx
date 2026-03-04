import Link from "next/link";
import { ChevronRight, Ruler } from "lucide-react";

export const metadata = { title: "Size Guide – Racketek Outlet" };

const TABLES: {
  category: string;
  headers: string[];
  rows: string[][];
}[] = [
  {
    category: "Badminton / Tennis Racket Grip Size",
    headers: ["Grip Size", "Circumference", "Best For"],
    rows: [
      ["G1 (XS)","< 80 mm","Junior players / small hands"],
      ["G2 (S)","80–83 mm","Women & younger players"],
      ["G3 (M)","83–86 mm","Most recreational players"],
      ["G4 (L)","86–89 mm","Men with larger hands"],
      ["G5 (XL)","> 89 mm","Advanced / big grip players"],
    ],
  },
  {
    category: "Sportswear – Tops & T-Shirts",
    headers: ["Size","Chest (cm)","Shoulder (cm)","Length (cm)"],
    rows: [
      ["XS","82–86","39–41","66"],
      ["S","88–92","41–43","68"],
      ["M","94–98","43–45","70"],
      ["L","100–104","45–47","72"],
      ["XL","106–110","47–49","74"],
      ["2XL","112–116","49–51","76"],
      ["3XL","118–122","51–53","78"],
    ],
  },
  {
    category: "Sportswear – Shorts & Pants",
    headers: ["Size","Waist (cm)","Hip (cm)","Inseam (cm)"],
    rows: [
      ["XS","64–68","86–90","28"],
      ["S","70–74","92–96","29"],
      ["M","76–80","98–102","30"],
      ["L","82–86","104–108","31"],
      ["XL","88–92","110–114","32"],
      ["2XL","94–98","116–120","33"],
      ["3XL","100–104","122–126","34"],
    ],
  },
  {
    category: "Sports Shoes",
    headers: ["India Size","UK","EU","US Men","Foot Length (cm)"],
    rows: [
      ["6","5","38","6","24.0"],
      ["7","6","39","7","24.7"],
      ["8","7","41","8","25.5"],
      ["9","8","42","9","26.2"],
      ["10","9","43","10","27.0"],
      ["11","10","44","11","27.7"],
      ["12","11","46","12","28.5"],
    ],
  },
  {
    category: "Sports Socks",
    headers: ["Size","Shoe Size (India)","Foot Length (cm)"],
    rows: [
      ["S","4–6","22–24"],
      ["M","7–9","25–27"],
      ["L","10–12","28–30"],
      ["XL","13+","31+"],
    ],
  },
];

export default function SizeGuidePage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <ChevronRight size={11} />
            <span className="text-gray-800 font-medium">Size Guide</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <Ruler size={12} /> Sizing
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">Size Guide</h1>
          <p className="text-gray-500 text-sm">Use these charts to find the perfect fit. All measurements are in centimetres unless stated.</p>
        </div>

        {/* How to measure */}
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-6 mb-10">
          <h2 className="font-black text-brand-800 mb-3 flex items-center gap-2"><Ruler size={15} /> How to Measure</h2>
          <ul className="space-y-2 text-sm text-brand-700">
            {[
              "Chest: Measure around the fullest part of your chest, keeping the tape horizontal.",
              "Waist: Measure around your natural waistline (just above the hip bone).",
              "Hip: Measure around the fullest part of your hips.",
              "Foot length: Stand on a flat surface and measure from the heel to the tip of the longest toe.",
              "Grip: Measure the circumference of your dominant hand at the base of the fingers.",
            ].map(tip => (
              <li key={tip} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />{tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-10">
          {TABLES.map(({ category, headers, rows }) => (
            <section key={category}>
              <h2 className="text-lg font-black text-gray-900 mb-4">{category}</h2>
              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {headers.map(h => (
                        <th key={h} className="text-left px-4 py-3 font-black text-gray-700 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {row.map((cell, j) => (
                          <td key={j} className={`px-4 py-3 whitespace-nowrap ${j === 0 ? "font-bold text-gray-900" : "text-gray-600"}`}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
          <p className="text-gray-700 font-semibold mb-1">Still not sure about sizing?</p>
          <p className="text-gray-500 text-sm mb-4">Our support team is happy to help you pick the right size.</p>
          <Link href="/account/support" className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-brand-700 transition-colors text-sm">
            Ask Support
          </Link>
        </div>
      </div>
    </div>
  );
}
