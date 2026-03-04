"use client";
import { Headphones, Truck, ShieldCheck, Lock } from "lucide-react";
import { motion } from "framer-motion";

const CARDS = [
  {
    icon: Headphones,
    title: "Customer Service",
    description: "Available 7 days a week. We're here to help with any queries.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Truck,
    title: "Free Shipping",
    description: "Free delivery on all orders above ₹1000 across India.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: ShieldCheck,
    title: "100% Original",
    description: "Every product is certified authentic. No counterfeits, ever.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Lock,
    title: "Secure Payment",
    description: "Your payment is encrypted and 100% secure on every transaction.",
    color: "bg-purple-50 text-purple-600",
  },
];

export default function InfoCards() {
  return (
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
