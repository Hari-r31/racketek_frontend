"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Headphones, Plus, Clock, CheckCircle2, AlertCircle,
  MessageSquare, ChevronDown, ChevronUp, X, Send,
  Paperclip, ImagePlus, Trash2, Tag,
} from "lucide-react";
import api from "@/lib/api";
import type { SupportTicket, Order, TicketStatus } from "@/types";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  open:                 "bg-yellow-100 text-yellow-800",
  in_progress:          "bg-blue-100 text-blue-800",
  waiting_for_customer: "bg-orange-100 text-orange-800",
  resolved:             "bg-green-100 text-green-800",
  closed:               "bg-gray-100 text-gray-700",
};

const STATUS_LABELS: Record<string, string> = {
  open:                 "Open",
  in_progress:          "In Progress",
  waiting_for_customer: "Waiting for Your Reply",
  resolved:             "Resolved",
  closed:               "Closed",
};

const PRIORITY_STYLES: Record<string, string> = {
  low:    "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high:   "bg-red-100 text-red-700",
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

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

// ─────────────────────────────────────────────
// Image uploader util
// ─────────────────────────────────────────────
async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await api.post("/upload/support-image", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.url ?? res.data?.secure_url ?? "";
}

function ImageUploadRow({
  urls,
  onChange,
  max = MAX_IMAGES,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);

    // Validate
    for (const f of arr) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.error(`${f.name}: Only JPG/PNG files are allowed`);
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name}: Max file size is 5 MB`);
        return;
      }
    }
    if (urls.length + arr.length > max) {
      toast.error(`Maximum ${max} images allowed`);
      return;
    }

    setUploading(true);
    try {
      const uploaded = await Promise.all(arr.map(uploadImage));
      onChange([...urls, ...uploaded]);
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = (i: number) => onChange(urls.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {urls.map((url, i) => (
          <div key={i} className="relative group w-16 h-16">
            <img src={url} alt={`img-${i}`} className="w-full h-full object-cover rounded-lg border border-gray-200" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        {urls.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors disabled:opacity-60"
          >
            {uploading
              ? <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              : <><ImagePlus size={16} /><span className="text-[9px] mt-0.5">Add</span></>
            }
          </button>
        )}
      </div>
      <p className="text-[10px] text-gray-400">JPG/PNG · max 5 MB each · up to {max} images</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        className="hidden"
        onChange={e => { handleFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// New ticket form schema
// ─────────────────────────────────────────────
const schema = z.object({
  subject:  z.string().min(5, "Subject must be at least 5 characters"),
  message:  z.string().min(20, "Message must be at least 20 characters"),
  order_id: z.number().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});
type FormData = z.infer<typeof schema>;

// ─────────────────────────────────────────────
// Ticket card (user-facing)
// ─────────────────────────────────────────────
function TicketCard({ ticket, onUpdated }: { ticket: SupportTicket; onUpdated: () => void }) {
  const [open,        setOpen]        = useState(false);
  const [replyText,   setReplyText]   = useState("");
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [sending,     setSending]     = useState(false);
  const [closing,     setClosing]     = useState(false);

  const isClosed = ticket.status === "closed" || ticket.status === "resolved";

  const sendReply = async () => {
    if (!replyText.trim()) { toast.error("Reply cannot be empty"); return; }
    setSending(true);
    try {
      await api.post(`/support/${ticket.id}/reply`, {
        message:    replyText,
        image_urls: replyImages,
      });
      toast.success("Reply sent!");
      setReplyText("");
      setReplyImages([]);
      onUpdated();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async () => {
    if (!confirm("Close this ticket? You won't be able to reply after closing.")) return;
    setClosing(true);
    try {
      await api.post(`/support/${ticket.id}/close`);
      toast.success("Ticket closed");
      onUpdated();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to close ticket");
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-4 flex items-start justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {ticket.ticket_number && (
              <span className="font-mono text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                {ticket.ticket_number}
              </span>
            )}
            <p className="font-semibold text-gray-800 text-sm truncate">{ticket.subject}</p>
            <span className={`badge ${STATUS_STYLES[ticket.status] || "bg-gray-100 text-gray-700"}`}>
              {STATUS_LABELS[ticket.status] || ticket.status}
            </span>
            <span className={`badge ${PRIORITY_STYLES[ticket.priority] || ""}`}>
              {ticket.priority}
            </span>
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Clock size={11} />
            {formatDate(ticket.created_at)}
            {ticket.replies?.length > 0 && (
              <><span>·</span><MessageSquare size={10} /> {ticket.replies.length} replies</>
            )}
            {ticket.status === "waiting_for_customer" && (
              <span className="text-orange-600 font-semibold flex items-center gap-0.5">
                <AlertCircle size={10} /> Your reply needed
              </span>
            )}
          </p>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
      </button>

      {/* Expanded */}
      {open && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4 ">

          {/* Original message */}
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">Your Message</p>
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700 whitespace-pre-line">
              {ticket.message}
            </div>
            {ticket.image_urls?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {ticket.image_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener" className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 block hover:opacity-80 transition-opacity">
                    <img src={url} alt={`img-${i}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Thread replies */}
          {ticket.replies?.map(reply => (
            <div
              key={reply.id}
              className={`rounded-xl border p-3 text-sm ${
                reply.author_type === "admin"
                  ? "bg-brand-50 border-brand-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  reply.author_type === "admin"
                    ? "bg-brand-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}>
                  {reply.author_type === "admin" ? "Support" : "You"}
                </span>
                <span className="text-[10px] text-gray-400">{formatDate(reply.created_at)}</span>
              </div>
              <p className="text-gray-700 whitespace-pre-line">{reply.message}</p>
              {reply.image_urls?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {reply.image_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener" className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 block hover:opacity-80 transition-opacity">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Reply composer — only if not closed */}
          {!isClosed ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-600">Add Reply</p>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={3}
                placeholder="Write your reply…"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none bg-white"
              />
              <ImageUploadRow urls={replyImages} onChange={setReplyImages} />
              <div className="flex items-center gap-2">
                <button
                  onClick={sendReply}
                  disabled={sending}
                  className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
                >
                  {sending
                    ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Send size={12} />
                  }
                  {sending ? "Sending…" : "Send Reply"}
                </button>
                <button
                  onClick={closeTicket}
                  disabled={closing}
                  className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold px-3 py-2 rounded-xl transition-colors disabled:opacity-60"
                >
                  {closing
                    ? <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    : <X size={12} />
                  }
                  Close Ticket
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
              <CheckCircle2 size={14} className="text-green-500" />
              This ticket is {ticket.status}.
              {ticket.resolved_at && ` Resolved on ${formatDate(ticket.resolved_at)}.`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function SupportPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newTicketImages, setNewTicketImages] = useState<string[]>([]);

  const { data: tickets, isLoading, refetch } = useQuery<SupportTicket[]>({
    queryKey: ["support-tickets"],
    queryFn:  () => api.get("/support").then(r => r.data),
  });

  const { data: ordersData } = useQuery<{ items: Order[] }>({
    queryKey: ["orders-for-support"],
    queryFn:  () => api.get("/orders?per_page=20").then(r => r.data),
    enabled:  showForm,
  });

  const {
    register, handleSubmit, reset, setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "medium" },
  });

  const createTicket = useMutation({
    mutationFn: (data: FormData) =>
      api.post("/support", { ...data, image_urls: newTicketImages }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Ticket created! We'll respond within 24 hours.");
      reset();
      setNewTicketImages([]);
      setShowForm(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Failed to create ticket"),
  });

  const openCount     = tickets?.filter(t => t.status === "open" || t.status === "in_progress").length || 0;
  const waitingCount  = tickets?.filter(t => t.status === "waiting_for_customer").length || 0;
  const resolvedCount = tickets?.filter(t => t.status === "resolved" || t.status === "closed").length || 0;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-black text-gray-900 text-xl">Support Center</h2>
            <p className="text-sm text-gray-500 mt-0.5">Get help with your orders, products, and more</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "Cancel" : "New Ticket"}
          </button>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle size={14} className="text-amber-500" />
            <span className="text-gray-600">{openCount} open</span>
          </div>
          {waitingCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle size={14} className="text-orange-500" />
              <span className="text-orange-700 font-semibold">{waitingCount} awaiting your reply</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 size={14} className="text-green-500" />
            <span className="text-gray-600">{resolvedCount} resolved</span>
          </div>
          <div className="text-xs text-gray-400 ml-auto flex items-center gap-1">
            <Clock size={11} /> Avg response: ~24 hours
          </div>
        </div>
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <div className="card p-6">
          <h3 className="font-black text-gray-900 mb-5">Create Support Ticket</h3>

          {/* Quick subject chips */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">Quick Select Subject</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_SUBJECTS.map(s => (
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

          <form onSubmit={handleSubmit(d => createTicket.mutate(d))} className="space-y-4">
            <div>
              <label className="label">Subject *</label>
              <input {...register("subject")} className="input" placeholder="What is your issue about?" />
              {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Related Order <span className="text-gray-400">(optional)</span></label>
                <select {...register("order_id", { valueAsNumber: true })} className="input">
                  <option value="">— Not order-related —</option>
                  {ordersData?.items?.map(o => (
                    <option key={o.id} value={o.id}>{o.order_number}</option>
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
                placeholder="Please describe your issue in detail…"
              />
              {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
            </div>

            {/* Image upload */}
            <div>
              <label className="label flex items-center gap-1.5">
                <Paperclip size={12} /> Attach Images <span className="text-gray-400">(optional, up to 5)</span>
              </label>
              <ImageUploadRow urls={newTicketImages} onChange={setNewTicketImages} />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
              <strong>Tips for faster resolution:</strong> Include your order number, photos of any issues, and a clear description.
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={createTicket.isLoading} className="btn-primary flex-1">
                {createTicket.isLoading ? "Submitting…" : "Submit Ticket"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); setNewTicketImages([]); }} className="btn-outline flex-1">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ticket History */}
      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-black text-gray-900">Your Tickets</h3>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl" />)}
          </div>
        ) : !tickets?.length ? (
          <div className="p-12 text-center">
            <MessageSquare size={48} className="text-gray-200 mx-auto mb-4" />
            <h3 className="font-bold text-gray-700 mb-2">No support tickets</h3>
            <p className="text-gray-400 text-sm mb-6">Have an issue? Our team is happy to help!</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
              Create First Ticket
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {tickets.map(t => (
              <TicketCard key={t.id} ticket={t} onUpdated={refetch} />
            ))}
          </div>
        )}
      </div>

      {/* Contact info */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-800 mb-3">Other Ways to Reach Us</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {[
            { icon: "📧", title: "Email",  info: "support@racketek.com" },
            { icon: "📞", title: "Phone",  info: "+91 98765 43210" },
            { icon: "🕐", title: "Hours",  info: "Mon–Sat, 10am–7pm" },
          ].map(c => (
            <div key={c.title} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl">{c.icon}</span>
              <div>
                <p className="font-semibold text-gray-700">{c.title}</p>
                <p className="text-gray-500 text-xs">{c.info}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
