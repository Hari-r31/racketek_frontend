import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../redux/store";
import {
  fetchHomeData,
  selectHomeData,
  selectHomeLoading,
} from "../redux/features/home/homeSlice";

import TopBar from "../components/HomePage/TopBar";
import Header from "../components/HomePage/Header";
import HeroBanners from "../components/HomePage/HeroBanners";
import MovementSection from "../components/HomePage/MovementSection";
import CategoryIcons from "../components/HomePage/CategoryIcons";
import VideoCard from "../components/HomePage/VideoCard";
import CraftedforChampions from "../components/HomePage/CraftedforChampions";
import FeaturedProduct from "../components/HomePage/FeaturedProduct";
import TrustIndicators from "../components/HomePage/TrustIndicators";
import AthletesImage from "../components/HomePage/AthletesImage";
import ShopTheLook from "../components/HomePage/ShopTheLook";
import Testimonial from "../components/HomePage/Testimonial";
import FeaturedCollections from "../components/HomePage/FeaturedCollections";
import AboutRacketOutlet from "../components/HomePage/AboutRacketOutlet";
import InfoCards from "../components/HomePage/InfoCards";
import Footer from "../components/HomePage/Footer";
import Loader from "../components/Loader";



const Home = () => {
  const dispatch = useAppDispatch();
  const homeData = useAppSelector(selectHomeData);
  const loading = useAppSelector(selectHomeLoading);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // ✅ Always run on mount, let thunk decide cache vs fresh
  useEffect(() => {
    dispatch(fetchHomeData());
  }, [dispatch]);

  // Scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY <= lastScrollY || currentScrollY < 50);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-screen flex flex-col bg-white font-poppins">
      <TopBar />
      <Header />
      <main className="flex-grow max-w-[1840px] w-full mx-auto px-2 py-4">
        {loading || !homeData ? (
<Loader />
) : (
  <>
    <HeroBanners />
    <MovementSection />
    <CategoryIcons />
    <VideoCard />
    <FeaturedProduct />
    <CraftedforChampions />
    <TrustIndicators />
    <AthletesImage />
    <ShopTheLook />
    <Testimonial />
    <FeaturedCollections />
    <div id="about">
      <AboutRacketOutlet />
    </div>
    <InfoCards />
  </>
)}

      </main>
      <Footer />

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/917996992599?text=Hi%20I%20need%20help!"
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed bottom-5 right-5 flex items-center justify-center w-14 h-14 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 hover:shadow-xl transition-all duration-500 ease-in-out z-50
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="w-10 h-10 fill-current"
        >
          <path d="M16.003 3.003c-7.168 0-13 5.832-13 13 0 2.293.61 4.533 1.768 6.493L3 29l6.696-1.742c1.883 1.01 3.985 1.544 6.307 1.544 7.168 0 13-5.832 13-13s-5.832-13-13-13zm0 23c-2.035 0-4.033-.525-5.774-1.518l-.414-.236-3.975 1.033 1.061-3.871-.254-.397c-1.07-1.668-1.628-3.598-1.628-5.511 0-5.794 4.706-10.5 10.5-10.5s10.5 4.706 10.5 10.5-4.706 10.5-10.5 10.5zm5.878-7.871c-.32-.16-1.883-.926-2.176-1.033-.293-.107-.507-.16-.72.16-.213.32-.826 1.033-1.013 1.246-.187.213-.373.24-.693.08-.32-.16-1.35-.497-2.57-1.584-.95-.847-1.592-1.892-1.779-2.212-.187-.32-.02-.493.14-.653.143-.143.32-.373.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.733-.986-2.374-.26-.62-.527-.533-.72-.543-.187-.007-.4-.009-.613-.009-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.667s1.147 3.093 1.307 3.307c.16.213 2.26 3.453 5.48 4.84.767.33 1.363.527 1.829.674.768.244 1.468.21 2.02.127.62-.093 1.883-.767 2.147-1.507.267-.747.267-1.387.187-1.507-.08-.12-.293-.187-.613-.347z"/>
</svg>
      </a>
    </div>
  );
};

export default Home;

const AboutRacketOutlet = () => (
  <div className="bg-black text-white p-6 space-y-6">
    {/* Header */}
    <h1 className="text-2xl font-bold mb-3">RacketOutlet - India's Premier Sports E-commerce Platform</h1>
    <p className="text-sm leading-relaxed">
      RacketOutlet is India's premier sports e-commerce platform, offering a wide range of high-quality sports products and services at competitive prices with fast deliveries. Our mission is to provide end-to-end solutions for customers, players, coaches, and sports enthusiasts, building a vibrant sporting community.
    </p>

    {/* RacketOutlet.club */}
    <div>
      <h2 className="text-xl font-semibold mb-2">RacketOutlet.club: Your One-stop Online Store for Sports Gear</h2>
      <p className="text-sm leading-relaxed">
        RacketOutlet.club is a specialized online store for sports products and accessories. Explore rackets, shoes, apparel, and other sporting equipment. Enjoy PAN India shipping with multiple payment options and cash on delivery.
      </p>
    </div>

    {/* Online Shopping Info */}
    <div>
      <h2 className="text-xl font-semibold mb-2">Buy Sports Products & Accessories Online in India</h2>
      <p className="text-sm leading-relaxed font-medium">
        Curated Selection | Authentic Products | Branded Quality
      </p>
    </div>

    {/* Top Categories */}
    <div>
      <h2 className="text-xl font-semibold mb-2">Top Categories</h2>
      <p className="text-sm leading-relaxed">
        Badminton Rackets | Badminton Shoes | Badminton Shuttle | Badminton Accessories | Cricket Bats | Cricket Shoes | Cricket Balls | Tennis Rackets | Tennis Shoes | Tennis Balls | Squash Rackets | Squash Balls | Pickleball Paddles | Boxing Gloves | Boxing Shoes | Padel Rackets | Padel Shoes | Running Shoes | Football | Swimming | Nutrition
      </p>
    </div>

    {/* Top Products */}
    <div>
      <h2 className="text-xl font-semibold mb-2">Top Products</h2>
      <p className="text-sm leading-relaxed">
        Adidas FS09 Hybrid Shuttlecock | YONEX Astrox 99 Play Racket | YONEX Astrox Lite 27i Racket | Yonex BG 65 Titanium | Babolat Hybrid Challenge Shuttlecock | Apacs Vanguard 11 Racket (Red) | DSC Lava Kashmir Willow Cricket Bat | Fleet Duora 10 Racket | SS Master 100 Kashmir Willow Cricket Bat | DSC Jaffa 22 Cricket Spike Shoes | New Balance DC 580 Wicketkeeping Gloves | Apacs Vanguard 11 Racket (Black) | Dunlop AO Tennis Balls Dozen | Li-Ning D3 Badminton Feather Shuttlecock | Yonex Badminton Grip TECH 501B | YONEX Power Cushion SHB 65 Z3 (Black) Shoes | YONEX Power Cushion SHB 65 Z3 White Tiger Shoes
      </p>
    </div>

    {/* Our Goal */}
    <div>
      <h2 className="text-xl font-semibold mb-2">Our Goal: Empowering Sports Enthusiasts</h2>
      <p className="text-sm leading-relaxed">
        At RacketOutlet, we empower sports enthusiasts with comprehensive sporting solutions. Whether it's top-tier gear, personalized coaching, expert advice, or curated events, we cater to every aspect of your sporting journey, ensuring access to premium products and support for all levels.
      </p>
    </div>

    {/* Top Cities */}
    <div>
      <h2 className="text-xl font-semibold mb-2">Top Cities: We Ship Across India</h2>
      <p className="text-sm leading-relaxed">
        Bangalore | Mumbai | Delhi | Chennai | Hyderabad | Gurugram | Pune | Kolkata | Ahmedabad | Indore | Jaipur | Guwahati
      </p>
    </div>

    {/* Authenticity */}
    <div>
      <h2 className="text-xl font-semibold mb-2">Authenticity Guaranteed</h2>
      <p className="text-sm leading-relaxed">
        Every product undergoes strict authenticity checks to ensure customers receive the exact item ordered, meeting our high standards of quality and reliability.
      </p>
    </div>
  </div>
);

export default AboutRacketOutlet;



const AthletesImage = () => (
  <div className="mb-8 relative">
    <img
      src="athelet.png"
      alt="Group of athletes playing various sports"
      className="w-full h-full object-cover rounded-xl mt-6"
    />


  </div>
);

export default AthletesImage;

import { useEffect, useRef } from "react";

const brands: string[] = ["Nike", "Adidas", "Puma", "Yonex", "Wilson", "Li-Ning", "Head", "Asics"];

interface Position {
  x: number;
  y: number;
}

const VShapeMarquee: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const logosRef = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    let speed = 0.5;
    const positions: Position[] = Array(brands.length * 2)
      .fill(0)
      .map(() => ({ x: 0, y: 0 }));

    const updatePositions = () => {
      const container = containerRef.current;
      if (!container) return;

      const width = container.offsetWidth;
      const height = container.offsetHeight;

      logosRef.current.forEach((logo, i) => {
        if (!logo) return;

        const row = i < brands.length ? 0 : 1;

        const startY = row === 0 ? height * 0.2 : height * 0.6;
        const endY = row === 0 ? height * 0.4 : height * 0.8;

        positions[i].x += speed;
        positions[i].y = startY + ((endY - startY) / width) * positions[i].x;

        if (positions[i].x > width) positions[i].x = -100;

        logo.style.transform = `translate(${positions[i].x}px, ${positions[i].y}px)`;
      });

      requestAnimationFrame(updatePositions);
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) speed = 3;
      else if (e.deltaY < 0) speed = -3;
      else speed = 0.5;
    };

    window.addEventListener("wheel", handleWheel);
    updatePositions();

    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  const duplicatedBrands: string[] = [...brands, ...brands];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[400px] bg-gray-50 overflow-hidden"
    >
      {duplicatedBrands.map((b, i) => (
        <div
          key={i}
          ref={(el) => { logosRef.current[i] = el; }} // ✅ Return void
          className="absolute w-12 h-12 bg-white border rounded-full flex items-center justify-center text-black text-sm font-bold shadow"
        >
          {b}
        </div>
      ))}
    </div>
  );
};

export default VShapeMarquee;



const products = [
  { name: "Yonex Nanoflare 800", price: "₹8,999", img: "https://placehold.co/200x150/e2e8f0/e2e8f0?text=Badminton+Racket" },
  { name: "Adidas Performance Backpack", price: "₹2,499", img: "https://placehold.co/200x150/e2e8f0/e2e8f0?text=Backpack" },
  { name: "Overgrip Tape Pack", price: "₹299", img: "https://placehold.co/200x150/e2e8f0/e2e8f0?text=Grip+Tape" }
];

const BuildBundle = () => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-4">Build your Bundle</h2>
    <p className="text-sm text-gray-600 mb-4">Choose from our curated collection of products to build your perfect bundle.</p>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {products.map((p, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4">
          <img src={p.img} alt={p.name} className="w-full h-24 object-cover mb-2" />
          <h3 className="text-sm font-medium">{p.name}</h3>
          <p className="text-xs text-gray-500">{p.price}</p>
          <button className="mt-2 bg-black text-white text-xs py-1 px-3 rounded">Add to Bundle</button>
        </div>
      ))}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-2">Your Bundle</h3>
        <p className="text-xs text-gray-500 mb-2">No items added yet</p>
        <button className="w-full bg-gray-200 text-gray-700 text-xs py-1 px-3 rounded">Checkout</button>
      </div>
    </div>
  </div>
);

export default BuildBundle;

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export default function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../Loader";

import { fetchHomeData, selectCategories, selectHomeData } from "../../redux/features/home/homeSlice";
import { useAppDispatch, useAppSelector } from "../../redux/store";

const HomepageSubcategories: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const subcategories = useAppSelector(selectCategories);
  const homeData = useAppSelector(selectHomeData);
  const loading = useAppSelector((state) => state.home.loading);

  // Fetch home data only if Redux store is empty
  useEffect(() => {
    if (!homeData) {
      dispatch(fetchHomeData());
    }
  }, [dispatch, homeData]);

  if (loading) return <Loader />;
  if (subcategories.length === 0)
    return <p className="text-center py-16">No categories available.</p>;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 mt-6">Explore Categories</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {subcategories.map((cat) => (
          <div
            key={cat.subcategory.id}
            className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition p-4"
            onClick={() => navigate(`/subcategories/${cat.subcategory.id}/products`)}
          >
            <img
              src={cat.subcategory.image || "/default.png"}
              alt={cat.subcategory.name}
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.currentTarget.src = "/default.png";
              }}
            />
            <h3 className="text-black font-semibold text-base mt-3">{cat.subcategory.name}</h3>
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{cat.subcategory.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomepageSubcategories;

import { useState, useRef } from "react";
import type { MouseEvent, Touch } from "react";



const CraftedForChampions: React.FC = () => {
  const [position, setPosition] = useState<number>(50); // % of reveal
  const containerRef = useRef<HTMLDivElement | null>(null);

  // --- Handle Mouse Drag ---
  const handleMouseDrag = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let newY = ((e.clientY - rect.top) / rect.height) * 100;
    newY = Math.max(0, Math.min(100, newY)); // clamp
    setPosition(newY);
  };

  // --- Handle Touch Drag ---
  const handleTouchDrag = (touch: Touch) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let newY = ((touch.clientY - rect.top) / rect.height) * 100;
    newY = Math.max(0, Math.min(100, newY));
    setPosition(newY);
  };

  return (
    <section className="bg-gray-100 py-16">
      <div className="w-full px-2 md:px-0 flex flex-col items-center select-none">
        {/* Top small text */}
        <p className="text-sm md:text-base text-gray-500 mb-2 uppercase tracking-wide">
          Speed · Comfort · Precision
        </p>

        {/* Big gradient headline */}
        <h1 className="text-3xl md:text-5xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-black">
          Crafted for Champions
        </h1>

        {/* Before/After Vertical Image Slider */}
        <div
          ref={containerRef}
          className="relative w-full md:w-[90vw] h-[400px] md:h-[600px] rounded-2xl overflow-hidden shadow-lg border"
          onMouseMove={(e) => e.buttons === 1 && handleMouseDrag(e)}
          onTouchMove={(e) => handleTouchDrag(e.touches[0])}
        >
          {/* Bottom Image */}
          <img
            src="/img.jpg"
            alt="Bottom"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />

          {/* Top Image clipped vertically */}
          <div
            className="absolute left-0 top-0 w-full overflow-hidden"
            style={{ height: `${position}%` }}
          >
            <img
              src="/img.jpg"
              alt="Top"
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>

          {/* Divider Line (Draggable) */}
          <div
            className="absolute left-0 right-0 cursor-row-resize"
            style={{ top: `${position}%` }}
            onMouseDown={(e) => handleMouseDrag(e)}
            onTouchStart={(e) => handleTouchDrag(e.touches[0])}
          >
            <div className="h-1 bg-white w-full shadow-md"></div>
            <div className="absolute left-1/2 -top-3 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-gray-400 shadow-md flex items-center justify-center">
              <div className="w-4 h-2 bg-gray-600 rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CraftedForChampions;

// src/components/FeaturedCollections.tsx
import React, { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/store"; // adjust path
import Loader from "../Loader";
import { fetchHomeData, selectFeaturedProducts, selectHomeLoading } from "../../redux/features/home/homeSlice";

const FeaturedCollections: React.FC = () => {
  const dispatch = useAppDispatch();
  const featuredProducts = useAppSelector(selectFeaturedProducts);
  const loading = useAppSelector(selectHomeLoading);

  useEffect(() => {
    if (!featuredProducts.length) {
      dispatch(fetchHomeData());
    }
  }, [dispatch, featuredProducts.length]);

  if (loading) return <Loader />;
  if (!featuredProducts.length)
    return <p className="text-center py-16 text-gray-500">No collections available.</p>;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 mt-6">
        Featured Collections
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
        {featuredProducts.map((fp) => {
          const product = fp.product;
          return (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="group border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition p-4 block"
            >
              <img
                src={product.main_image_url || "/default.png"}
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/default.png";
                }}
              />
              <div className="p-3">
                <h3 className="text-black font-semibold text-base">{product.name}</h3>
                <p className="text-gray-500 text-sm mb-2 line-clamp-2">{product.description}</p>
                <p className="text-sm font-medium">
                  Price: ₹{Number(product.current_price).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  Stock: {product.inventory.quantity} {product.inventory.is_low_stock ? "(Low)" : ""}
                </p>
                <div className="flex items-center gap-1 text-sm text-blue-600 font-medium group-hover:underline mt-2">
                  Shop Now <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default FeaturedCollections;

// src/components/FeaturedProduct.tsx
import React, { useEffect, useState } from "react";
import Loader from "../Loader";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { fetchHomeData, selectExclusiveProducts, selectHomeData } from "../../redux/features/home/homeSlice";
import { addCartItemThunk, updateCartItemThunk } from "../../redux/features/cart/cartThunks";

const FeaturedProduct: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Redux state
  const exclusiveProducts = useAppSelector(selectExclusiveProducts);
  const homeData = useAppSelector(selectHomeData);
  const loading = useAppSelector((state) => state.home.loading);
  const user = useAppSelector((state) => state.auth.user);
  const cart = useAppSelector((state) => state.cart.cart);

  // Local state
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [loadingCart, setLoadingCart] = useState(false);

  // Get first exclusive product
  const product = exclusiveProducts.length > 0 ? exclusiveProducts[0].product : null;

  // Set main image whenever product changes
  useEffect(() => {
    if (product) setMainImage(product.main_image_url);
  }, [product]);

  // Fetch home data only if Redux store is empty
  useEffect(() => {
    if (!homeData) {
      dispatch(fetchHomeData());
    }
  }, [dispatch, homeData]);

  if (loading) return <Loader />;
  if (!product) return <p className="text-center text-gray-500 py-10">No featured product</p>;

  // Prepare images for carousel
  const images = product.images?.length
    ? [product.main_image_url, ...product.images.map(img => img.image_url).filter((url): url is string => !!url)]
    : [product.main_image_url];

  const cartItem = cart?.items?.find(item => item.product.id === product.id);

  const handleAddToCart = async (quantity: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) return navigate("/login");
    if (quantity < 1) return;

    try {
      setLoadingCart(true);
      if (cartItem?.id) {
        await dispatch(updateCartItemThunk({ id: cartItem.id, product_id: product.id, quantity })).unwrap();
      } else {
        await dispatch(addCartItemThunk({ product_id: product.id, quantity })).unwrap();
      }
    } catch (err) {
      console.error("Cart update failed:", err);
    } finally {
      setLoadingCart(false);
    }
  };

  const handleBuyNow = () => {
    if (!user) return navigate("/login");

    const finalPrice = Number(product.discounted_price ?? product.price);
    const directItem = {
      id: Date.now(),
      quantity: 1,
      product: {
        id: product.id,
        name: product.name,
        main_image_url: product.main_image_url,
        price: Number(product.price),
        discounted_price: product.discounted_price ?? undefined,
        current_price: finalPrice,
      },
      subtotal: finalPrice
    };

    navigate("/checkout", { state: { directItems: [directItem], total: finalPrice } });
  };

  return (
    <div className="bg-white p-8 rounded-lg max-w-7xl mx-auto mt-16 mb-16 min-h-[600px] grid grid-cols-1 md:grid-cols-2 gap-12">
      {/* Left: Image Carousel */}
      <div className="flex flex-col w-full h-full">
        {mainImage && (
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover rounded-lg mb-4"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/default.png"; }}
          />
        )}
        <div className="flex space-x-2">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img ?? "/default.png"}
              alt={`Thumbnail ${idx}`}
              className={`w-20 h-20 object-cover rounded-lg cursor-pointer border ${mainImage === img ? "border-black" : "border-gray-300"}`}
              onClick={() => setMainImage(img)}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/default.png"; }}
            />
          ))}
        </div>
      </div>

      {/* Right: Product Details */}
      <div className="flex flex-col justify-between">
        <div
          className="cursor-pointer"
          onClick={() => navigate(`/products/${product.id}`)}
        >
          <span className="text-sm text-gray-500">{product.brand}</span>
          <h2 className="text-2xl font-bold my-2 text-black">{product.name}</h2>

          <div className="flex items-center mb-4">
            <span className="text-red-500 font-bold text-xl mr-2">
              ₹{product.discounted_price || product.price}
            </span>
            {product.discounted_price && (
              <span className="text-gray-400 line-through">₹{product.price}</span>
            )}
          </div>

          <span className="text-sm text-gray-500">{product.description}</span>
        </div>

        <div className="flex space-x-4 mt-4">
          {cartItem ? (
            <button
              onClick={(e) => { e.stopPropagation(); navigate("/cart"); }}
              className="flex-1 py-3 rounded-md bg-black text-white hover:bg-white hover:text-black hover:border transition"
            >
              Go to Cart
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); handleAddToCart(1, e); }}
              disabled={loadingCart}
              className={`flex-1 py-3 rounded-md transition text-white ${loadingCart ? "bg-gray-500 cursor-not-allowed" : "bg-black hover:bg-gray-800"}`}
            >
              {loadingCart ? "Adding..." : "Add to Cart"}
            </button>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); handleBuyNow(); }}
            className="flex-1 border border-gray-300 text-black py-3 rounded-md hover:bg-gray-100 transition"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProduct;

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4 space-y-12">
        {/* Logo & Welcome */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">RacketOutlet</h2>
          <p className="text-gray-300">Welcome to the future of Sports.</p>
        </div>

        {/* Newsletter */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
          <input
            type="email"
            placeholder="Enter your email"
            className="p-2 rounded-md text-black w-full sm:w-1/3"
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
            Subscribe
          </button>
        </div>

        {/* Links Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
          <div>
            <h3 className="font-semibold text-lg mb-2">POLICY</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
              <li>Shipping Policy</li>
              <li>Return & Refund Policy</li>
              <li>About Us</li>
              <li>Contact Us</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">SPORTS</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>Badminton</li>
              <li>Cricket</li>
              <li>Tennis</li>
              <li>Squash</li>
              <li>Football</li>
              <li>Boxing</li>
            </ul>
            <h3 className="font-semibold text-lg mt-4 mb-2">NEWS</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>Badminton</li>
              <li>Cricket</li>
              <li>Football</li>
              <li>Tennis</li>
              <li>Others</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">COMMUNITY & SUPPORT</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>Run90</li>
              <li>Insta360</li>
              <li>Product360</li>
              <li>Creed Fight Nights</li>
              <li>The Gorilla Trail Duathlon</li>
            </ul>
            <h3 className="font-semibold text-lg mt-4 mb-2">MAILING ADDRESS</h3>
            <p className="text-gray-300 text-sm">
              RACKETEK SPORTS PRIVATE LIMITED <br />
              #61 VISHNUNIVASA, 12th Main 2nd Cross Jubilee college road,NRI layout (Kalkere)Horamavu post,Bengaluru-560113.
            </p>
            <h3 className="font-semibold text-lg mt-4 mb-2">SUPPORT</h3>
            <p className="text-gray-300 text-sm">
              Track Your Order <br />
              General Queries: racketoutlet.in@gmail.com <br />
              10 AM to 6 PM (Monday to Friday)
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-gray-500 text-sm mt-8">
          &copy; 2025 RacketOutlet. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Loader from "../Loader";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { logout } from "../../redux/features/auth/authSlice";
import {
  faUser,
  faSearch,
  faShoppingCart,
  faBars,
  faXmark,
  faHeart,
  faCog,
} from "@fortawesome/free-solid-svg-icons";

import {
  fetchHomeData,
  selectHomeLoading,
  selectFeaturedCategories,
  selectHomeData,
} from "../../redux/features/home/homeSlice";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // UI State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const closeTimeout = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auth
  const accessToken = localStorage.getItem("access_token");

  // Redux state
  const loading = useAppSelector(selectHomeLoading);
  const categories = useAppSelector(selectFeaturedCategories);
  const homeData = useAppSelector(selectHomeData);

  // Fetch home data if not already loaded
  useEffect(() => {
    if (!homeData) {
      dispatch(fetchHomeData());
    }
  }, [dispatch, homeData]);

  // Preload category images (fixes hover flicker)
  useEffect(() => {
    categories.forEach((cat: any) => {
      if (cat.image_url) {
        const img = new Image();
        img.src = cat.image_url;
      }
      if (cat.subcategories) {
        cat.subcategories.forEach((sub: any) => {
          if (sub.image_url) {
            const img = new Image();
            img.src = sub.image_url;
          }
        });
      }
    });
  }, [categories]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleProfileClick = () => {
    if (!accessToken) navigate("/login");
    else setDropdownOpen(!dropdownOpen);
  };

  // Mega menu hover with delay
  const handleMouseEnter = (catId: string) => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setHoveredCat(catId);
  };

  const handleMouseLeave = () => {
    closeTimeout.current = window.setTimeout(() => setHoveredCat(null), 150);
  };

  return (
    <header className="w-full top-0 left-0 z-50 border-b border-gray-200 bg-white text-black sticky">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="logo">
          <Link to="/" className="text-lg md:text-xl font-bold whitespace-nowrap">
            RacketOutlet
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 relative">
          {loading ? (
            <Loader />
          ) : categories.length ? (
            <>
              {/* Category Titles */}
              {categories.map((cat: any) => (
                <div
                  key={cat.id}
                  onMouseEnter={() => handleMouseEnter(cat.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <h2 className="font-semibold text-base md:text-m hover:text-red-600 transition-colors cursor-pointer">
                    {cat.name}
                  </h2>
                </div>
              ))}

              {/* Mega Menu Dropdowns */}
              {categories.map(
                (cat: any) =>
                  cat.subcategories &&
                  cat.subcategories.length > 0 &&
                  hoveredCat === cat.id && (
                    <div
                      key={`dropdown-${cat.id}`}
                      className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 z-50"
                      onMouseEnter={() => handleMouseEnter(cat.id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div
                        className="w-[90vw] max-w-7xl border rounded-2xl shadow-2xl p-8 relative overflow-hidden"
                        style={{
                          background: cat.bgColor || undefined,
                        }}
                      >
                        {/* Optional background image */}
                        {cat.image_url && (
                          <div
                            className="absolute inset-0 bg-cover bg-center opacity-100 bg-white"
                            style={{ backgroundImage: `url(${cat.image_url})` }}
                          />
                        )}

                        {/* Main Layout: Subcategories | Description */}
                        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                          {/* Left: Subcategories */}
                          <div className="grid grid-cols-2 gap-6">
                            {cat.subcategories.map((sub: any) => (
                              <Link
                                key={sub.id}
                                to={`/subcategories/${sub.id}/products`}
                                className="flex flex-col items-center text-center bg-white bg-opacity-60 border hover:bg-red-50 hover:bg-opacity-90 rounded-xl p-4 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:-translate-y-1"
                              >
                                <img
                                  src={sub.image_url || "/default.png"}
                                  alt={sub.name}
                                  className="w-28 h-28 object-cover rounded-lg mb-3 border border-gray-200"
                                />
                                <span className="text-base font-medium text-gray-700 hover:text-red-600">
                                  {sub.name}
                                </span>
                              </Link>
                            ))}
                          </div>

                          {/* Right: Static description */}
                          <div className="flex flex-col justify-center items-center text-gray-800 px-6">
                            <h3 className="text-6xl md:text-5xl font-extrabold mb-3 text-center">
                              {cat.name}
                            </h3>
                            <p className="text-m text-black px-6 py-3 rounded-lg text-justify max-w-lg">
                              {cat.description ||
                                "Explore our exclusive range of products in this category."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
              )}
            </>
          ) : (
            <span className="text-gray-500">No categories</span>
          )}
        </nav>

        {/* Icons & Profile */}
        <div className="flex items-center space-x-4 relative">
          {/* Search */}
          <button className="text-lg md:text-xl" onClick={() => navigate("/search")}>
            <FontAwesomeIcon icon={faSearch} />
          </button>

          {/* Cart */}
          <Link to="/cart" className="text-lg md:text-xl">
            <FontAwesomeIcon icon={faShoppingCart} />
          </Link>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={handleProfileClick} className="text-lg md:text-xl flex items-center">
              <FontAwesomeIcon icon={faUser} />
            </button>
            {accessToken && dropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 md:w-48 bg-white border rounded shadow-lg flex flex-col text-left z-50">
                <Link
                  to="/orders"
                  className="px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-sm md:text-base"
                >
                  <FontAwesomeIcon icon={faShoppingCart} />
                  <span>Orders</span>
                </Link>
                <Link
                  to="/wishlist"
                  className="px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-sm md:text-base"
                >
                  <FontAwesomeIcon icon={faHeart} />
                  <span>Wishlist</span>
                </Link>
                <Link
                  to="/profile"
                  className="px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-sm md:text-base"
                >
                  <FontAwesomeIcon icon={faCog} />
                  <span>Account Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 hover:bg-gray-100 text-red-500 text-left text-sm md:text-base"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden text-xl" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <FontAwesomeIcon icon={mobileMenuOpen ? faXmark : faBars} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 left-0 w-64 h-full bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex flex-col space-y-4">
          {loading ? (
            <Loader />
          ) : categories.length ? (
            categories.map((cat) => (
              <div key={cat.id}>
                <Link
                  to={`/subcategories/${cat.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-medium text-sm hover:text-red-600 transition-colors block py-1"
                >
                  {cat.name}
                </Link>
                {cat.subcategories && cat.subcategories.length > 0 && (
                  <div className="pl-4 mt-1">
                    {cat.subcategories.map((sub: any) => (
                      <Link
                        key={sub.id}
                        to={`/subcategories/${sub.id}/products`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-1 text-sm text-gray-700 hover:text-red-600"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <span className="text-gray-500">No categories</span>
          )}

          {/* Mobile Profile / Auth Links */}
          {accessToken ? (
            <>
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1 hover:text-red-600 text-sm"
              >
                Orders
              </Link>
              <Link
                to="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1 hover:text-red-600 text-sm"
              >
                Wishlist
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1 hover:text-red-600 text-sm"
              >
                Account Settings
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="px-2 py-1 text-red-500 hover:text-red-600 text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                navigate("/login");
                setMobileMenuOpen(false);
              }}
              className="px-2 py-1 hover:text-red-600 text-sm"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import { useNavigate } from "react-router-dom";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import Loader from "../Loader";

import { fetchHomeData, selectBanners, selectHomeData } from "../../redux/features/home/homeSlice";
import { useAppDispatch, useAppSelector } from "../../redux/store";

const HeroBanners: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Select banners and loading state from Redux
  const banners = useAppSelector(selectBanners);
  const homeData = useAppSelector(selectHomeData);
  const loading = useAppSelector((state) => state.home.loading);

  // Force Slick slider refresh
  const [sliderKey, setSliderKey] = useState(0);

  // Fetch home data only if not already in Redux
  useEffect(() => {
    if (!homeData) {
      dispatch(fetchHomeData());
    }
  }, [dispatch, homeData]);

  useEffect(() => {
    if (banners.length > 0) setSliderKey((prev) => prev + 1);
  }, [banners]);

  const settings = {
    dots: true,
    infinite: true,
    speed: 1200,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2500,
    arrows: false,
    cssEase: "ease-in-out",
    pauseOnHover: true,
    appendDots: (dots: React.ReactNode) => (
      <div>
        <ul className="m-0 p-0 flex justify-center">{dots}</ul>
      </div>
    ),
  };

  const handleClick = (banner: typeof banners[0]) => {
    if (banner.product) navigate(`/products/${banner.product}`);
    else if (banner.subcategory) navigate(`/subcategories/${banner.subcategory}/products`);
  };

  if (loading) return <Loader />;

  if (banners.length === 0)
    return <p className="text-center py-16">No banners available.</p>;

  return (
    <div className="mb-8">
      <Slider key={sliderKey} {...settings}>
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="relative h-64 md:h-96 overflow-hidden rounded-lg cursor-pointer"
            onClick={() => handleClick(banner)}
          >
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex flex-col justify-end p-6">
              <h2 className="text-white text-3xl md:text-5xl font-bold">
                {banner.title}
              </h2>
              {banner.subtitle && <p className="text-white mt-2">{banner.subtitle}</p>}
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default HeroBanners;

import { FaHeadset, FaShippingFast, FaCheckCircle, FaLock } from "react-icons/fa";

const infoCards = [
  {
    icon: <FaHeadset className="text-2xl text-blue-600" />,
    title: "Customer Service",
    description: "Expert Help from Product Selection to Delivery Support",
  },
  {
    icon: <FaShippingFast className="text-2xl text-green-600" />,
    title: "Fast Free Shipping",
    description: "Free Shipping on Orders above ₹2000",
  },
  {
    icon: <FaCheckCircle className="text-2xl text-yellow-500" />,
    title: "100% Original",
    description: "Authenticity Guaranteed on all Products",
  },
  {
    icon: <FaLock className="text-2xl text-red-500" />,
    title: "Secure Payment",
    description: "Your payment information is processed securely",
  },
];

const InfoCards = () => (
  <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-center p-4">
    {infoCards.map((card, index) => (
      <div
        key={index}
        className="bg-white/60-800 p-4 rounded-md flex flex-col items-center space-y-2 text-black border" 
      >
        {card.icon}
        <h3 className="font-semibold">{card.title}</h3>
        <p className="text-sm">{card.description}</p>
      </div>
    ))}
  </div>
);

export default InfoCards;

const MovementSection = () => {
  return (
    <section className="flex flex-col md:flex-row items-center justify-between px-6 md:px-20 py-16 bg-white">
      {/* Left: Heading + Button */}
      <div className="md:w-1/2 mb-10 md:mb-0">
        <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900">
          More Than Just Gear,<br />
            <span>
            It's a <span className="underline decoration-yellow-300 decoration-4">Movement</span>
            </span>

        </h2>

<button
  className="mt-8 flex items-center gap-2 px-6 py-3 border border-black rounded-full text-black bg-white hover:bg-black hover:text-white transition-colors duration-300"
  aria-label="Learn more about our story"
  onClick={() => {
    const el = document.getElementById("about");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }}
>
  Our Story
  <span className="text-xl">→</span>
</button>

      </div>

      {/* Right: Description */}
      <div className="md:w-1/2 text-gray-700 text-lg leading-relaxed">
        <p>
          At RacketOutlet, we believe in empowering sports enthusiasts and athletes of all levels, fostering a vibrant sporting community. We provide top-tier gear, expert advice, and curated experiences to help you elevate your game. Join us in celebrating the passion and joy of sport.
        </p>
      </div>
    </section>
  );
};

export default MovementSection;


const PickleballBanner = () => (
  <div className="mb-8">
    <img
      src="https://placehold.co/1200x150/e2e8f0/e2e8f0?text=Airavat+Pickleball+Paddle"
      alt="Airavat pickleball paddle advertisement"
      className="w-full h-32 object-cover rounded-lg"
    />
  </div>
);

export default PickleballBanner;

// src/components/HomePage/ShopTheLook.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { addCartItemThunk, updateCartItemThunk } from "../../redux/features/cart/cartThunks";
import { selectShopTheLook } from "../../redux/features/home/homeSlice";
import type { ShopTheLook as ReduxShopTheLook, ShopHotspot } from "../../redux/features/home/homeSlice";

interface Product {
  id: number;
  name: string;
  price: number; // component expects number
  main_image_url: string;
  slug: string;
}

interface Hotspot {
  id: number;
  top: number;
  left?: number;
  right?: number;
  product: Product;
}

interface ShopTheLook {
  id: number;
  title: string;
  player_image: string;
  hotspots: Hotspot[];
}

const ShopTheLook: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const cart = useAppSelector((state) => state.cart.cart);

  const shopList = useAppSelector(selectShopTheLook); // ReduxShopTheLook[]
  const shopReduxData: ReduxShopTheLook | null = shopList?.[0] ?? null;

  // Convert Redux data to component-friendly types
  const shopData: ShopTheLook | null = shopReduxData
    ? {
        ...shopReduxData,
        hotspots: shopReduxData.hotspots.map((hotspot: ShopHotspot): Hotspot => ({
          ...hotspot,
          product: {
            ...hotspot.product,
            price: Number(hotspot.product.price), // convert string -> number
          },
        })),
      }
    : null;
    

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    shopData?.hotspots?.[0]?.product ?? null
  );
  const [loadingCart, setLoadingCart] = useState(false);

  useEffect(() => {
    const firstProduct = shopData?.hotspots?.[0]?.product ?? null;
    setSelectedProduct((prev) => {
      if (!prev && firstProduct) return firstProduct; // only set once
      return prev;
    });
  }, [shopData?.hotspots?.[0]?.product.id]);


  if (!shopData || !selectedProduct)
    return <p className="text-center text-gray-500 py-16">No Shop the Look data available.</p>;

  const cartItem = cart?.items?.find((item) => item.product.id === selectedProduct.id);

  const handleAddToCart = async () => {
    if (!user) return navigate("/login");

    try {
      setLoadingCart(true);
      if (cartItem?.id) {
        await dispatch(
          updateCartItemThunk({
            id: cartItem.id,
            product_id: selectedProduct.id,
            quantity: cartItem.quantity + 1,
          })
        ).unwrap();
      } else {
        await dispatch(addCartItemThunk({ product_id: selectedProduct.id, quantity: 1 })).unwrap();
      }
    } catch (err) {
      console.error("Cart update failed:", err);
    } finally {
      setLoadingCart(false);
    }
    console.log(shopData)
  };

  return (
    <div className="mb-8 w-full">
      <h2 className="text-xl font-semibold mb-4">{shopData.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
        {/* Player Image with hotspots */}
        <div className="relative border border-gray-200 rounded-lg overflow-hidden md:col-span-3 h-[650px]">
          <img
            src={shopData.player_image}

            alt="Player"
            className="w-full h-full object-cover"
          />
          {shopData.hotspots.map((hotspot) => (
            <div
              key={hotspot.id}
              onMouseEnter={() => setSelectedProduct(hotspot.product)}
              className="absolute w-4 h-4 bg-white border-2 border-black rounded-full cursor-pointer hover:scale-125 transition"
              style={{
                top: `${hotspot.top}px`,
                left: hotspot.left != null ? `${hotspot.left}px` : undefined,
                right: hotspot.right != null ? `${hotspot.right}px` : undefined,
              }}
            />
          ))}
        </div>

        {/* Selected Product */}
        <div className="border border-gray-200 text-black rounded-lg p-4 md:col-span-2 flex flex-col">
          <div
            className="flex flex-col cursor-pointer"
            onClick={() => navigate(`/products/${selectedProduct.id}`)}
          >
            <span className="block text-center mb-2">
              <span className="block text-sm tracking-widest text-gray-500 uppercase mb-1">
                Player’s Choice
              </span>
              <span className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-black text-transparent bg-clip-text">
                Shop the Look
              </span>
            </span>

            <img
              src={selectedProduct.main_image_url || "/default.png"}
              alt={selectedProduct.name}
              className="w-full h-full object-cover mb-5 rounded"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/default.png";
              }}
            />

            <h3 className="text-sm font-medium">{selectedProduct.name}</h3>
            <p className="text-xs text-gray-500">₹{selectedProduct.price}</p>
          </div>

          {/* Add to Cart / Go to Cart */}
          {cartItem ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate("/cart");
              }}
              className="flex-1 py-3 rounded-md bg-black text-white hover:bg-white hover:text-black hover:border transition mt-3"
            >
              Go to Cart
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              disabled={loadingCart}
              className={`text-xs py-2 px-4 rounded text-white transition mt-3 ${
                loadingCart ? "bg-gray-500 cursor-not-allowed" : "bg-black hover:bg-gray-800"
              }`}
            >
              {loadingCart ? "Adding..." : "Add to Cart"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopTheLook;

import { useState, useEffect } from "react";

const testimonials = [
  {
    quote:
      "I decided to buy a pair of Puma shoes from Instasport and my experience was wonderful.",
    author: "Aman, Delhi",
  },
  {
    quote:
      "The quality of the products exceeded my expectations. Fast delivery too!",
    author: "Sneha, Bangalore",
  },
  {
    quote:
      "Best sports gear store I’ve shopped at. Smooth checkout and great support.",
    author: "Ravi, Mumbai",
  },
  {
    quote:
      "Loved the variety of collections. I found everything I needed in one place.",
    author: "Priya, Hyderabad",
  },
];

const Testimonial = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 4000); // Auto slide every 4s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-auto bg-black text-white py-12 flex items-center justify-center">
      <div className="w-full max-w-3xl px-6 text-center">
        <blockquote className="text-xl md:text-2xl italic font-semibold transition-all duration-700 ease-in-out">
          “{testimonials[current].quote}”
        </blockquote>
        <p className="mt-4 text-gray-300 font-semibold">— {testimonials[current].author}</p>

        {/* Dots */}
        <div className="flex justify-center mt-6 space-x-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-3 h-3 rounded-full transition-all ${
                current === i ? "bg-white scale-110" : "bg-gray-500"
              }`}
            ></button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonial;

const TopBar = () => (
  <div className="bg-black text-white py-2 px-4 flex items-center justify-center relative overflow-hidden">
    {/* Instagram + YouTube top-left */}
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-4 z-10">
      {/* Instagram */}
      <a
        href="https://www.instagram.com/racketek?utm_source=ig_web_button_share_sheet&igsh=MWlneXZ5Y2U1em1ycQ=="
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="instagram-btn transition-all duration-300 transform hover:scale-110"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5Zm4.25 3.25a5.25 5.25 0 1 1 0 10.5 5.25 5.25 0 0 1 0-10.5Zm0 1.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Zm5.25-.88a.88.88 0 1 1-1.75 0 .88.88 0 0 1 1.75 0Z" />
        </svg>
      </a>

      {/* YouTube */}
      <a
        href="https://youtube.com/@racketek?si=wHSFyqpHjoaN-K_n"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="YouTube"
        className="youtube-btn transition-all duration-300 transform hover:scale-110"
      >
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a2.994 2.994 0 0 0-2.11-2.11C19.165 3.5 12 3.5 12 3.5s-7.165 0-9.388.576a2.994 2.994 0 0 0-2.11 2.11C0 8.414 0 12 0 12s0 3.586.502 5.814a2.994 2.994 0 0 0 2.11 2.11C4.835 20.5 12 20.5 12 20.5s7.165 0 9.388-.576a2.994 2.994 0 0 0 2.11-2.11C24 15.586 24 12 24 12s0-3.586-.502-5.814ZM9.545 15.568V8.432L15.909 12l-6.364 3.568Z"/>
        </svg>
      </a>
    </div>

    {/* Scrolling Message */}
    <div className="flex-1 flex justify-center overflow-hidden relative">
      <div className="animate-scroll whitespace-nowrap">
        Free shipping above 1000 &nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp; Weekend Sale Up to 60% Off
      </div>
    </div>

    <style>
      {`
        /* Scrolling text */
        @keyframes scroll {
          0% { transform: translateX(50%); }
          50% { transform: translateX(-100%); }
          100% { transform: translateX(50%); }
        }
        .animate-scroll {
          display: inline-block;
          animation: scroll 12s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }

        /* Instagram official gradient hover */
        .instagram-btn:hover svg path {
          fill: url(#instagramOfficialGradient);
        }

        /* YouTube hover (solid red) */
        .youtube-btn:hover svg path {
          fill: #ff0000;
        }
      `}
    </style>

    {/* Instagram official gradient definition */}
    <svg width="0" height="0">
      <defs>
        <linearGradient id="instagramOfficialGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#feda75"/>
          <stop offset="25%" stopColor="#fa7e1e"/>
          <stop offset="50%" stopColor="#d62976"/>
          <stop offset="75%" stopColor="#962fbf"/>
          <stop offset="100%" stopColor="#4f5bd5"/>
        </linearGradient>
      </defs>
    </svg>
  </div>
);

export default TopBar;

import React, { useRef, useEffect, useState } from "react";

const indicators = ["Authentic Products", "Best Prices", "Fast Shipping"];

const TrustIndicators: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [speed, setSpeed] = useState(50); // base speed (pixels/sec)
  const [direction, setDirection] = useState(-1); // -1 = left, 1 = right

  // Auto scrolling effect
  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();

    const scrollStep = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      const container = containerRef.current;
      if (container) {
        container.scrollLeft += (speed * direction * delta) / 1000;

        // Looping effect
        if (container.scrollLeft >= container.scrollWidth) {
          container.scrollLeft = 0;
        }
        if (container.scrollLeft <= 0) {
          container.scrollLeft = container.scrollWidth;
        }
      }

      animationFrame = requestAnimationFrame(scrollStep);
    };

    animationFrame = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animationFrame);
  }, [speed, direction]);

  // Wheel listener
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY < 0) {
        // scroll up → reverse
        setDirection(1);
        setSpeed(150);
      } else {
        // scroll down → forward faster
        setDirection(-1);
        setSpeed(150);
      }
      // reset after short burst
      setTimeout(() => setSpeed(50), 500);
    };
    window.addEventListener("wheel", handleWheel);
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-x-hidden whitespace-nowrap border-y bg-white py-10 leading-relaxed"
    >
      <div className="inline-flex items-center">
        {Array(15) // repeat to make it feel infinite
          .fill(indicators)
          .flat()
          .map((text, i, arr) => (
            <React.Fragment key={i}>
              <span className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-black bg-clip-text text-transparent mx-8 tracking-wide leading-[1.2]">
                {text}
              </span>

              {/* Add separator after each item except the last */}
              {i !== arr.length - 1 && (
                <span className="w-3 h-3 bg-white border border-black rounded-full mx-4 inline-block"></span>
              )}
            </React.Fragment>
          ))}
      </div>
    </div>
  );
};

export default TrustIndicators;

// src/components/HomepageVideos.tsx
import React, { useEffect, useRef, useState } from "react";
import Loader from "../Loader";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { fetchHomeData, selectVideos, selectHomeData } from "../../redux/features/home/homeSlice";

const HomepageVideos: React.FC = () => {
  const dispatch = useAppDispatch();

  // Redux state
  const videos = useAppSelector(selectVideos);
  const homeData = useAppSelector(selectHomeData);
  const loading = useAppSelector((state) => state.home.loading);

  // Local state for video refs and playing states
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [playingStates, setPlayingStates] = useState<{ [key: number]: boolean }>({});

  // Initialize playing states whenever videos change
  useEffect(() => {
    const initialState: { [key: number]: boolean } = {};
    videos.forEach((vid) => (initialState[vid.id] = true));
    setPlayingStates(initialState);
  }, [videos]);

  // Fetch home data only if Redux store is empty
  useEffect(() => {
    if (!homeData) {
      dispatch(fetchHomeData());
    }
  }, [dispatch, homeData]);

  const handlePlayPause = (id: number, index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.paused) {
      video.play();
      setPlayingStates((prev) => ({ ...prev, [id]: true }));
    } else {
      video.pause();
      setPlayingStates((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (loading) return <Loader />;
  if (videos.length === 0)
    return <p className="text-center py-16">No videos available.</p>;

  return (
    <div className="w-full">
      {videos.map((vid, index) => (
        <div
          key={vid.id}
          className="relative w-full h-screen overflow-hidden bg-black group mb-16"
        >
          <video
            ref={(el) => {
              videoRefs.current[index] = el;
            }}
            src={vid.video_url}
            className="absolute top-1/2 left-1/2 min-w-full min-h-[150vh] w-auto h-auto object-cover transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 group-hover:scale-105"
            autoPlay
            muted
            loop
            playsInline
          />

          <button
            onClick={() => handlePlayPause(vid.id, index)}
            className="absolute bottom-4 right-4 bg-white text-black rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-gray-200 transition-opacity duration-300 opacity-70 group-hover:opacity-100"
          >
            {playingStates[vid.id] ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                className="w-6 h-6"
              >
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                className="w-6 h-6"
              >
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            )}
          </button>
        </div>
      ))}
    </div>
  );
};

export default HomepageVideos;