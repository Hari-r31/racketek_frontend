"use client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, CreditCard, Banknote, MapPin, Plus } from "lucide-react";
import api from "@/lib/api";
import { Cart, Address, Order } from "@/types";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/uiStore";
import Link from "next/link";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { setCount } = useCartStore();
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: cart } = useQuery<Cart>({
    queryKey: ["cart"],
    queryFn: () => api.get("/cart").then((r) => r.data),
    enabled: isAuthenticated,
  });

  const { data: addresses } = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: () => api.get("/addresses").then((r) => r.data),
    enabled: isAuthenticated,
    onSuccess: (data) => {
      const def = data.find((a) => a.is_default);
      if (def) setSelectedAddress(def.id);
      else if (data.length > 0) setSelectedAddress(data[0].id);
    },
  });

  const placeOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }
    setLoading(true);

    try {
      // Create order
      const { data: order }: { data: Order } = await api.post("/orders", {
        address_id: selectedAddress,
        payment_method: paymentMethod,
        notes,
      });

      if (paymentMethod === "cod") {
        await api.post("/payments/cod/confirm", { order_id: order.id });
        toast.success("Order placed successfully!");
        setCount(0);
        router.push(`/account/orders/${order.order_number}`);
        return;
      }

      // Razorpay flow
      const ok = await loadRazorpay();
      if (!ok) {
        toast.error("Failed to load payment gateway");
        setLoading(false);
        return;
      }

      const { data: rzOrder } = await api.post("/payments/razorpay/create-order", {
        order_id: order.id,
      });

      const options = {
        key: rzOrder.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: rzOrder.amount,
        currency: rzOrder.currency,
        name: "Racketek Outlet",
        description: `Order #${order.order_number}`,
        order_id: rzOrder.razorpay_order_id,
        handler: async (response: any) => {
          try {
            await api.post("/payments/razorpay/verify", {
              order_id: order.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Payment successful! Order confirmed.");
            setCount(0);
            router.push(`/account/orders/${order.order_number}`);
          } catch {
            toast.error("Payment verification failed. Contact support.");
          }
        },
        prefill: {
          name: user?.full_name,
          email: user?.email,
          contact: user?.phone,
        },
        theme: { color: "#ea580c" },
        modal: {
          ondismiss: () => {
            toast.error("Payment cancelled");
            setLoading(false);
          },
        },
      };

      const rzInstance = new window.Razorpay(options);
      rzInstance.open();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to place order");
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-black text-gray-800 mb-4">Please Login to Checkout</h2>
        <Link href="/auth/login" className="btn-primary">Login</Link>
      </div>
    );
  }

  const activeItems = cart?.items?.filter((i) => !i.save_for_later) || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Address + Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-gray-900 flex items-center gap-2">
                <MapPin size={18} className="text-brand-600" />
                Delivery Address
              </h2>
              <Link href="/account/addresses" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                <Plus size=12 /> Add New
              </Link>
            </div>

            {!addresses || addresses.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm mb-3">No addresses found</p>
                <Link href="/account/addresses" className="btn-primary text-sm">Add Address</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                      selectedAddress === addr.id
                        ? "border-brand-600 bg-brand-50"
                        : "border-gray-200 hover:border-brand-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddress === addr.id}
                      onChange={() => setSelectedAddress(addr.id)}
                      className="mt-1 text-brand-600"
                    />
                    <div>
                      <p className="font-semibold text-sm text-gray-800">
                        {addr.full_name}
                        {addr.is_default && (
                          <span className="ml-2 badge bg-brand-100 text-brand-700">Default</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        {addr.address_line1}
                        {addr.address_line2 && `, ${addr.address_line2}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-sm text-gray-500">📞 {addr.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="card p-6">
            <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-brand-600" />
              Payment Method
            </h2>

            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                paymentMethod === "razorpay" ? "border-brand-600 bg-brand-50" : "border-gray-200 hover:border-brand-300"
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "razorpay"}
                  onChange={() => setPaymentMethod("razorpay")}
                  className="text-brand-600"
                />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-7 bg-blue-100 rounded flex items-center justify-center">
                    <CreditCard size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Razorpay</p>
                    <p className="text-xs text-gray-500">Cards, UPI, Net Banking, Wallets</p>
                  </div>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                paymentMethod === "cod" ? "border-brand-600 bg-brand-50" : "border-gray-200 hover:border-brand-300"
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="text-brand-600"
                />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-7 bg-green-100 rounded flex items-center justify-center">
                    <Banknote size={14} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Cash on Delivery</p>
                    <p className="text-xs text-gray-500">Pay when your order arrives</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-800 mb-3">Order Notes (Optional)</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any special instructions for your order..."
              className="input resize-none"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="card p-6 h-fit">
          <h2 className="font-black text-gray-900 mb-5">Order Summary</h2>

          {/* Items */}
          <div className="space-y-3 mb-5 max-h-48 overflow-y-auto">
            {activeItems.map((item) => {
              const price = item.product.price + (item.variant?.price_modifier || 0);
              return (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate mr-2">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="font-medium shrink-0">{formatPrice(price * item.quantity)}</span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatPrice(cart?.subtotal || 0)}</span>
            </div>
            {(cart?.discount_amount || 0) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>−{formatPrice(cart?.discount_amount || 0)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span>
                {(cart?.shipping_cost || 0) === 0 ? (
                  <span className="text-green-600 font-medium">FREE</span>
                ) : (
                  formatPrice(cart?.shipping_cost || 0)
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">GST</span>
              <span>{formatPrice(cart?.tax_amount || 0)}</span>
            </div>
            <div className="flex justify-between font-black text-base border-t border-gray-200 pt-3">
              <span>Total</span>
              <span className="text-brand-600">{formatPrice(cart?.total_amount || 0)}</span>
            </div>
          </div>

          <button
            onClick={placeOrder}
            disabled={loading || activeItems.length === 0}
            className="btn-primary w-full mt-5 flex items-center justify-center gap-2 text-base py-3"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <>
                <ShieldCheck size={18} />
                {paymentMethod === "cod" ? "Place Order (COD)" : "Pay Now"}
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            🔒 Your payment is 100% secure
          </p>
        </div>
      </div>
    </div>
  );
}
