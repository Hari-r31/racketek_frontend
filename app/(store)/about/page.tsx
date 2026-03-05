import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | RacketOutlet",
  description:
    "RacketOutlet is India's premier sports e-commerce platform offering authentic badminton, cricket, tennis gear and more with PAN India shipping.",
};

const CATEGORIES = [
  "Badminton Rackets", "Badminton Shoes", "Badminton Shuttle", "Badminton Accessories",
  "Cricket Bats", "Cricket Shoes", "Cricket Balls",
  "Tennis Rackets", "Tennis Shoes", "Tennis Balls",
  "Squash Rackets", "Squash Balls",
  "Pickleball Paddles",
  "Boxing Gloves", "Boxing Shoes",
  "Padel Rackets", "Padel Shoes",
  "Running Shoes", "Football", "Swimming", "Nutrition",
];

const TOP_PRODUCTS = [
  "Adidas FS09 Hybrid Shuttlecock",
  "YONEX Astrox 99 Play Racket",
  "YONEX Astrox Lite 27i Racket",
  "Yonex BG 65 Titanium",
  "Babolat Hybrid Challenge Shuttlecock",
  "Apacs Vanguard 11 Racket (Red)",
  "DSC Lava Kashmir Willow Cricket Bat",
  "Fleet Duora 10 Racket",
  "SS Master 100 Kashmir Willow Cricket Bat",
  "DSC Jaffa 22 Cricket Spike Shoes",
  "New Balance DC 580 Wicketkeeping Gloves",
  "Apacs Vanguard 11 Racket (Black)",
  "Dunlop AO Tennis Balls Dozen",
  "Li-Ning D3 Badminton Feather Shuttlecock",
  "Yonex Badminton Grip TECH 501B",
  "YONEX Power Cushion SHB 65 Z3 (Black) Shoes",
  "YONEX Power Cushion SHB 65 Z3 White Tiger Shoes",
];

const CITIES = [
  "Bangalore", "Mumbai", "Delhi", "Chennai", "Hyderabad",
  "Gurugram", "Pune", "Kolkata", "Ahmedabad", "Indore",
  "Jaipur", "Guwahati",
];

const STATS = [
  { value: "10,000+", label: "Happy Athletes" },
  { value: "500+",    label: "Premium Brands" },
  { value: "15,000+", label: "Products" },
  { value: "Pan India", label: "Shipping" },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-brand-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-[200px] leading-none select-none">🏸</div>
          <div className="absolute bottom-10 right-10 text-[150px] leading-none select-none">🎾</div>
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
          <span className="inline-block bg-brand-600/30 border border-brand-500/40 text-brand-300 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
            India's Premier Sports Store
          </span>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
            We Live &amp; Breathe<br />
            <span className="text-brand-400">Sport.</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            RacketOutlet is India's go-to destination for authentic sports gear — from badminton to
            boxing, we deliver quality equipment at competitive prices, straight to your door.
          </p>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="bg-brand-600 text-white">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-3xl md:text-4xl font-black">{s.value}</p>
              <p className="text-sm text-brand-200 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-xs font-black text-brand-600 uppercase tracking-widest">Our Mission</span>
            <h2 className="text-3xl font-black text-gray-900 mt-3 mb-5 leading-tight">
              Empowering Every Sports Enthusiast
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              At RacketOutlet, we empower sports enthusiasts with comprehensive sporting solutions.
              Whether it's top-tier gear, personalized coaching, expert advice, or curated events —
              we cater to every aspect of your sporting journey.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our mission is to provide end-to-end solutions for customers, players, coaches, and
              sports enthusiasts, building a vibrant sporting community across India.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "🏆", title: "Authentic Products",  desc: "Every item undergoes strict authenticity checks before it reaches you." },
              { icon: "🚚", title: "PAN India Shipping",  desc: "Fast, reliable delivery to all major cities and beyond." },
              { icon: "💳", title: "Flexible Payments",   desc: "UPI, cards, EMI, net banking and cash on delivery." },
              { icon: "🔄", title: "Easy Returns",        desc: "Hassle-free returns and exchange policy for peace of mind." },
            ].map(card => (
              <div key={card.title} className="bg-gray-50 rounded-2xl p-5">
                <span className="text-3xl">{card.icon}</span>
                <h3 className="font-black text-gray-900 text-sm mt-3 mb-1">{card.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Authenticity ─────────────────────────────────────────────────── */}
      <section className="bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <span className="text-4xl">✅</span>
          <h2 className="text-2xl font-black text-gray-900 mt-4 mb-4">Authenticity Guaranteed</h2>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Every product on RacketOutlet undergoes strict authenticity checks to ensure you receive
            the exact item ordered — meeting our high standards of quality and reliability. No fakes.
            No compromises.
          </p>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <span className="text-xs font-black text-brand-600 uppercase tracking-widest">What We Carry</span>
          <h2 className="text-3xl font-black text-gray-900 mt-3">Top Categories</h2>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {CATEGORIES.map(cat => (
            <a
              key={cat}
              href={`/products?category=${encodeURIComponent(cat.toLowerCase().replace(/ /g, "-"))}`}
              className="bg-white border border-gray-200 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 text-gray-700 text-sm font-semibold px-4 py-2 rounded-full transition-all"
            >
              {cat}
            </a>
          ))}
        </div>
      </section>

      {/* ── Top Products ─────────────────────────────────────────────────── */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <span className="text-xs font-black text-brand-400 uppercase tracking-widest">Best Sellers</span>
            <h2 className="text-3xl font-black mt-3">Top Products</h2>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {TOP_PRODUCTS.map(p => (
              <span
                key={p}
                className="bg-gray-800 border border-gray-700 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-full"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cities ───────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <span className="text-xs font-black text-brand-600 uppercase tracking-widest">Nationwide Reach</span>
        <h2 className="text-3xl font-black text-gray-900 mt-3 mb-8">We Ship Across India</h2>
        <div className="flex flex-wrap gap-3 justify-center">
          {CITIES.map(city => (
            <span
              key={city}
              className="flex items-center gap-1.5 bg-brand-50 border border-brand-100 text-brand-700 text-sm font-semibold px-4 py-2 rounded-full"
            >
              <span className="text-base">📍</span> {city}
            </span>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-brand-600 to-brand-700 text-white">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-black mb-4">Ready to Play Your Best?</h2>
          <p className="text-brand-100 mb-8 text-lg">
            Browse thousands of authentic products and get them delivered anywhere in India.
          </p>
          <a
            href="/products"
            className="inline-block bg-white text-brand-700 font-black px-8 py-4 rounded-2xl text-sm hover:bg-brand-50 transition-all hover:scale-105 active:scale-100 shadow-lg"
          >
            Shop Now →
          </a>
        </div>
      </section>
    </div>
  );
}
