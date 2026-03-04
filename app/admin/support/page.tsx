"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Headphones, Clock, CheckCircle2, AlertCircle, MessageSquare,
  Search, Filter, Send, User, X, ExternalLink, ShieldAlert,
  ShieldCheck, Shield, TrendingUp, Package, RotateCcw, DollarSign,
  ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, Ban, Inbox,
} from "lucide-react";
import api from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { useDebounce } from "@/lib/hooks";
import type {
  SupportTicket, AdminTicketDetail, CustomerRiskSummary,
  OrderSummaryRow, TicketStatus,
} from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_LIGHT: Record<string, string> = {
  open:                 "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress:          "bg-blue-100 text-blue-800 border-blue-200",
  waiting_for_customer: "bg-orange-100 text-orange-800 border-orange-200",
  resolved:             "bg-green-100 text-green-800 border-green-200",
  closed:               "bg-gray-100 text-gray-600 border-gray-200",
};
const STATUS_DARK: Record<string, string> = {
  open:                 "dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
  in_progress:          "dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  waiting_for_customer: "dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
  resolved:             "dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
  closed:               "dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
};
const STATUS_LABELS: Record<string, string> = {
  open:                 "Open",
  in_progress:          "In Progress",
  waiting_for_customer: "Waiting for Customer",
  resolved:             "Resolved",
  closed:               "Closed",
};

const PRIORITY_LIGHT: Record<string, string> = {
  low:    "bg-gray-100 text-gray-600 border-gray-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  high:   "bg-red-100 text-red-700 border-red-200",
};
const PRIORITY_DARK: Record<string, string> = {
  low:    "dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
  medium: "dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  high:   "dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
};

function statusCls(s: string) {
  return `${STATUS_LIGHT[s] || "bg-gray-100 text-gray-600 border-gray-200"} ${STATUS_DARK[s] || "dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"}`;
}
function priorityCls(p: string) {
  return `${PRIORITY_LIGHT[p] || "bg-gray-100 text-gray-600 border-gray-200"} ${PRIORITY_DARK[p] || "dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"}`;
}

const RISK_CONFIG = {
  low:    { icon: ShieldCheck, textCls: "text-green-600 dark:text-green-400",  bgCls: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700",  label: "Low Risk" },
  medium: { icon: Shield,      textCls: "text-amber-600 dark:text-amber-400",  bgCls: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700",  label: "Medium Risk" },
  high:   { icon: ShieldAlert, textCls: "text-red-600 dark:text-red-400",      bgCls: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700",          label: "High Risk" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Risk badge
// ─────────────────────────────────────────────────────────────────────────────

function RiskBadge({ tier, reason }: { tier: string; reason: string }) {
  const cfg  = RISK_CONFIG[tier as keyof typeof RISK_CONFIG] ?? RISK_CONFIG.low;
  const Icon = cfg.icon;
  return (
    <span title={reason} className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.bgCls} ${cfg.textCls}`}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer summary panel
// ─────────────────────────────────────────────────────────────────────────────

function CustomerSummaryPanel({ summary }: { summary: CustomerRiskSummary }) {
  const cfg = RISK_CONFIG[summary.risk_tier as keyof typeof RISK_CONFIG] ?? RISK_CONFIG.low;

  const stats = [
    { label: "Total Orders",  value: summary.total_orders,        icon: Package,    color: "text-blue-500" },
    { label: "Cancellations", value: summary.total_cancellations, icon: Ban,        color: "text-orange-500" },
    { label: "Returns",       value: summary.total_returns,       icon: RotateCcw,  color: "text-yellow-500" },
    { label: "Refunds",       value: summary.total_refunds,       icon: DollarSign, color: "text-purple-500" },
  ];

  return (
    <div className={`rounded-xl border p-4 ${cfg.bgCls}`}>
      {/* Header row */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-gray-900 dark:text-gray-100 text-sm">{summary.full_name}</h3>
            <RiskBadge tier={summary.risk_tier} reason={summary.risk_reason} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{summary.email}</p>
          {summary.phone && <p className="text-xs text-gray-500 dark:text-gray-400">{summary.phone}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-400 dark:text-gray-500">Member since</p>
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{formatDate(summary.member_since)}</p>
          {summary.last_order_date && (
            <>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Last order</p>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{formatDate(summary.last_order_date)}</p>
            </>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {stats.map(({ label, value, icon: StatIcon, color }) => (
          <div key={label} className="bg-white/70 dark:bg-gray-800/60 rounded-lg p-2.5 text-center border border-white/80 dark:border-gray-700/50">
            <StatIcon size={14} className={`${color} mx-auto mb-0.5`} />
            <p className="text-lg font-black text-gray-900 dark:text-gray-100">{value}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Lifetime spend */}
      <div className="flex items-center justify-between bg-white/70 dark:bg-gray-800/60 rounded-lg px-3 py-2 border border-white/80 dark:border-gray-700/50">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-brand-500" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Lifetime Spend</span>
        </div>
        <span className="text-sm font-black text-brand-600 dark:text-brand-400">{formatPrice(summary.lifetime_value)}</span>
      </div>

      {/* Risk reason */}
      {summary.risk_tier !== "low" && (
        <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${cfg.textCls}`}>
          <AlertTriangle size={11} />
          {summary.risk_reason}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Order history table
// ─────────────────────────────────────────────────────────────────────────────

function OrderHistoryTable({ orders, linkedOrderId }: { orders: OrderSummaryRow[]; linkedOrderId?: number }) {
  if (!orders.length) return (
    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No order history</p>
  );
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
            <th className="text-left px-3 py-2 font-bold text-gray-500 dark:text-gray-400">Order</th>
            <th className="text-left px-3 py-2 font-bold text-gray-500 dark:text-gray-400">Status</th>
            <th className="text-right px-3 py-2 font-bold text-gray-500 dark:text-gray-400">Amount</th>
            <th className="text-right px-3 py-2 font-bold text-gray-500 dark:text-gray-400">Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} className={`border-b border-gray-100 dark:border-gray-700/50 last:border-0 transition-colors ${
              o.id === linkedOrderId
                ? "bg-brand-50 dark:bg-brand-900/20"
                : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
            }`}>
              <td className="px-3 py-2">
                <Link href={`/admin/orders?id=${o.id}`}
                  className="text-brand-600 dark:text-brand-400 hover:underline font-bold flex items-center gap-1">
                  {o.order_number}<ExternalLink size={9} />
                </Link>
                {o.id === linkedOrderId && (
                  <span className="text-[9px] text-brand-500 dark:text-brand-400 font-semibold">← this ticket</span>
                )}
              </td>
              <td className="px-3 py-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${statusCls(o.status)}`}>
                  {o.status}
                </span>
              </td>
              <td className="px-3 py-2 text-right font-bold text-gray-800 dark:text-gray-200">{formatPrice(o.total_amount)}</td>
              <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">{formatDate(o.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reply thread
// ─────────────────────────────────────────────────────────────────────────────

function ReplyThread({ ticket }: { ticket: SupportTicket }) {
  return (
    <div className="space-y-3">
      {/* Original message */}
      <div className="flex gap-2.5">
        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 text-xs font-black text-gray-600 dark:text-gray-300 mt-0.5">
          {ticket.user?.full_name?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{ticket.user?.full_name || "Customer"}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatDate(ticket.created_at)}</span>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl rounded-tl-sm p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {ticket.message}
          </div>
          {(ticket.image_urls?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {ticket.image_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener"
                  className="block w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Thread replies */}
      {ticket.replies?.map(reply => (
        <div key={reply.id} className={`flex gap-2.5 ${reply.author_type === "admin" ? "flex-row-reverse" : ""}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black mt-0.5 ${
            reply.author_type === "admin"
              ? "bg-brand-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          }`}>
            {reply.author_type === "admin" ? "S" : (reply.author_name?.[0]?.toUpperCase() || "U")}
          </div>
          <div className="flex-1 max-w-[80%]">
            <div className={`flex items-center gap-2 mb-1 ${reply.author_type === "admin" ? "justify-end" : ""}`}>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatDate(reply.created_at)}</span>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {reply.author_type === "admin" ? "Racketek Support" : reply.author_name || "Customer"}
              </span>
            </div>
            <div className={`border rounded-xl p-3 text-sm whitespace-pre-line ${
              reply.author_type === "admin"
                ? "bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-700 text-gray-700 dark:text-gray-300 rounded-tr-sm"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-tl-sm"
            }`}>
              {reply.message}
            </div>
            {(reply.image_urls?.length ?? 0) > 0 && (
              <div className={`flex flex-wrap gap-2 mt-2 ${reply.author_type === "admin" ? "justify-end" : ""}`}>
                {reply.image_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener"
                    className="block w-14 h-14 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ticket detail drawer
// ─────────────────────────────────────────────────────────────────────────────

function TicketDetailDrawer({ ticketId, onClose, onUpdate }: {
  ticketId: number;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const qc = useQueryClient();
  const [replyText,   setReplyText]   = useState("");
  const [newStatus,   setNewStatus]   = useState<TicketStatus>("in_progress");
  const [newPriority, setNewPriority] = useState("medium");
  const [sending,     setSending]     = useState(false);

  const { data, isLoading } = useQuery<AdminTicketDetail>({
    queryKey: ["admin-ticket-detail", ticketId],
    queryFn:  () => api.get(`/support/admin/${ticketId}`).then(r => r.data),
    staleTime: 0,
  });

  // Sync status/priority selectors when ticket data loads
  useEffect(() => {
    if (!data) return;
    setNewStatus(data.ticket.status as TicketStatus);
    setNewPriority(data.ticket.priority);
  }, [data]);

  const sendReply = async () => {
    if (!replyText.trim()) { toast.error("Reply cannot be empty"); return; }
    setSending(true);
    try {
      await api.put(`/support/admin/${ticketId}/reply`, {
        message: replyText, status: newStatus, priority: newPriority,
      });
      toast.success("Reply sent & ticket updated");
      setReplyText("");
      qc.invalidateQueries({ queryKey: ["admin-ticket-detail", ticketId] });
      onUpdate();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const selectCls = "border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-end"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col overflow-hidden">

        {/* ── Drawer header ── */}
        <div className="shrink-0 px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-900">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={18} />
          </button>
          {data ? (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-gray-900 dark:text-gray-100 text-sm truncate">{data.ticket.subject}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCls(data.ticket.status)}`}>
                  {STATUS_LABELS[data.ticket.status] || data.ticket.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex-wrap">
                {data.ticket.ticket_number && (
                  <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{data.ticket.ticket_number}</span>
                )}
                <span>·</span>
                <Clock size={10} /><span>{formatDate(data.ticket.created_at)}</span>
                {data.ticket.order_id && (
                  <>
                    <span>·</span>
                    <Link href={`/admin/orders?id=${data.ticket.order_id}`}
                      className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5">
                      Order #{data.ticket.order_id}<ExternalLink size={9} />
                    </Link>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50 dark:bg-gray-900">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
          ) : data ? (
            <>
              <section>
                <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Customer Overview</h4>
                <CustomerSummaryPanel summary={data.customer_summary} />
              </section>
              <section>
                <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Order History</h4>
                <OrderHistoryTable orders={data.order_history} linkedOrderId={data.ticket.order_id} />
              </section>
              <section>
                <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Conversation</h4>
                <ReplyThread ticket={data.ticket} />
              </section>
            </>
          ) : null}
        </div>

        {/* ── Reply composer pinned to bottom ── */}
        <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            rows={3}
            placeholder="Write your reply to the customer…"
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value as TicketStatus)} className={selectCls}>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_for_customer">Waiting for Customer</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Priority</label>
              <select value={newPriority} onChange={e => setNewPriority(e.target.value)} className={selectCls}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button
              onClick={sendReply}
              disabled={sending}
              className="ml-auto flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
            >
              {sending
                ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Send size={12} />
              }
              {sending ? "Sending…" : "Send Reply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ticket list row
// ─────────────────────────────────────────────────────────────────────────────

function TicketRow({ ticket, onOpen }: { ticket: SupportTicket; onOpen: () => void }) {
  return (
    <div
      onClick={onOpen}
      className="border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer transition-all group bg-white dark:bg-gray-800/30"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          {ticket.ticket_number && (
            <span className="font-mono text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-1.5 py-0.5 rounded">
              {ticket.ticket_number}
            </span>
          )}
          <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{ticket.subject}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
          <span className="flex items-center gap-1"><User size={10} />{ticket.user?.full_name || `User #${ticket.user_id}`}</span>
          <span className="flex items-center gap-1"><Clock size={10} />{formatDate(ticket.created_at)}</span>
          {ticket.order_id && (
            <span className="text-brand-500 dark:text-brand-400 font-medium">Order #{ticket.order_id}</span>
          )}
          {(ticket.replies?.length ?? 0) > 0 && (
            <span className="flex items-center gap-1"><MessageSquare size={10} />{ticket.replies.length}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityCls(ticket.priority)}`}>
          {ticket.priority}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCls(ticket.status)}`}>
          {STATUS_LABELS[ticket.status] || ticket.status}
        </span>
        <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminSupportPage() {
  const qc = useQueryClient();
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page,         setPage]         = useState(1);
  const [selectedId,   setSelectedId]   = useState<number | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, refetch } = useQuery<{
    items: SupportTicket[];
    total: number;
    total_pages: number;
  }>({
    queryKey: ["admin-support-tickets", statusFilter, page, debouncedSearch],
    queryFn: () => api.get("/support/admin", {
      params: {
        page,
        per_page: 20,
        status:  statusFilter !== "all" ? statusFilter : undefined,
        search:  debouncedSearch || undefined,
      },
    }).then(r => r.data),
    staleTime: 30_000,
    keepPreviousData: true,
  });

  // Separate query for stats — always fetches all statuses regardless of active filter
  const { data: statsData } = useQuery<{
    items: SupportTicket[];
    total: number;
  }>({
    queryKey: ["admin-support-stats"],
    queryFn: () => api.get("/support/admin", {
      params: { page: 1, per_page: 500 },
    }).then(r => r.data),
    staleTime: 30_000,
  });

  const tickets    = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;
  const total      = data?.total ?? 0;

  const allTickets = statsData?.items ?? [];
  const stats = {
    open:        allTickets.filter(t => t.status === "open").length,
    in_progress: allTickets.filter(t => t.status === "in_progress").length,
    waiting:     allTickets.filter(t => t.status === "waiting_for_customer").length,
    resolved:    allTickets.filter(t => t.status === "resolved").length,
  };

  const filterBtnCls = (active: boolean) =>
    `text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
      active
        ? "bg-brand-600 text-white"
        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
    }`;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Headphones size={24} className="text-brand-600" />
            Support Tickets
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} total · Manage and respond to customer support requests
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Open",                 value: stats.open,        icon: AlertCircle,  light: "bg-yellow-50 text-yellow-700",  dark: "dark:bg-yellow-900/20 dark:text-yellow-300" },
          { label: "In Progress",          value: stats.in_progress, icon: MessageSquare,light: "bg-blue-50 text-blue-700",     dark: "dark:bg-blue-900/20 dark:text-blue-300" },
          { label: "Waiting for Customer", value: stats.waiting,     icon: Clock,        light: "bg-orange-50 text-orange-700", dark: "dark:bg-orange-900/20 dark:text-orange-300" },
          { label: "Resolved",             value: stats.resolved,    icon: CheckCircle2, light: "bg-green-50 text-green-700",   dark: "dark:bg-green-900/20 dark:text-green-300" },
        ].map(({ label, value, icon: Icon, light, dark }) => (
          <div key={label} className={`${light} ${dark} rounded-xl p-4 border border-transparent`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} />
              <p className="text-xs font-medium opacity-80">{label}</p>
            </div>
            <p className="text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search ticket #, subject, customer…"
            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} className="text-gray-400" />
          {["all", "open", "in_progress", "waiting_for_customer", "resolved", "closed"].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={filterBtnCls(statusFilter === s)}
            >
              {s === "all" ? "All" : STATUS_LABELS[s] || s}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket list */}
      <div>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-16 text-center">
            <Inbox size={40} className="text-gray-200 dark:text-gray-600 mx-auto mb-3" />
            <p className="font-bold text-gray-600 dark:text-gray-400">No tickets found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {search || statusFilter !== "all" ? "Try adjusting your filters" : "No support tickets yet"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 font-medium">
              Showing {tickets.length} of {total} tickets
            </p>
            <div className="space-y-2">
              {tickets.map(t => (
                <TicketRow key={t.id} ticket={t} onOpen={() => setSelectedId(t.id)} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium px-2">
                  Page {page} of {totalPages}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40">
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail drawer */}
      {selectedId !== null && (
        <TicketDetailDrawer
          ticketId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdate={() => {
            refetch();
            qc.invalidateQueries({ queryKey: ["admin-ticket-detail", selectedId] });
            qc.invalidateQueries({ queryKey: ["admin-support-stats"] });
          }}
        />
      )}
    </div>
  );
}
