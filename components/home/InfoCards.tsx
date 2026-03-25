"use client";
import { Headphones, Truck, ShieldCheck, Lock } from "lucide-react";
import { motion } from "framer-motion";

/**
 * DARK MODE FIX:
 * Icon containers use hardcoded semantic bg colors (bg-blue-50, bg-orange-50,
 * bg-green-50, bg-purple-50) with their matching text colors.
 * - bg-blue-50 / bg-orange-50 / bg-green-50 → covered by globals.css overrides
 * - bg-purple-50 → NOT covered by globals; add dark: variant directly
 * - text-purple-600 → NOT covered by globals; add dark: variant directly
 * Section bg-white + card bg-gray-50 border-gray-100 → covered by global overrides.
 */

const CARDS = [
  {
    icon: Headphones,
    title: "Customer Service",
    description: "Available 7 days a week. We're here to help with any queries.",
    // blue-50 + blue-600 → globals handle bg-blue-50; text-blue-600 has global override
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Truck,
    title: "Free Shipping",
    description: "Free delivery on all orders above ₹1000 across India.",
    // orange-50 + orange-600 → globals handle both
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: ShieldCheck,
    title: "100% Original",
    description: "Every product is certified authentic. No counterfeits, ever.",
    // green-50 + green-600 → globals handle both
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Lock,
    title: "Secure Payment",
    description: "Your payment is encrypted and 100% secure on every transaction.",
    // FIX: purple-50 and text-purple-600 not in globals → use dark: variants
    color: "bg-purple-50 dark:bg-[rgb(25_8_45)] text-purple-600 dark:text-purple-400",
  },
];

export default function InfoCards() {
  return (
    /* FIX: bg-white border-gray-100 → covered by global */
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              /* FIX: bg-gray-50 border-gray-100 hover:border-gray-200 → covered by global */
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div className={`w-12 h-12 rounded-2xl ${card.color} flex items-center justify-center mb-4`}>
                <card.icon size={22} />
              </div>
              <h3 className="font-black text-gray-900 mb-2">{card.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{card.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
