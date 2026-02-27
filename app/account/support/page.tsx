"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Headphones, Plus, Clock, CheckCircle2, AlertCircle,
  MessageSquare, ChevronDown, ChevronUp, X,
} from "lucide-react";
import api from "@/lib/api";
import { SupportTicket, Order } from "@/types";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

const schema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Message must be at least 20 characters"),
  order_id: z.number().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});
type FormData = z.infer<typeof schema>;

const STATUS_STYLES: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-700",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-red-100 text-red-700",
};

const COMMON_SUBJECTS = [
  "Order not received",
  "Wrong item delivered",
  "Damaged product",
  "Refund not received",
  "Change delivery address",
  "Cancel my order",
  "Product quality issue",
  "Tracking not updating",
];

function TicketCard({ ticket }: { ticket: SupportTicket }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-gray-800 text-sm truncate">{ticket.subject}</p>
            <span className={`badge ${STATUS_STYLES[ticket.status] || "bg-gray-100 text-gray-700"}`}>
              {ticket.status.replace("_", " ")}
            </span>
            <span className={`badge ${PRIORITY_STYLES[ticket.priority] || ""}`}>
              {ticket.priority}
            </span>
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={11} /> {formatDate(ticket.created_at)} · Ticket #{ticket.id}
          </p>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50 space-y-4">
          {/* Your message */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Your Message</p>
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-line">
              {ticket.message}
            </div>
          </div>

          {/* Admin reply */}
          {ticket.admin_reply ? (
            <div>
              <p className="text-xs font-semibold text-brand-600 mb-2 flex items-center gap-1">
                <Headphones size={11} /> Racketek Support Response
              </p>
              <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-line">
                {ticket.admin_reply}
              </div>
              {ticket.resolved_at && (
                <p className="text-xs text-gray-400 mt-1">
                  Resolved on {formatDate(ticket.resolved_at)}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
              <Clock size={14} className="text-amber-500" />
              Awaiting response from our support team. We typically respond within 24 hours.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: tickets, isLoading } = useQuery<SupportTicket[]>({
    queryKey: ["support-tickets"],
    queryFn: () => api.get("/support").then((r) => r.data),
  });

  const { data: ordersData } = useQuery<{ items: Order[] }>({
    queryKey: ["orders-for-support"],
    queryFn: () => api.get("/orders?per_page=20").then((r) => r.data),
    enabled: showForm,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "medium" },
  });

  const createTicket = useMutation({
    mutationFn: (data: FormData) => api.post("/support", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Support ticket created! We'll respond within 24 hours.");
      reset();
      setShowForm(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Failed to create ticket"),
  });

  const openCount = tickets?.filter((t) => t.status === "open" || t.status === "in_progress").length || 0;
  const resolvedCount = tickets?.filter((t) => t.status === "resolved" || t.status === "closed").length || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-black text-gray-900 text-xl">Support Center</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Get help with your orders, products, and more
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "Cancel" : "New Ticket"}
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle size={14} className="text-amber-500" />
            <span className="text-gray-600">{openCount} open</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 size={14} className="text-green-500" />
            <span className="text-gray-600">{resolvedCount} resolved</span>
          </div>
          <div className="text-xs text-gray-400 ml-auto flex items-center gap-1">
            <Clock size={11} /> Avg response: ~24 hours
          </div>
        </div>
      </div>

      {/* ── New Ticket Form ──────────────────────────────────────────── */}
      {showForm && (
        <div className="card p-6">
          <h3 className="font-black text-gray-900 mb-5">Create Support Ticket</h3>

          {/* Quick subject chips */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">Quick Select Subject</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_SUBJECTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setValue("subject", s)}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-brand-100 hover:text-brand-700 rounded-full transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit((d) => createTicket.mutate(d))} className="space-y-4">
            <div>
              <label className="label">Subject *</label>
              <input
                {...register("subject")}
                className="input"
                placeholder="What is your issue about?"
              />
              {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Related Order <span className="text-gray-400">(optional)</span></label>
                <select {...register("order_id", { valueAsNumber: true })} className="input">
                  <option value="">— Not order-related —</option>
                  {ordersData?.items?.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select {...register("priority")} className="input">
                  <option value="low">Low — General inquiry</option>
                  <option value="medium">Medium — Order issue</option>
                  <option value="high">High — Urgent problem</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Message *</label>
              <textarea
                {...register("message")}
                rows={5}
                className="input resize-none"
                placeholder="Please describe your issue in detail. Include order numbers, product names, or any relevant information..."
              />
              {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
              <strong>Tips for faster resolution:</strong> Include your order number, photos of any issues, and a clear description of what went wrong.
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={createTicket.isPending} className="btn-primary flex-1">
                {createTicket.isPending ? "Submitting..." : "Submit Ticket"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); }} className="btn-outline flex-1">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Ticket History ───────────────────────────────────────────── */}
      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-black text-gray-900">Your Tickets</h3>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-xl" />
            ))}
          </div>
        ) : !tickets?.length ? (
          <div className="p-12 text-center">
            <MessageSquare size={48} className="text-gray-200 mx-auto mb-4" />
            <h3 className="font-bold text-gray-700 mb-2">No support tickets</h3>
            <p className="text-gray-400 text-sm mb-6">
              Have an issue? Create a ticket and our team will help you!
            </p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
              Create First Ticket
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {tickets.map((t) => (
              <TicketCard key={t.id} ticket={t} />
            ))}
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-800 mb-3">Other Ways to Reach Us</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-2xl">📧</span>
            <div>
              <p className="font-semibold text-gray-700">Email</p>
              <p className="text-gray-500">support@racketek.com</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-2xl">📞</span>
            <div>
              <p className="font-semibold text-gray-700">Phone</p>
              <p className="text-gray-500">+91 98765 43210</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-2xl">🕐</span>
            <div>
              <p className="font-semibold text-gray-700">Hours</p>
              <p className="text-gray-500">Mon–Sat, 10am–7pm</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
