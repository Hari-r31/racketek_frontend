"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ChevronLeft, ChevronRight, Search, Package, Truck,
  CheckCircle, XCircle, RotateCcw, Clock, Eye, X,
  ExternalLink, MapPin, RefreshCw, AlertTriangle,
  ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import api from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks";
import toast from "react-hot-toast";

type SortDir = "asc" | "desc";
interface SortState { field: string; dir: SortDir; }

function SortTh({
  label, field, sort, onSort,
}: {
  label: string; field: string; sort: SortState; onSort: (f: string) => void;
}) {
  const active = sort.field === field;
  return (
    <th
      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none group"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        <span className={active ? "text-brand-600" : ""}>{label}</span>
        <span className="text-gray-300 group-hover:text-gray-500 transition-colors">
          {active
            ? sort.dir === "asc"
              ? <ChevronUp size={12} className="text-brand-600" />
              : <ChevronDown size={12} className="text-brand-600" />
            : <ChevronsUpDown size={12} />}
        </span>
      </div>
    </th>
  );
}

const STATUSES = [
  { value: "",                key: "all",           label: "All Orders",       color: "bg-gray-100 text-gray-700" },
  { value: "pending",         key: "pending",        label: "Pending",          color: "bg-yellow-100 text-yellow-800" },
  { value: "paid",            key: "paid",           label: "Paid",             color: "bg-blue-100 text-blue-800" },
  { value: "processing",      key: "processing",     label: "Processing",       color: "bg-indigo-100 text-indigo-800" },
  { value: "shipped",         key: "shipped",        label: "Shipped",          color: "bg-cyan-100 text-cyan-800" },
  { value: "out_for_delivery",key: "ofd",            label: "Out for Delivery", color: "bg-purple-100 text-purple-800" },
  { value: "delivered",       key: "delivered",      label: "Delivered",        color: "bg-green-100 text-green-800" },
  { value: "cancelled",       key: "cancelled",      label: "Cancelled",        color: "bg-red-100 text-red-800" },
  { value: "returned",        key: "returned",       label: "Returned",         color: "bg-orange-100 text-orange-800" },
  { value: "refunded",        key: "refunded",       label: "Refunded",         color: "bg-pink-100 text-pink-800" },
];

const STATUS_FLOW = ["pending","paid","processing","shipped","out_for_delivery","delivered"];

const CARRIERS = [
  "Delhivery", "Bluedart", "DTDC", "Ekart", "Amazon Shipping",
  "FedEx", "DHL", "Xpressbees", "Shadowfax", "Shiprocket",
];

function StatusBadge({ status }: { status: string }) {
  const s = STATUSES.find(x => x.value === status) || STATUSES[0];
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>{s.label || status}</span>;
}

// ── Order Detail Panel ──────────────────────────────────────────────────────
function OrderDetail({ orderId, onClose }: { orderId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"details" | "tracking" | "shipment">("details");
  const [shipForm, setShipForm] = useState({ carrier: "Delhivery", tracking_number: "", carrier_tracking_url: "", estimated_delivery: "" });
  const [addingShipment, setAddingShipment] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", orderId],
    queryFn: () => api.get(`/admin/orders/${orderId}`).then(r => r.data),
  });

  const { data: tracking, refetch: refetchTracking, isFetching: trackingLoading } = useQuery({
    queryKey: ["order-tracking", orderId],
    queryFn: () => api.get(`/admin/orders/${orderId}/tracking`).then(r => r.data),
    enabled: tab === "tracking",
  });

  const invalidateOrder = () => {
    qc.invalidateQueries({ queryKey: ["admin-order", orderId] });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    // Customer-facing: their order list + detail pages update too
    qc.invalidateQueries({ queryKey: ["orders"] });
    qc.invalidateQueries({ queryKey: ["order", orderId] });
  };

  const statusMut = useMutation({
    mutationFn: (status: string) => api.patch(`/admin/orders/${orderId}/status`, { status }),
    onSuccess: () => { toast.success("Status updated"); invalidateOrder(); },
    onError: () => toast.error("Update failed"),
  });

  const shipmentMut = useMutation({
    mutationFn: (data: any) => api.post(`/admin/orders/${orderId}/shipment`, data),
    onSuccess: () => { toast.success("Shipment details saved — order marked as Shipped"); invalidateOrder(); setAddingShipment(false); },
    onError: () => toast.error("Failed to save shipment"),
  });

  if (isLoading || !order) return (
    <div className="flex items-center justify-center h-full py-20">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const currentIdx = STATUS_FLOW.indexOf(order.status);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-lg font-bold text-gray-900">{order.order_number}</h2>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-gray-500">{formatDate(order.created_at)} · {order.user?.full_name || "Unknown"} · {order.user?.email}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Status pipeline */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-0">
          {STATUS_FLOW.map((s, i) => {
            const done = currentIdx >= i;
            const current = currentIdx === i;
            const label = STATUSES.find(x => x.value === s)?.label || s;
            return (
              <div key={s} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => { if (!done) statusMut.mutate(s); }}
                    title={`Set to ${label}`}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                      current ? "border-brand-600 bg-brand-600 text-white shadow-md" :
                      done    ? "border-green-500 bg-green-500 text-white" :
                                "border-gray-300 bg-white text-gray-400 hover:border-brand-400"
                    }`}>
                    {done ? <CheckCircle size={14} /> : i + 1}
                  </button>
                  <span className={`text-[10px] mt-1 font-medium text-center leading-tight max-w-[60px] ${current ? "text-brand-600" : done ? "text-green-600" : "text-gray-400"}`}>
                    {label}
                  </span>
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-5 ${done && i < currentIdx ? "bg-green-400" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
        {/* Quick actions for non-flow statuses */}
        <div className="flex gap-2 mt-3">
          {order.status !== "cancelled" && (
            <button onClick={() => { if (confirm("Cancel this order? Stock will be restored.")) statusMut.mutate("cancelled"); }}
              className="flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
              <XCircle size={12} /> Cancel Order
            </button>
          )}
          {order.status === "delivered" && (
            <button onClick={() => statusMut.mutate("returned")}
              className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors">
              <RotateCcw size={12} /> Mark Returned
            </button>
          )}
          {order.status === "returned" && (
            <button onClick={() => statusMut.mutate("refunded")}
              className="flex items-center gap-1 text-xs text-pink-600 bg-pink-50 border border-pink-200 px-3 py-1.5 rounded-lg hover:bg-pink-100 transition-colors">
              <RefreshCw size={12} /> Mark Refunded
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6">
        {(["details","tracking","shipment"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
            {t === "shipment" ? "Add Shipment" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === "details" && (
          <div className="space-y-6">
            {/* Order items */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3">Order Items</h3>
              <div className="space-y-2">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                      {item.product?.primary_image_url && <img src={item.product.primary_image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.product_name}</p>
                      {item.variant_name && <p className="text-xs text-gray-500">{item.variant_name}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{formatPrice(item.total_price)}</p>
                      <p className="text-xs text-gray-500">×{item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Financials */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              {order.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(order.discount_amount)}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{order.shipping_cost === 0 ? "Free" : formatPrice(order.shipping_cost)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax (GST)</span><span>{formatPrice(order.tax_amount)}</span></div>
              <div className="flex justify-between font-bold text-base border-t border-gray-300 pt-2"><span>Total</span><span>{formatPrice(order.total_amount)}</span></div>
            </div>
            {/* Address */}
            {order.shipping_address && (
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><MapPin size={13} /> Delivery Address</h3>
                <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 border border-gray-200 leading-relaxed">
                  <p className="font-semibold text-gray-900">{order.shipping_address.full_name}</p>
                  <p>{order.shipping_address.address_line1}{order.shipping_address.address_line2 ? `, ${order.shipping_address.address_line2}` : ""}</p>
                  <p>{order.shipping_address.city}, {order.shipping_address.state} – {order.shipping_address.pincode}</p>
                  <p>{order.shipping_address.phone}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "tracking" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700">Live Tracking</h3>
              <button onClick={() => refetchTracking()} disabled={trackingLoading}
                className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium">
                <RefreshCw size={12} className={trackingLoading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
            {trackingLoading ? (
              <div className="flex items-center justify-center py-10"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : tracking ? (
              <div className="space-y-3">
                <div className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm">
                  <div><span className="text-gray-500">Carrier: </span><span className="font-semibold">{tracking.carrier || "—"}</span></div>
                  <div><span className="text-gray-500">AWB: </span><span className="font-mono font-semibold">{tracking.tracking_number || "—"}</span></div>
                  {tracking.carrier_tracking_url && (
                    <a href={tracking.carrier_tracking_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium">
                      <ExternalLink size={12} /> Track on courier site
                    </a>
                  )}
                </div>
                {tracking.events?.length > 0 ? (
                  <div className="space-y-0">
                    {tracking.events.map((ev: any, i: number) => (
                      <div key={i} className="flex gap-4 pl-2">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full border-2 mt-1 shrink-0 ${i === 0 ? "border-brand-600 bg-brand-600" : "border-gray-300 bg-white"}`} />
                          {i < tracking.events.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                        </div>
                        <div className="pb-4">
                          <p className="text-xs text-gray-400">{ev.timestamp}</p>
                          <p className="text-sm font-semibold text-gray-800">{ev.status}</p>
                          {ev.description && <p className="text-xs text-gray-500">{ev.description}</p>}
                          {ev.location && <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{ev.location}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-400">
                    <Truck size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No tracking events yet</p>
                    <p className="text-xs mt-1">Events appear once the courier picks up the parcel</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400">
                <AlertTriangle size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No shipment assigned yet</p>
                <p className="text-xs mt-1">Add shipment details in the "Add Shipment" tab</p>
              </div>
            )}
          </div>
        )}

        {tab === "shipment" && (
          <div className="space-y-5">
            <p className="text-sm text-gray-500">Enter courier and AWB details. Saving will automatically mark the order as <strong>Shipped</strong>.</p>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Courier Partner <span className="text-red-500">*</span></label>
              <select value={shipForm.carrier} onChange={e => setShipForm(p => ({ ...p, carrier: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-500">
                {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">AWB / Tracking Number <span className="text-red-500">*</span></label>
              <input type="text" value={shipForm.tracking_number} onChange={e => setShipForm(p => ({ ...p, tracking_number: e.target.value }))}
                placeholder="e.g. 1234567890123" className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Tracking URL <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="text" value={shipForm.carrier_tracking_url} onChange={e => setShipForm(p => ({ ...p, carrier_tracking_url: e.target.value }))}
                placeholder="https://www.delhivery.com/track/package/…" className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Estimated Delivery Date <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="date" value={shipForm.estimated_delivery} onChange={e => setShipForm(p => ({ ...p, estimated_delivery: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-500" />
            </div>
            <button onClick={() => shipmentMut.mutate(shipForm)} disabled={!shipForm.tracking_number || shipmentMut.isLoading}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50">
              {shipmentMut.isLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <><Truck size={15} /> Save Shipment & Mark Shipped</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Orders Page ────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [sort, setSort] = useState<SortState>({ field: "created_at", dir: "desc" });

  // Fire API only after 400 ms of inactivity
  const search = useDebounce(searchInput, 400);

  const handleSort = (field: string) => {
    setSort(prev =>
      prev.field === field
        ? { field, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { field, dir: field === "created_at" ? "desc" : "asc" }
    );
    setPage(1);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", page, status, search, sort],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), per_page: "20" });
      if (status)     p.set("status", status);
      if (search)     p.set("search", search);
      if (sort.field) p.set("sort",   `${sort.field}_${sort.dir}`);
      return api.get(`/admin/orders?${p.toString()}`).then(r => r.data);
    },
  });

  const quickStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      api.patch(`/admin/orders/${orderId}/status`, { status }),
    onSuccess: (_, { orderId }) => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-order", orderId] });
      // Customer sees their order status update immediately too
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", orderId] });
    },
    onError: () => toast.error("Update failed"),
  });

  // Count per status for tab badges
  const statusCounts = data?.status_counts || {};

  return (
    <div className="flex gap-0 -mx-6 -my-6 h-screen overflow-hidden">

      {/* ── Orders table ─────────────────────────────────────────────────── */}
      <div className={`flex flex-col flex-1 min-w-0 transition-all ${selectedOrder ? "max-w-[calc(100%-440px)]" : ""}`}>
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-900">Orders</h1>
          <div className="flex-1 flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Order number, name…" value={searchInput}
                onChange={e => { setSearchInput(e.target.value); setPage(1); }}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
              {searchInput && searchInput !== search && (
                <span className="text-xs text-brand-500 ml-1">searching…</span>
              )}
            </div>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="shrink-0 bg-white border-b border-gray-200 px-6 flex gap-1 overflow-x-auto no-scrollbar">
          {STATUSES.map(s => (
            <button key={s.key} onClick={() => { setStatus(s.value); setPage(1); }}
              className={`shrink-0 px-3 py-3 text-xs font-semibold border-b-2 transition-colors ${
                status === s.value ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}>
              {s.label}
              {statusCounts[s.value] > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${status === s.value ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                  {statusCounts[s.value]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
              <tr>
                <SortTh label="Order"    field="order_number"  sort={sort} onSort={handleSort} />
                <SortTh label="Customer" field="customer_name" sort={sort} onSort={handleSort} />
                <SortTh label="Date"     field="created_at"    sort={sort} onSort={handleSort} />
                <SortTh label="Total"    field="total_amount"  sort={sort} onSort={handleSort} />
                <SortTh label="Status"   field="status"        sort={sort} onSort={handleSort} />
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                [...Array(12)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(6)].map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded" /></td>)}
                  </tr>
                ))
              ) : data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">
                    <Package size={32} className="mx-auto mb-3 opacity-30" />
                    <p>No orders found</p>
                  </td>
                </tr>
              ) : data?.items?.map((order: any) => {
                const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
                return (
                  <tr key={order.id}
                    onClick={() => setSelectedOrder(order.id === selectedOrder ? null : order.id)}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${selectedOrder === order.id ? "bg-brand-50" : ""}`}>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-gray-900">{order.order_number}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-800 truncate max-w-[130px]">{order.user?.full_name || "—"}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[130px]">{order.user?.email}</p>
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-xs">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-4 font-bold text-gray-900">{formatPrice(order.total_amount)}</td>
                    <td className="px-4 py-4"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      {nextStatus && (
                        <button onClick={() => quickStatus.mutate({ orderId: order.id, status: nextStatus })}
                          className="text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3 py-1.5 rounded-lg transition-colors capitalize">
                          → {STATUSES.find(s => s.value === nextStatus)?.label}
                        </button>
                      )}
                      {order.status === "paid" && !nextStatus && (
                        <button onClick={() => quickStatus.mutate({ orderId: order.id, status: "processing" })}
                          className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors">
                          → Processing
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.total_pages > 1 && (
          <div className="shrink-0 flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-white">
            <p className="text-xs text-gray-500">
              {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total} orders
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages}
                className="p-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Order detail side panel ───────────────────────────────────────── */}
      {selectedOrder && (
        <div className="w-[440px] shrink-0 bg-white border-l border-gray-200 dark:border-[rgb(var(--border-2))] flex flex-col h-full overflow-hidden">
          <OrderDetail orderId={selectedOrder} onClose={() => setSelectedOrder(null)} />
        </div>
      )}
    </div>
  );
}
