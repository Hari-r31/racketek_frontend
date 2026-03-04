"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
  Save, Eye, EyeOff, Plus, Trash2, ExternalLink,
  Check, Code2, AlertTriangle, ChevronRight, ArrowLeft, ArrowRight,
  Megaphone, Image as ImageIcon, Zap, Play, Star, Trophy, Package, Clock,
  Shirt, MessageSquare, Grid3X3, Award, Info as InfoIcon, LayoutTemplate,
  Monitor, Database, Layers,
} from "lucide-react";
import CloudinaryUploader         from "@/components/admin/CloudinaryUploader";
import ProductAutocomplete      from "@/components/admin/ProductAutocomplete";
import ProductMultiAutocomplete from "@/components/admin/ProductMultiAutocomplete";

// ── Homepage component imports for live preview ────────────────────────────
import AnnouncementBar  from "@/components/home/AnnouncementBar";
import HeroBanners      from "@/components/home/HeroBanners";
import QuickCategories  from "@/components/home/QuickCategories";
import MovementSection  from "@/components/home/MovementSection";
import HomepageVideos   from "@/components/home/HomepageVideos";
import CraftedForChampions from "@/components/home/CraftedForChampions";
import DealOfDay        from "@/components/home/DealOfDay";
import Testimonial      from "@/components/home/Testimonial";
import BrandSpotlight   from "@/components/home/BrandSpotlight";
import AboutRacketOutlet from "@/components/home/AboutRacketOutlet";
import FeaturedProduct  from "@/components/home/FeaturedProduct";
import BundleBuilder    from "@/components/home/BundleBuilder";
import ShopTheLook      from "@/components/home/ShopTheLook";
import FeaturedCollections from "@/components/home/FeaturedCollections";

// ─── Section registry ─────────────────────────────────────────────────────────
const SECTION_ICON: Record<string, React.ElementType> = {
  announcement_bar:     Megaphone,
  hero_banners:         ImageIcon,
  quick_categories:     Zap,
  movement_section:     LayoutTemplate,
  homepage_videos:      Play,
  featured_product:     Star,
  crafted_section:      Trophy,
  bundle_builder:       Package,
  deal_of_day:          Clock,
  shop_the_look:        Shirt,
  testimonials:         MessageSquare,
  featured_collections: Grid3X3,
  brand_spotlight:      Award,
  about_section:        InfoIcon,
};

const SECTIONS = [
  { key: "announcement_bar",     label: "Announcement Bar",     group: "Header",    critical: true,  desc: "Scrolling promo ticker at top of every page" },
  { key: "hero_banners",         label: "Hero Banners",          group: "Header",    critical: true,  desc: "Full-width hero slideshow with CTAs" },
  { key: "quick_categories",     label: "Quick Categories",      group: "Header",    critical: true,  desc: "Sport icon grid shown directly below the hero" },
  { key: "movement_section",     label: "Movement",              group: "Content",   critical: false, desc: "Brand mission statement with paragraph and CTA" },
  { key: "homepage_videos",      label: "Videos",                group: "Content",   critical: false, desc: "Autoplay video sections with overlay text" },
  { key: "featured_product",     label: "Featured Product",      group: "Commerce",  critical: true,  desc: "Single product spotlight with live backend data" },
  { key: "crafted_section",      label: "Crafted for Champions", group: "Content",   critical: false, desc: "Full-bleed image slideshow with headline" },
  { key: "bundle_builder",       label: "Bundle Builder",        group: "Commerce",  critical: true,  desc: "Multi-product bundle picker with discount unlock" },
  { key: "deal_of_day",          label: "Deal of the Day",       group: "Commerce",  critical: true,  desc: "Countdown timer with featured deal products" },
  { key: "shop_the_look",        label: "Shop the Look",         group: "Commerce",  critical: true,  desc: "Player image with interactive product hotspots" },
  { key: "testimonials",         label: "Testimonials",          group: "Social",    critical: false, desc: "Auto-scrolling customer review carousel" },
  { key: "featured_collections", label: "Featured Collections",  group: "Commerce",  critical: true,  desc: "Tabbed product grid — up to 6 tabs" },
  { key: "brand_spotlight",      label: "Brand Spotlight",       group: "Social",    critical: false, desc: "Brand banner cards (Yonex, Apacs, etc.)" },
  { key: "about_section",        label: "About",                 group: "Footer",    critical: false, desc: "Stats, trust badges, social links" },
] as const;

type SK = typeof SECTIONS[number]["key"];
const GROUPS = ["Header", "Commerce", "Content", "Social", "Footer"] as const;

// ─── Design System Primitives ─────────────────────────────────────────────────
const F = ({ label, sub, children, required }: { label: string; sub?: string; children: React.ReactNode; required?: boolean }) => (
  <div>
    <div className="mb-1.5">
      <span className="text-sm font-semibold text-gray-800">
        {label}{required && <span className="text-red-500 ml-0.5 font-bold">*</span>}
      </span>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
    {children}
  </div>
);

const inp = "w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 transition-all";

const TI = ({ value, onChange, placeholder, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) =>
  <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`${inp}${mono ? " font-mono text-xs" : ""}`} />;

const TAI = ({ value, onChange, rows = 4 }: { value: string; onChange: (v: string) => void; rows?: number }) =>
  <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className={`${inp} resize-none leading-relaxed`} />;

const NI = ({ value, onChange, placeholder }: { value: any; onChange: (v: any) => void; placeholder?: string }) =>
  <input type="number" value={value ?? ""} onChange={e => onChange(parseInt(e.target.value) || null)} placeholder={placeholder} className={inp} />;

const SL = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) =>
  <select value={value} onChange={e => onChange(e.target.value)} className={inp}>
    {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
  </select>;

const ColorF = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <div className="flex gap-2 items-center">
    <label className="relative cursor-pointer">
      <input type="color" value={value || "#000000"} onChange={e => onChange(e.target.value)} className="sr-only" />
      <div className="w-9 h-9 rounded-lg border-2 border-gray-200 shadow-sm hover:border-gray-300 transition-colors" style={{ backgroundColor: value || "#000000" }} />
    </label>
    <TI value={value} onChange={onChange} placeholder={placeholder} mono />
  </div>
);

function Note({ children, type = "info" }: { children: React.ReactNode; type?: "info" | "warn" }) {
  const s = type === "info" ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-amber-50 border-amber-100 text-amber-700";
  return (
    <div className={`flex gap-2.5 px-4 py-3 rounded-xl border text-xs leading-relaxed ${s}`}>
      <InfoIcon size={13} className="shrink-0 mt-0.5 opacity-70" /><span>{children}</span>
    </div>
  );
}

function SH({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 -mx-6 px-6 py-3 mb-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function CardWrap({ title, onRemove, children }: { title: string; onRemove: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
        <span className="flex-1 text-sm font-semibold text-gray-700">{title}</span>
        <button onClick={onRemove} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-red-50">
          <Trash2 size={12} /> Remove
        </button>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  );
}

function AddItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-400 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/40 transition-all flex items-center justify-center gap-2">
      <Plus size={15} strokeWidth={2.5} /> {label}
    </button>
  );
}

function JsonEditor({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [err, setErr] = useState("");
  const handle = (s: string) => { setText(s); try { onChange(JSON.parse(s)); setErr(""); } catch { setErr("Invalid JSON"); } };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
        <Code2 size={12} className="text-gray-400" /><span>Raw JSON — changes apply on valid parse</span>
      </div>
      <textarea rows={20} value={text} onChange={e => handle(e.target.value)} spellCheck={false}
        className="w-full font-mono text-xs bg-[#1a1a2e] text-[#a8dadc] caret-white rounded-xl p-5 border border-gray-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y leading-6 tracking-wide" />
      {err && <div className="flex gap-2 items-center text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg"><AlertTriangle size={12} /> {err}</div>}
    </div>
  );
}

// ─── Live Preview Component ────────────────────────────────────────────────────
const PREVIEW_W = 1280;
const PREVIEW_SCALE = 0.36;

function LivePreview({ sk, content }: { sk: string; content: any }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [containerH, setContainerH] = useState(200);

  useEffect(() => {
    if (!innerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (innerRef.current) {
        const h = innerRef.current.scrollHeight;
        setContainerH(Math.max(80, Math.ceil(h * PREVIEW_SCALE)));
      }
    });
    ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, [sk, content]);

  const renderComponent = () => {
    try {
      switch (sk) {
        case "announcement_bar":     return <AnnouncementBar data={content} />;
        case "hero_banners":         return <HeroBanners data={content} />;
        case "quick_categories":     return <QuickCategories data={content} categories={[]} />;
        case "movement_section":     return <MovementSection data={content} />;
        case "homepage_videos":      return <HomepageVideos data={content} />;
        case "featured_product":     return <FeaturedProduct data={content} />;
        case "crafted_section":      return <CraftedForChampions data={content} />;
        case "bundle_builder":       return <BundleBuilder data={content} />;
        case "deal_of_day":          return <DealOfDay data={content} />;
        case "shop_the_look":        return <ShopTheLook data={content} />;
        case "testimonials":         return <Testimonial data={content} />;
        case "featured_collections": return <FeaturedCollections data={content} />;
        case "brand_spotlight":      return <BrandSpotlight data={content} />;
        case "about_section":        return <AboutRacketOutlet data={content} />;
        default: return <div className="p-8 text-center text-gray-400 text-sm">No preview available</div>;
      }
    } catch {
      return <div className="p-8 text-center text-gray-400 text-sm">Preview error — save and check homepage</div>;
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white" style={{ height: containerH }}>
      <div
        ref={innerRef}
        style={{
          width: `${PREVIEW_W}px`,
          transform: `scale(${PREVIEW_SCALE})`,
          transformOrigin: "top left",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {renderComponent()}
      </div>
    </div>
  );
}

// ─── Smart Seed ───────────────────────────────────────────────────────────────
async function buildSeedDefaults(cats: any[], prods: any[]) {
  const prodIds = prods.slice(0, 8).map((p: any) => p.id);
  const catLinks = cats.slice(0, 7).map((c: any) => ({
    id: c.id,
    label: c.name,
    subtitle: `${c.name} gear & accessories`,
    image_url: c.image_url || "",
    link: `/products?category=${c.slug}`,
    color_accent: "#22c55e",
  }));

  return {
    announcement_bar: {
      bg_color: "#111111", text_color: "#ffffff", speed: 40,
      messages: [
        { text: "⚡ 2M+ Deliveries across India", link: "" },
        { text: "🚚 Free shipping above ₹1000", link: "/shipping" },
        { text: "✅ 100% Authentic Products Guaranteed", link: "" },
        { text: "🏆 India's Biggest Sports E-Commerce Store", link: "/about" },
        { text: "⚡ Same-day dispatch on orders before 2 PM", link: "" },
      ],
    },
    hero_banners: {
      auto_play: true, interval: 5000,
      banners: cats.slice(0, 4).map((c: any, i: number) => ({
        id: Date.now() + i,
        title: `${c.name} — Play to Win`,
        subtitle: `Premium ${c.name.toLowerCase()} gear — authentic products, fast delivery.`,
        image_url: c.banner_image || c.image_url || "",
        mobile_image_url: "",
        cta: `Shop ${c.name}`,
        cta_link: `/products?category=${c.slug}`,
        badge: `🏅 ${c.name}`,
        gradient: ["from-orange-950 via-gray-950 to-black", "from-emerald-950 via-gray-950 to-black", "from-blue-950 via-gray-950 to-black", "from-purple-950 via-gray-950 to-black"][i % 4],
        text_position: "left",
      })),
    },
    quick_categories: { heading: "Shop by Sport", categories: catLinks },
    movement_section: {
      heading: "More Than Just", heading_italic: "Gear", heading_suffix: ", It's a", heading_italic_2: "Movement",
      paragraph: "At Racketek Outlet, we believe every athlete deserves access to professional-grade equipment. From local courts to national stadiums, we're the gear partner for those who refuse to settle.",
      cta_text: "Our Story", cta_link: "/about",
    },
    homepage_videos: {
      videos: cats.slice(0, 1).map((c: any, i: number) => ({
        id: Date.now() + i,
        video_url: "", poster_url: c.image_url || "",
        title: `${c.name} — Feel the Power`,
        subtitle: `Premium ${c.name.toLowerCase()} equipment for every level`,
        cta: `Shop ${c.name}`,
        cta_link: `/products?category=${c.slug}`,
      })),
    },
    featured_product: {
      product_id: prodIds[0] || null,
      tag: "Featured Pick",
      badge: "Speed · Comfort · Precision",
      placeholder: {
        title: prods[0]?.name || "Premium Racket",
        description: prods[0]?.short_description || "Professional-grade equipment for serious athletes.",
        price: prods[0]?.price || 2999,
        images: prods[0]?.images?.map((i: any) => i.url) || [],
      },
    },
    crafted_section: {
      headline: "Crafted for", headline_italic: "Champions",
      subtext: "Every product handpicked for performance, durability, and style. Used by athletes across India.",
      slides: cats.slice(0, 3).map((c: any, i: number) => ({
        id: Date.now() + i,
        image_url: c.image_url || "",
        label: c.name,
      })),
    },
    bundle_builder: {
      heading: "Build your", heading_italic: "Bundle",
      subtext: "Select any combination from our range. Mix and match to gear up completely.",
      product_ids: prodIds.slice(0, 6),
      min_items: 2,
      discount_label: "Save Extra",
      trust_badges: ["Fast Shipping", "100% Authentic Products", "Best Prices Guaranteed"],
    },
    deal_of_day: {
      heading: "Exclusive Deals on Your Favourite Sport",
      cta: "Shop Now", cta_link: "/products",
      bg_color: "#0f172a",
      ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19),
      image_url: "", product_ids: prodIds.slice(0, 3),
    },
    shop_the_look: {
      heading: "Player's Choice", subheading: "Shop the", subheading_italic: "look",
      player_image: "",
      products: prods.slice(0, 3).map((p: any, i: number) => ({
        id: p.id, label: p.name?.split(" ")[0] || `Product ${i + 1}`,
        hotspot_x: [35, 55, 45][i] ?? 50, hotspot_y: [30, 55, 75][i] ?? 50,
        side: i % 2 === 0 ? "right" : "left",
        product_id: p.id,
      })),
    },
    testimonials: {
      heading: "What Athletes Say",
      testimonials: [
        { id: 1, quote: "Best sports gear I've ever purchased. The quality is outstanding and delivery was lightning fast!", author: "Arjun Sharma", role: "State-level Badminton Player", rating: 5, avatar: "" },
        { id: 2, quote: "Stocked our entire cricket academy with gear from here. Excellent quality at competitive prices!", author: "Priya Nair", role: "Cricket Academy Coach", rating: 5, avatar: "" },
        { id: 3, quote: "Found the exact racket my coach recommended at a great price. Fast shipping, genuine product.", author: "Rahul Verma", role: "Club Tennis Player", rating: 5, avatar: "" },
        { id: 4, quote: "The running shoes are perfect for marathons. Amazing support — a total game changer!", author: "Meera Reddy", role: "Marathon Runner", rating: 5, avatar: "" },
      ],
    },
    featured_collections: {
      heading: "Featured Collections",
      tabs: cats.slice(0, 5).map((c: any, i: number) => ({
        id: c.slug, label: c.name,
        product_ids: prodIds.slice(i, i + 6),
      })),
    },
    brand_spotlight: {
      heading: "Top Brands",
      banners: [
        { id: 1, brand_name: "Yonex",  image_url: "", link: "/products?brand=Yonex",  label: "Yonex Gear"  },
        { id: 2, brand_name: "Apacs",  image_url: "", link: "/products?brand=Apacs",  label: "Apacs Gear"  },
        { id: 3, brand_name: "Victor", image_url: "", link: "/products?brand=Victor", label: "Victor Gear" },
        { id: 4, brand_name: "DSC",    image_url: "", link: "/products?brand=DSC",    label: "DSC Gear"    },
      ],
    },
    about_section: {
      tagline: "India's Biggest Sports E-Commerce Store",
      description: "We bring you the finest sporting goods from top brands, delivered fast across India. Every product is 100% authentic and carefully curated for athletes at every level.",
      stats: [
        { value: "2M+",  label: "Deliveries"    },
        { value: "500+", label: "Products"       },
        { value: "50+",  label: "Brands"         },
        { value: "4.8★", label: "Avg Rating"     },
      ],
      top_categories: cats.slice(0, 5).map((c: any) => c.name),
      top_cities: ["Hyderabad", "Mumbai", "Delhi", "Bengaluru", "Chennai"],
      social_links: { instagram: "https://instagram.com/racketekoutlet", facebook: "", youtube: "" },
    },
  };
}

// ─── Section Editors ──────────────────────────────────────────────────────────
function AnnouncementEditor({ c, u }: any) {
  const msgs: any[] = c?.messages || [];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-5">
        <F label="Background" sub="Hex colour"><ColorF value={c?.bg_color || "#111111"} onChange={v => u({ ...c, bg_color: v })} placeholder="#111111" /></F>
        <F label="Text Colour" sub="Hex colour"><ColorF value={c?.text_color || "#ffffff"} onChange={v => u({ ...c, text_color: v })} placeholder="#ffffff" /></F>
        <F label="Scroll Speed" sub="1 slow → 100 fast"><NI value={c?.speed || 40} onChange={v => u({ ...c, speed: v })} /></F>
      </div>
      <div className="space-y-3">
        <SH label="Ticker messages" />
        {msgs.map((m: any, i: number) => (
          <CardWrap key={i} title={m.text || `Message ${i + 1}`} onRemove={() => u({ ...c, messages: msgs.filter((_: any, j: number) => j !== i) })}>
            <div className="grid grid-cols-2 gap-5">
              <F label="Message text" required><TI value={m.text || ""} onChange={v => u({ ...c, messages: msgs.map((x: any, j: number) => j === i ? { ...x, text: v } : x) })} placeholder="⚡ Free shipping on orders ₹1,000+" /></F>
              <F label="Destination URL" sub="Optional"><TI value={m.link || ""} onChange={v => u({ ...c, messages: msgs.map((x: any, j: number) => j === i ? { ...x, link: v } : x) })} placeholder="/shipping-policy" /></F>
            </div>
          </CardWrap>
        ))}
        <AddItem label="Add message" onClick={() => u({ ...c, messages: [...msgs, { text: "", link: "" }] })} />
      </div>
    </div>
  );
}

function HeroEditor({ c, u }: any) {
  const banners: any[] = c?.banners || [];
  const updB = (i: number, k: string, v: any) => u({ ...c, banners: banners.map((b: any, j: number) => j === i ? { ...b, [k]: v } : b) });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-5">
        <F label="Auto-advance slides">
          <SL value={c?.auto_play !== false ? "true" : "false"} onChange={v => u({ ...c, auto_play: v === "true" })}
            options={[{ v: "true", l: "Enabled" }, { v: "false", l: "Disabled" }]} />
        </F>
        <F label="Slide interval" sub="Milliseconds (5000 = 5 s)"><NI value={c?.interval || 5000} onChange={v => u({ ...c, interval: v })} /></F>
      </div>
      <SH label="Slides" />
      {banners.map((b: any, i: number) => (
        <CardWrap key={b.id || i} title={b.title || `Slide ${i + 1}`} onRemove={() => u({ ...c, banners: banners.filter((_: any, j: number) => j !== i) })}>
          <div className="grid grid-cols-2 gap-5">
            <F label="Headline" required><TI value={b.title || ""} onChange={v => updB(i, "title", v)} placeholder="Play Like a Champion" /></F>
            <F label="Eyebrow badge"><TI value={b.badge || ""} onChange={v => updB(i, "badge", v)} placeholder="New Arrivals" /></F>
            <div className="col-span-2"><F label="Subheading"><TAI value={b.subtitle || ""} onChange={v => updB(i, "subtitle", v)} rows={2} /></F></div>
            <F label="Button label"><TI value={b.cta || ""} onChange={v => updB(i, "cta", v)} placeholder="Shop Now" /></F>
            <F label="Button destination"><TI value={b.cta_link || ""} onChange={v => updB(i, "cta_link", v)} placeholder="/products?category=badminton" /></F>
            <F label="Text alignment">
              <SL value={b.text_position || "left"} onChange={v => updB(i, "text_position", v)} options={[{ v: "left", l: "Left" }, { v: "center", l: "Center" }, { v: "right", l: "Right" }]} />
            </F>
            <F label="CSS gradient" sub="Tailwind from/to classes"><TI value={b.gradient || ""} onChange={v => updB(i, "gradient", v)} placeholder="from-green-950/80 to-black/40" mono /></F>
          </div>
          <CloudinaryUploader label="Desktop image" value={b.image_url} onChange={v => updB(i, "image_url", v)} aspect="banner" hint="Recommended: 1440 × 600 px" />
          <CloudinaryUploader label="Mobile image" value={b.mobile_image_url} onChange={v => updB(i, "mobile_image_url", v)} aspect="portrait" hint="Optional — 600 × 800 px" />
        </CardWrap>
      ))}
      <AddItem label="Add slide" onClick={() => u({ ...c, banners: [...banners, { id: Date.now(), title: "", subtitle: "", image_url: "", mobile_image_url: "", cta: "Shop Now", cta_link: "/products", badge: "", gradient: "from-gray-950/80 to-black/40", text_position: "left" }] })} />
    </div>
  );
}

function QuickCatEditor({ c, u }: any) {
  const cats: any[] = c?.categories || [];
  const updC = (i: number, k: string, v: string) => u({ ...c, categories: cats.map((x: any, j: number) => j === i ? { ...x, [k]: v } : x) });
  return (
    <div className="space-y-6">
      <F label="Section heading"><TI value={c?.heading || ""} onChange={v => u({ ...c, heading: v })} placeholder="Shop by Sport" /></F>
      <Note>Leave empty to auto-load live database categories.</Note>
      <SH label="Category cards" />
      {cats.map((cat: any, i: number) => (
        <CardWrap key={i} title={cat.label || `Category ${i + 1}`} onRemove={() => u({ ...c, categories: cats.filter((_: any, j: number) => j !== i) })}>
          <div className="grid grid-cols-2 gap-5">
            <F label="Sport name" required><TI value={cat.label || ""} onChange={v => updC(i, "label", v)} placeholder="Badminton" /></F>
            <F label="Subtitle"><TI value={cat.subtitle || ""} onChange={v => updC(i, "subtitle", v)} placeholder="Rackets, Shoes & more" /></F>
            <F label="Link destination"><TI value={cat.link || ""} onChange={v => updC(i, "link", v)} placeholder="/products?category=badminton" /></F>
            <F label="Accent colour"><ColorF value={cat.color_accent || "#22c55e"} onChange={v => updC(i, "color_accent", v)} placeholder="#22c55e" /></F>
          </div>
          <CloudinaryUploader label="Card image" value={cat.image_url} onChange={v => updC(i, "image_url", v)} aspect="square" hint="400 × 400 px" />
        </CardWrap>
      ))}
      <AddItem label="Add category" onClick={() => u({ ...c, categories: [...cats, { id: Date.now(), label: "", subtitle: "", image_url: "", link: "/products", color_accent: "#22c55e" }] })} />
    </div>
  );
}

function MovementEditor({ c, u }: any) {
  return (
    <div className="space-y-6">
      <SH label="Headline" />
      <div className="grid grid-cols-2 gap-5">
        <F label="Opening text"><TI value={c?.heading || ""} onChange={v => u({ ...c, heading: v })} placeholder="More Than Just" /></F>
        <F label="Italic word"><TI value={c?.heading_italic || ""} onChange={v => u({ ...c, heading_italic: v })} placeholder="Gear" /></F>
        <F label="Connecting text"><TI value={c?.heading_suffix || ""} onChange={v => u({ ...c, heading_suffix: v })} placeholder=", It's a" /></F>
        <F label="Second italic word"><TI value={c?.heading_italic_2 || ""} onChange={v => u({ ...c, heading_italic_2: v })} placeholder="Movement" /></F>
      </div>
      {(c?.heading || c?.heading_italic) && (
        <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Headline preview</span>
          {c?.heading} <span className="text-brand-600 font-bold italic">{c?.heading_italic}</span>{c?.heading_suffix} <span className="text-brand-600 font-bold italic">{c?.heading_italic_2}</span>
        </div>
      )}
      <SH label="Body content" />
      <F label="Paragraph"><TAI value={c?.paragraph || ""} onChange={v => u({ ...c, paragraph: v })} rows={5} /></F>
      <SH label="Call to action" />
      <div className="grid grid-cols-2 gap-5">
        <F label="Button label"><TI value={c?.cta_text || ""} onChange={v => u({ ...c, cta_text: v })} placeholder="Our Story" /></F>
        <F label="Destination"><TI value={c?.cta_link || ""} onChange={v => u({ ...c, cta_link: v })} placeholder="/about" /></F>
      </div>
    </div>
  );
}

function VideosEditor({ c, u }: any) {
  const vids: any[] = c?.videos || [];
  const updV = (i: number, k: string, v: string) => u({ ...c, videos: vids.map((x: any, j: number) => j === i ? { ...x, [k]: v } : x) });
  return (
    <div className="space-y-6">
      <Note>Only the first video is shown on the homepage. Upload MP4 for best performance.</Note>
      {vids.map((v: any, i: number) => (
        <CardWrap key={i} title={v.title || `Video ${i + 1}`} onRemove={() => u({ ...c, videos: vids.filter((_: any, j: number) => j !== i) })}>
          <div className="grid grid-cols-2 gap-5">
            <F label="Section title"><TI value={v.title || ""} onChange={val => updV(i, "title", val)} placeholder="Badminton — Feel the Power" /></F>
            <F label="Subtitle"><TI value={v.subtitle || ""} onChange={val => updV(i, "subtitle", val)} placeholder="Premium rackets" /></F>
            <F label="CTA label"><TI value={v.cta || ""} onChange={val => updV(i, "cta", val)} placeholder="Shop Badminton" /></F>
            <F label="CTA destination"><TI value={v.cta_link || ""} onChange={val => updV(i, "cta_link", val)} placeholder="/products?category=badminton" /></F>
            <div className="col-span-2"><F label="Video URL" sub="Direct MP4 link"><TI value={v.video_url || ""} onChange={val => updV(i, "video_url", val)} placeholder="https://res.cloudinary.com/…/video.mp4" mono /></F></div>
          </div>
          <CloudinaryUploader label="Poster image" value={v.poster_url} onChange={val => updV(i, "poster_url", val)} aspect="wide" hint="1920 × 1080 px" />
        </CardWrap>
      ))}
      <AddItem label="Add video" onClick={() => u({ ...c, videos: [...vids, { id: Date.now(), video_url: "", poster_url: "", title: "", subtitle: "", cta: "Shop Now", cta_link: "/products" }] })} />
    </div>
  );
}

function FeaturedProdEditor({ c, u }: any) {
  return (
    <div className="space-y-6">
      <Note>Select a product and the system automatically loads live data from your catalogue.</Note>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-3">
          <F label="Featured product" required>
            <ProductAutocomplete
              value={c?.product_id ?? null}
              onChange={v => u({ ...c, product_id: v })}
              placeholder="Search by name, SKU or category…"
              required
            />
          </F>
        </div>
        <F label="Section tag"><TI value={c?.tag || ""} onChange={v => u({ ...c, tag: v })} placeholder="Featured Pick" /></F>
        <F label="Badge text"><TI value={c?.badge || ""} onChange={v => u({ ...c, badge: v })} placeholder="Speed · Comfort" /></F>
      </div>
      <SH label="Fallback placeholder" />
      <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-5">
        <p className="text-xs text-gray-400">Displayed when no Product ID is set.</p>
        <div className="grid grid-cols-2 gap-5">
          <F label="Title"><TI value={c?.placeholder?.title || ""} onChange={v => u({ ...c, placeholder: { ...c?.placeholder, title: v } })} /></F>
          <F label="Price (₹)"><NI value={c?.placeholder?.price || ""} onChange={v => u({ ...c, placeholder: { ...c?.placeholder, price: v } })} /></F>
          <div className="col-span-2"><F label="Description"><TAI value={c?.placeholder?.description || ""} onChange={v => u({ ...c, placeholder: { ...c?.placeholder, description: v } })} rows={3} /></F></div>
        </div>
      </div>
    </div>
  );
}

function CraftedEditor({ c, u }: any) {
  const slides: any[] = c?.slides || [];
  const updS = (i: number, k: string, v: string) => u({ ...c, slides: slides.map((x: any, j: number) => j === i ? { ...x, [k]: v } : x) });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-5">
        <F label="Headline"><TI value={c?.headline || ""} onChange={v => u({ ...c, headline: v })} placeholder="Crafted for" /></F>
        <F label="Italic word"><TI value={c?.headline_italic || ""} onChange={v => u({ ...c, headline_italic: v })} placeholder="Champions" /></F>
        <div className="col-span-2"><F label="Subheading"><TAI value={c?.subtext || ""} onChange={v => u({ ...c, subtext: v })} rows={2} /></F></div>
      </div>
      <SH label="Slides" />
      {slides.map((s: any, i: number) => (
        <CardWrap key={i} title={s.label || `Slide ${i + 1}`} onRemove={() => u({ ...c, slides: slides.filter((_: any, j: number) => j !== i) })}>
          <F label="Badge label"><TI value={s.label || ""} onChange={v => updS(i, "label", v)} placeholder="Performance" /></F>
          <CloudinaryUploader label="Slide image" value={s.image_url} onChange={v => updS(i, "image_url", v)} aspect="banner" hint="1440 × 600 px" />
        </CardWrap>
      ))}
      <AddItem label="Add slide" onClick={() => u({ ...c, slides: [...slides, { id: Date.now(), image_url: "", label: "" }] })} />
    </div>
  );
}

function BundleEditor({ c, u }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-5">
        <F label="Headline"><TI value={c?.heading || ""} onChange={v => u({ ...c, heading: v })} placeholder="Build your" /></F>
        <F label="Italic word"><TI value={c?.heading_italic || ""} onChange={v => u({ ...c, heading_italic: v })} placeholder="Bundle" /></F>
        <F label="Min items for discount"><NI value={c?.min_items || 2} onChange={v => u({ ...c, min_items: v })} /></F>
        <F label="Discount badge label"><TI value={c?.discount_label || ""} onChange={v => u({ ...c, discount_label: v })} placeholder="Save Extra" /></F>
        <div className="col-span-2"><F label="Subheading"><TAI value={c?.subtext || ""} onChange={v => u({ ...c, subtext: v })} rows={2} /></F></div>
      </div>
      <SH label="Products &amp; badges" />
      <F label="Products" sub="Search and add up to 12 products for the bundle picker">
        <ProductMultiAutocomplete
          value={c?.product_ids || []}
          onChange={v => u({ ...c, product_ids: v })}
          max={12}
          placeholder="Search by name, SKU or category…"
        />
      </F>
      <F label="Trust badges" sub="Short phrases shown below the picker">
        <input type="text" value={(c?.trust_badges || []).join(", ")} onChange={e => u({ ...c, trust_badges: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} className={inp} placeholder="Fast Shipping, Authentic Products, Best Prices" />
      </F>
    </div>
  );
}

function DealEditor({ c, u }: any) {
  return (
    <div className="space-y-6">
      <Note type="warn">Countdown uses ISO 8601: <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-[11px]">2026-12-31T23:59:59</code></Note>
      <div className="grid grid-cols-2 gap-5">
        <F label="Section heading"><TI value={c?.heading || ""} onChange={v => u({ ...c, heading: v })} placeholder="Exclusive Deals" /></F>
        <F label="CTA label"><TI value={c?.cta || ""} onChange={v => u({ ...c, cta: v })} placeholder="Shop Now" /></F>
        <F label="CTA destination"><TI value={c?.cta_link || ""} onChange={v => u({ ...c, cta_link: v })} placeholder="/collections/deal-of-the-day" /></F>
        <F label="Background colour"><ColorF value={c?.bg_color || "#0f172a"} onChange={v => u({ ...c, bg_color: v })} placeholder="#0f172a" /></F>
        <div className="col-span-2"><F label="Deal ends at"><TI value={c?.ends_at || ""} onChange={v => u({ ...c, ends_at: v })} placeholder="2026-12-31T23:59:59" mono /></F></div>
      </div>
      <CloudinaryUploader label="Banner background image" value={c?.image_url} onChange={v => u({ ...c, image_url: v })} aspect="banner" hint="1440 × 300 px" />
      <F label="Featured deal products" sub="Up to 3 products shown in the countdown section">
        <ProductMultiAutocomplete
          value={c?.product_ids || []}
          onChange={v => u({ ...c, product_ids: v })}
          max={3}
          placeholder="Search by name, SKU or category…"
          compact
        />
      </F>
    </div>
  );
}

function ShopLookEditor({ c, u }: any) {
  const prods: any[] = c?.products || [];
  const updP = (i: number, k: string, v: any) => u({ ...c, products: prods.map((x: any, j: number) => j === i ? { ...x, [k]: v } : x) });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-5">
        <F label="Heading"><TI value={c?.heading || ""} onChange={v => u({ ...c, heading: v })} placeholder="Player's Choice" /></F>
        <F label="Subheading"><TI value={c?.subheading || ""} onChange={v => u({ ...c, subheading: v })} placeholder="Shop the" /></F>
        <F label="Italic word"><TI value={c?.subheading_italic || ""} onChange={v => u({ ...c, subheading_italic: v })} placeholder="look" /></F>
      </div>
      <CloudinaryUploader label="Athlete photo" value={c?.player_image} onChange={v => u({ ...c, player_image: v })} aspect="portrait" hint="Portrait — 600 × 800 px" />
      <SH label="Hotspot products" />
      <Note>Set X% and Y% to position each dot on the photo. 0,0 = top-left · 100,100 = bottom-right.</Note>
      {prods.map((p: any, i: number) => (
        <CardWrap key={i} title={p.label || `Hotspot ${i + 1}`} onRemove={() => u({ ...c, products: prods.filter((_: any, j: number) => j !== i) })}>
          <div className="grid grid-cols-3 gap-5">
            <F label="Label"><TI value={p.label || ""} onChange={v => updP(i, "label", v)} placeholder="Racket" /></F>
            <div className="col-span-3">
              <F label="Product">
                <ProductAutocomplete
                  value={p.product_id ?? null}
                  onChange={v => updP(i, "product_id", v)}
                  placeholder="Search by name, SKU or category…"
                />
              </F>
            </div>
            <F label="Card side"><SL value={p.side || "right"} onChange={v => updP(i, "side", v)} options={[{ v: "right", l: "Right" }, { v: "left", l: "Left" }]} /></F>
            <F label="X position" sub="% from left"><NI value={p.hotspot_x ?? 50} onChange={v => updP(i, "hotspot_x", v)} /></F>
            <F label="Y position" sub="% from top"><NI value={p.hotspot_y ?? 50} onChange={v => updP(i, "hotspot_y", v)} /></F>
          </div>
        </CardWrap>
      ))}
      <AddItem label="Add hotspot" onClick={() => u({ ...c, products: [...prods, { id: Date.now(), label: "Product", hotspot_x: 50, hotspot_y: 50, side: "right", product_id: null }] })} />
    </div>
  );
}

function TestimonialsEditor({ c, u }: any) {
  const items: any[] = c?.testimonials || [];
  const updT = (i: number, k: string, v: any) => u({ ...c, testimonials: items.map((x: any, j: number) => j === i ? { ...x, [k]: v } : x) });
  return (
    <div className="space-y-6">
      <F label="Section heading"><TI value={c?.heading || ""} onChange={v => u({ ...c, heading: v })} placeholder="What Our Athletes Say" /></F>
      <SH label="Reviews" />
      {items.map((t: any, i: number) => (
        <CardWrap key={i} title={t.author || `Review ${i + 1}`} onRemove={() => u({ ...c, testimonials: items.filter((_: any, j: number) => j !== i) })}>
          <F label="Review text" required><TAI value={t.quote || ""} onChange={v => updT(i, "quote", v)} rows={3} /></F>
          <div className="grid grid-cols-2 gap-5">
            <F label="Customer name"><TI value={t.author || ""} onChange={v => updT(i, "author", v)} placeholder="Arjun Sharma" /></F>
            <F label="Role / sport"><TI value={t.role || ""} onChange={v => updT(i, "role", v)} placeholder="Club Badminton Player" /></F>
            <F label="Star rating" sub="1–5"><NI value={t.rating || 5} onChange={v => updT(i, "rating", v)} /></F>
            <F label="Avatar URL"><TI value={t.avatar || ""} onChange={v => updT(i, "avatar", v)} placeholder="https://…" /></F>
          </div>
        </CardWrap>
      ))}
      <AddItem label="Add review" onClick={() => u({ ...c, testimonials: [...items, { id: Date.now(), quote: "", author: "", role: "", rating: 5, avatar: "" }] })} />
    </div>
  );
}

function CollectionsEditor({ c, u }: any) {
  const tabs: any[] = c?.tabs || [];
  const updT = (i: number, k: string, v: any) => u({ ...c, tabs: tabs.map((x: any, j: number) => j === i ? { ...x, [k]: v } : x) });
  return (
    <div className="space-y-6">
      <F label="Section heading"><TI value={c?.heading || ""} onChange={v => u({ ...c, heading: v })} placeholder="Featured Collections" /></F>
      <Note>Leave product IDs empty on a tab to auto-show featured products. 6 products per tab recommended.</Note>
      <SH label="Collection tabs" />
      {tabs.map((t: any, i: number) => (
        <CardWrap key={i} title={t.label || `Tab ${i + 1}`} onRemove={() => u({ ...c, tabs: tabs.filter((_: any, j: number) => j !== i) })}>
          <div className="grid grid-cols-2 gap-5">
            <F label="Tab label" required><TI value={t.label || ""} onChange={v => updT(i, "label", v)} placeholder="Badminton" /></F>
            <F label="Tab ID" sub="Lowercase slug"><TI value={t.id || ""} onChange={v => updT(i, "id", v)} placeholder="badminton" mono /></F>
            <div className="col-span-2">
              <F label="Products" sub="Up to 6 per tab — leave empty to auto-fill from featured products">
                <ProductMultiAutocomplete
                  value={t.product_ids || []}
                  onChange={v => updT(i, "product_ids", v)}
                  max={6}
                  placeholder="Search by name, SKU or category…"
                  compact
                />
              </F>
            </div>
          </div>
        </CardWrap>
      ))}
      <AddItem label="Add tab" onClick={() => u({ ...c, tabs: [...tabs, { id: `tab_${Date.now()}`, label: "", product_ids: [] }] })} />
    </div>
  );
}

function BrandsEditor({ c, u }: any) {
  const banners: any[] = c?.banners || [];
  const updB = (i: number, k: string, v: string) => u({ ...c, banners: banners.map((x: any, j: number) => j === i ? { ...x, [k]: v } : x) });
  return (
    <div className="space-y-6">
      <F label="Section heading"><TI value={c?.heading || ""} onChange={v => u({ ...c, heading: v })} placeholder="Top Brands" /></F>
      <SH label="Brand cards" />
      {banners.map((b: any, i: number) => (
        <CardWrap key={i} title={b.brand_name || `Brand ${i + 1}`} onRemove={() => u({ ...c, banners: banners.filter((_: any, j: number) => j !== i) })}>
          <div className="grid grid-cols-2 gap-5">
            <F label="Brand name" required><TI value={b.brand_name || ""} onChange={v => updB(i, "brand_name", v)} placeholder="Yonex" /></F>
            <F label="Card label"><TI value={b.label || ""} onChange={v => updB(i, "label", v)} placeholder="Yonex Gear" /></F>
            <div className="col-span-2"><F label="Destination URL"><TI value={b.link || ""} onChange={v => updB(i, "link", v)} placeholder="/products?brand=yonex" /></F></div>
          </div>
          <CloudinaryUploader label="Banner image" value={b.image_url} onChange={v => updB(i, "image_url", v)} aspect="wide" hint="540 × 300 px" />
        </CardWrap>
      ))}
      <AddItem label="Add brand" onClick={() => u({ ...c, banners: [...banners, { id: Date.now(), brand_name: "", image_url: "", link: "/products", label: "" }] })} />
    </div>
  );
}

function AboutEditor({ c, u }: any) {
  const stats: any[] = (c?.stats || [{}, {}, {}, {}]).slice(0, 4);
  const cats: string[] = c?.top_categories || [];
  const cities: string[] = c?.top_cities || [];
  return (
    <div className="space-y-6">
      <F label="Brand tagline"><TI value={c?.tagline || ""} onChange={v => u({ ...c, tagline: v })} placeholder="India's Biggest Sports E-Commerce Store" /></F>
      <F label="Brand description"><TAI value={c?.description || ""} onChange={v => u({ ...c, description: v })} rows={4} /></F>
      <SH label="Statistics" />
      <div className="grid grid-cols-2 gap-4">
        {stats.map((s: any, i: number) => (
          <div key={i} className="grid grid-cols-2 gap-2">
            <F label={`Value ${i + 1}`}>
              <input value={s.value || ""} onChange={e => u({ ...c, stats: stats.map((st: any, j: number) => j === i ? { ...st, value: e.target.value } : st) })} className={`${inp} font-bold`} placeholder="10,000+" />
            </F>
            <F label="Label">
              <input value={s.label || ""} onChange={e => u({ ...c, stats: stats.map((st: any, j: number) => j === i ? { ...st, label: e.target.value } : st) })} className={inp} placeholder="Happy Athletes" />
            </F>
          </div>
        ))}
      </div>
      <SH label="Navigation" />
      <div className="grid grid-cols-2 gap-5">
        <F label="Top categories" sub="Comma-separated">
          <input type="text" value={cats.join(", ")} onChange={e => u({ ...c, top_categories: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} className={inp} placeholder="Badminton, Cricket, Tennis" />
        </F>
        <F label="Cities served" sub="Comma-separated">
          <input type="text" value={cities.join(", ")} onChange={e => u({ ...c, top_cities: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} className={inp} placeholder="Hyderabad, Mumbai, Delhi" />
        </F>
      </div>
      <SH label="Social links" />
      <div className="grid grid-cols-3 gap-5">
        <F label="Instagram"><TI value={c?.social_links?.instagram || ""} onChange={v => u({ ...c, social_links: { ...c?.social_links, instagram: v } })} placeholder="https://instagram.com/…" /></F>
        <F label="Facebook"><TI value={c?.social_links?.facebook || ""} onChange={v => u({ ...c, social_links: { ...c?.social_links, facebook: v } })} placeholder="https://facebook.com/…" /></F>
        <F label="YouTube"><TI value={c?.social_links?.youtube || ""} onChange={v => u({ ...c, social_links: { ...c?.social_links, youtube: v } })} placeholder="https://youtube.com/…" /></F>
      </div>
    </div>
  );
}

function SectionEditor({ sk, content, onChange, json }: { sk: string; content: any; onChange: (v: any) => void; json: boolean }) {
  if (json) return <JsonEditor value={content} onChange={onChange} />;
  const p = { c: content, u: onChange };
  switch (sk) {
    case "announcement_bar":     return <AnnouncementEditor {...p} />;
    case "hero_banners":         return <HeroEditor {...p} />;
    case "quick_categories":     return <QuickCatEditor {...p} />;
    case "movement_section":     return <MovementEditor {...p} />;
    case "homepage_videos":      return <VideosEditor {...p} />;
    case "featured_product":     return <FeaturedProdEditor {...p} />;
    case "crafted_section":      return <CraftedEditor {...p} />;
    case "bundle_builder":       return <BundleEditor {...p} />;
    case "deal_of_day":          return <DealEditor {...p} />;
    case "shop_the_look":        return <ShopLookEditor {...p} />;
    case "testimonials":         return <TestimonialsEditor {...p} />;
    case "featured_collections": return <CollectionsEditor {...p} />;
    case "brand_spotlight":      return <BrandsEditor {...p} />;
    case "about_section":        return <AboutEditor {...p} />;
    default:                     return <JsonEditor value={content} onChange={onChange} />;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminHomepagePage() {
  const qc = useQueryClient();
  const [active,   setActive]   = useState<SK>("hero_banners");
  const [drafts,   setDrafts]   = useState<Record<string, { content: any; is_active: boolean }>>({});
  const [json,     setJson]     = useState<Record<string, boolean>>({});
  const [seeding,  setSeeding]  = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const { data: remote, isLoading } = useQuery({
    queryKey: ["admin-homepage"],
    queryFn: () => api.get("/admin/homepage").then(r => r.data.sections),
  });

  // Sync remote → drafts (only for sections not yet locally edited)
  useEffect(() => {
    if (!remote) return;
    setDrafts(prev => {
      const n = { ...prev };
      SECTIONS.forEach(({ key }) => {
        if (remote[key] && !n[key]) {
          n[key] = { content: remote[key].content, is_active: remote[key].is_active ?? true };
        }
      });
      return n;
    });
  }, [remote]);

  const saveMut = useMutation({
    mutationFn: ({ key, data }: { key: string; data: any }) => api.put(`/admin/homepage/${key}`, data),
    onSuccess: (_, { key }) => {
      toast.success(`${SECTIONS.find(s => s.key === key)?.label} saved ✓`);
      qc.invalidateQueries({ queryKey: ["admin-homepage"] });
      qc.invalidateQueries({ queryKey: ["homepage"] });
    },
    onError: () => toast.error("Save failed — check your connection"),
  });

  const resetMut = useMutation({
    mutationFn: (key: string) => api.delete(`/admin/homepage/${key}`),
    onSuccess: () => {
      toast.success("Reset to default content");
      qc.invalidateQueries({ queryKey: ["admin-homepage"] });
      qc.invalidateQueries({ queryKey: ["homepage"] });
    },
  });

  // Smart seed — uses real categories + products
  const smartSeed = async () => {
    setSeeding(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get("/categories"),
        api.get("/products?per_page=12&sort_by=is_featured&is_active=true"),
      ]);
      const cats: any[] = catRes.data || [];
      const prodData = prodRes.data;
      const prods: any[] = Array.isArray(prodData) ? prodData : (prodData?.items || []);

      const defaults = await buildSeedDefaults(cats, prods);

      // Save each section
      await Promise.all(
        Object.entries(defaults).map(([key, content]) =>
          api.put(`/admin/homepage/${key}`, { content, is_active: true })
        )
      );

      toast.success(`✓ All ${Object.keys(defaults).length} sections seeded with your real categories & products`);
      qc.invalidateQueries({ queryKey: ["admin-homepage"] });
      qc.invalidateQueries({ queryKey: ["homepage"] });
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Seed failed — check API connection");
    } finally {
      setSeeding(false);
    }
  };

  const setDraft  = (key: string, content: any) => setDrafts(p => ({ ...p, [key]: { ...p[key], content } }));
  const toggleVis = (key: string) => setDrafts(p => ({ ...p, [key]: { ...p[key], is_active: !p[key]?.is_active } }));
  const save      = (key: string) => { const d = drafts[key]; if (d) saveMut.mutate({ key, data: { content: d.content, is_active: d.is_active } }); };

  const draft    = drafts[active];
  const section  = SECTIONS.find(s => s.key === active)!;
  const isSaving = saveMut.isPending && (saveMut.variables as any)?.key === active;
  const idx      = SECTIONS.findIndex(s => s.key === active);
  const Ico      = section ? SECTION_ICON[section.key] : LayoutTemplate;

  return (
    <div className="flex -mx-6 -my-6 h-[calc(100vh-0px)] overflow-hidden bg-gray-100">

      {/* ══ Section sidebar ═════════════════════════════════════════════════ */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900">Homepage</span>
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-brand-600 transition-colors">
            <ExternalLink size={11} /> View
          </a>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {GROUPS.map(group => {
            const list = SECTIONS.filter(s => s.group === group);
            if (!list.length) return null;
            return (
              <div key={group} className="mb-1">
                <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em]">{group}</p>
                {list.map(sec => {
                  const SIcon = SECTION_ICON[sec.key];
                  const d = drafts[sec.key];
                  const live = d?.is_active ?? true;
                  const on = active === sec.key;
                  return (
                    <button key={sec.key} onClick={() => setActive(sec.key as SK)}
                      className={`relative w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${on ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                      {on && <span className="absolute inset-y-1.5 left-0 w-[3px] bg-brand-600 rounded-r-full" />}
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${on ? "bg-brand-100 text-brand-600" : "bg-gray-100 text-gray-500"}`}>
                        <SIcon size={13} strokeWidth={2} />
                      </span>
                      <span className="flex-1 text-sm font-medium truncate">{sec.label}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {sec.critical && <AlertTriangle size={10} className="text-amber-400" />}
                        <span className={`w-1.5 h-1.5 rounded-full ${live ? "bg-emerald-500" : "bg-gray-300"}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="p-3 border-t border-gray-100 space-y-2">
          <button onClick={smartSeed} disabled={seeding}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50">
            <Database size={13} className={seeding ? "animate-pulse" : ""} strokeWidth={2.5} />
            {seeding ? "Seeding…" : "Seed with Real Data"}
          </button>
        </div>
      </aside>

      {/* ══ Editor + Preview ════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
            <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            <p className="text-sm">Loading section data…</p>
          </div>
        ) : (
          <>
            {/* ── Top action bar ──────────────────────────────────────────── */}
            <header className="shrink-0 bg-white border-b border-gray-200 px-6 h-14 flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                <span className="text-gray-400 text-xs">Homepage</span>
                <ChevronRight size={13} className="text-gray-300 shrink-0" />
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${section.critical ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"}`}>
                    <Ico size={12} strokeWidth={2} />
                  </span>
                  <span className="font-semibold text-gray-900 truncate">{section.label}</span>
                  {section.critical && (
                    <span className="shrink-0 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wide">Critical</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Preview toggle */}
                <button onClick={() => setShowPreview(v => !v)}
                  className={`h-8 px-3 flex items-center gap-1.5 text-xs font-semibold rounded-lg border transition-all ${showPreview ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"}`}>
                  <Monitor size={12} /> {showPreview ? "Hide Preview" : "Preview"}
                </button>
                {/* JSON toggle */}
                <button onClick={() => setJson(p => ({ ...p, [active]: !p[active] }))}
                  className={`h-8 px-3 flex items-center gap-1.5 text-xs font-semibold rounded-lg border transition-all ${json[active] ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"}`}>
                  <Code2 size={12} /> {json[active] ? "Form" : "JSON"}
                </button>
                {/* Visibility */}
                <button onClick={() => toggleVis(active)}
                  className={`h-8 px-3 flex items-center gap-1.5 text-xs font-semibold rounded-lg border transition-all ${draft?.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-gray-50 text-gray-500 border-gray-300 hover:bg-gray-100"}`}>
                  {draft?.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                  {draft?.is_active ? "Visible" : "Hidden"}
                </button>
                <div className="w-px h-5 bg-gray-200" />
                <button onClick={() => { if (confirm("Reset this section to default content?")) resetMut.mutate(active); }}
                  className="h-8 px-3 text-xs font-semibold text-gray-500 bg-white border border-gray-300 rounded-lg hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-all">
                  Reset
                </button>
                <button onClick={() => save(active)} disabled={isSaving || !draft}
                  className="h-8 px-4 flex items-center gap-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSaving
                    ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving</>
                    : <><Save size={13} strokeWidth={2.5} /> Save</>}
                </button>
              </div>
            </header>

            {/* ── Two-column: Form + Preview ───────────────────────────────── */}
            <div className="flex-1 flex overflow-hidden">

              {/* Form editor */}
              <div className={`flex flex-col overflow-hidden transition-all ${showPreview ? "w-[55%]" : "flex-1"}`}>
                <div className="flex-1 overflow-y-auto">
                  <div className="px-7 py-7">
                    {/* Section description */}
                    <div className="flex items-start gap-4 mb-7 pb-6 border-b border-gray-200">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${section.critical ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"}`}>
                        <Ico size={17} strokeWidth={1.5} />
                      </div>
                      <div className="flex-1">
                        <h1 className="text-base font-bold text-gray-900">{section.label}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{section.desc}</p>
                      </div>
                    </div>

                    {draft ? (
                      <SectionEditor sk={active} content={draft.content} onChange={v => setDraft(active, v)} json={json[active] || false} />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                          <Ico size={24} className="text-gray-400" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-base font-bold text-gray-800 mb-1.5">No content yet</h3>
                        <p className="text-sm text-gray-400 max-w-xs mb-6">Use <strong className="text-gray-600">Seed with Real Data</strong> in the sidebar to auto-populate all sections using your live categories and products.</p>
                        <button onClick={smartSeed} disabled={seeding} className="btn-primary text-sm flex items-center gap-2">
                          <Database size={13} /> {seeding ? "Seeding…" : "Seed with Real Data"}
                        </button>
                      </div>
                    )}

                    {/* Prev / Next navigation */}
                    <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
                      {idx > 0 ? (
                        <button onClick={() => setActive(SECTIONS[idx - 1].key as SK)}
                          className="flex items-center gap-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 group transition-colors">
                          <span className="w-7 h-7 rounded-lg border border-gray-200 bg-white group-hover:border-gray-300 flex items-center justify-center transition-colors"><ArrowLeft size={13} /></span>
                          {SECTIONS[idx - 1].label}
                        </button>
                      ) : <div />}
                      {idx < SECTIONS.length - 1 ? (
                        <button onClick={() => setActive(SECTIONS[idx + 1].key as SK)}
                          className="flex items-center gap-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 group transition-colors">
                          {SECTIONS[idx + 1].label}
                          <span className="w-7 h-7 rounded-lg border border-gray-200 bg-white group-hover:border-gray-300 flex items-center justify-center transition-colors"><ArrowRight size={13} /></span>
                        </button>
                      ) : <div />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview panel */}
              {showPreview && (
                <div className="w-[45%] border-l border-gray-200 bg-gray-50 flex flex-col overflow-hidden">
                  {/* Preview header */}
                  <div className="shrink-0 px-5 py-3 bg-white border-b border-gray-200 flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-md px-3 py-1 text-[11px] text-gray-400 font-mono text-center">
                      racketekoutlet.com — {section.label}
                    </div>
                    <a href="/" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-brand-600 transition-colors">
                      <ExternalLink size={11} />
                    </a>
                  </div>

                  {/* Preview content */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {draft?.content ? (
                      <div className="space-y-3">
                        {/* Live indicator */}
                        <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Live preview — updates as you type
                        </div>

                        {/* The actual scaled component */}
                        <LivePreview sk={active} content={draft.content} />

                        {/* Visibility status */}
                        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${draft.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                          {draft.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                          {draft.is_active ? "This section is visible on the homepage" : "This section is hidden from the homepage"}
                        </div>

                        {/* Quick save reminder */}
                        <p className="text-[11px] text-gray-400 text-center">
                          Changes are live-previewed above. Click <strong>Save</strong> to publish.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <Layers size={32} className="text-gray-200 mb-3" />
                        <p className="text-sm text-gray-400 font-medium">No content to preview</p>
                        <p className="text-xs text-gray-300 mt-1">Seed defaults or add content to see a preview</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
