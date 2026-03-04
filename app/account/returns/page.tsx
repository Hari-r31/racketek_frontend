"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RotateCcw, ChevronRight, Clock, CheckCircle2, XCircle, Package } from "lucide-react";
import api from "@/lib/api";
import { Order, ReturnRequest } from "@/types";
import { formatDate, formatPrice, getStatusColor } from "@/lib/utils";
import toast from "react-hot-toast";

const returnSchema = z.object({
  order_id: z.number(),
  reason: z.string().min(10, "Please describe the reason in at least 10 characters"),
});
type ReturnForm = z.infer<typeof returnSchema>;

const RETURN_STATUS_COLOR: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  picked_up: "bg-purple-100 text-purple-800",
  refund_initiated: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
};

export default function ReturnsPage() {
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [view, setView] = useState<"my-returns" | "new-request">(
    searchParams.get("order") ? "new-request" : "my-returns"
  );
  const prefilledOrder = searchParams.get("order");

  // Fetch delivered orders eligible for return
  const { data: ordersData } = useQuery<{ items: Order[] }>({
    queryKey: ["eligible-return-orders"],
    queryFn: () => api.get("/orders?status=delivered&per_page=50").then((r) => r.data),
    enabled: view === "new-request",
  });

  // Fetch my existing return requests
  const { data: returns, isLoading } = useQuery<ReturnRequest[]>({
    queryKey: ["my-returns"],
    queryFn: () => api.get("/returns").then((r) => r.data),
    enabled: view === "my-returns",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReturnForm>({
    resolver: zodResolver(returnSchema),
    defaultValues: prefilledOrder
      ? { reason: "" }
      : undefined,
  });

  const submitReturn = useMutation({
    mutationFn: (data: ReturnForm) => api.post("/returns", data),
    onSuccess: () => {
      toast.success("Return request submitted! We'll review it within 24 hours.");
      qc.invalidateQueries({ queryKey: ["my-returns"] });
      qc.invalidateQueries({ queryKey: ["eligible-return-orders"] });
      qc.invalidateQueries({ queryKey: ["orders"] }); // order list status may update
      qc.invalidateQueries({ queryKey: ["orders-recent"] }); // profile page recent orders
      reset();
      setView("my-returns");
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Failed to submit return"),
  });

  const deliveredOrders = ordersData?.items || [];

  return (
    <div className="space-y-4">
      {/* Header + Tabs */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-gray-900 text-xl">Returns & Refunds</h2>
          <button
            onClick={() => setView(view === "my-returns" ? "new-request" : "my-returns")}
            className={view === "my-returns" ? "btn-primary text-sm" : "btn-outline text-sm"}
          >
            {view === "my-returns" ? "Request Return" : "My Returns"}
          </button>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setView("my-returns")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              view === "my-returns"
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            My Returns
          </button>
          <button
            onClick={() => setView("new-request")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              view === "new-request"
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            New Request
          </button>
        </div>
      </div>

      {/* ── My Returns ──────────────────────────────────────────────── */}
      {view === "my-returns" && (
        <div className="card">
          {isLoading ? (
            <div className="p-6 space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-xl" />
              ))}
            </div>
          ) : !returns?.length ? (
            <div className="p-12 text-center">
              <RotateCcw size={48} className="text-gray-200 mx-auto mb-4" />
              <h3 className="font-bold text-gray-700 mb-2">No return requests</h3>
              <p className="text-gray-400 text-sm mb-6">
                You haven't requested any returns yet. Returns are available within 7 days of delivery.
              </p>
              <button onClick={() => setView("new-request")} className="btn-primary text-sm">
                Request a Return
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {returns.map((r) => (
                <div key={r.id} className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800 text-sm">
                          Return #{r.id}
                        </span>
                        <span className={`badge ${RETURN_STATUS_COLOR[r.status] || "bg-gray-100 text-gray-700"}`}>
                          {r.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        <Clock size={11} className="inline mr-1" />
                        Submitted {formatDate(r.created_at)}
                      </p>
                    </div>
                    {r.status === "approved" && (
                      <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                        <CheckCircle2 size={14} /> Approved
                      </div>
                    )}
                    {r.status === "rejected" && (
                      <div className="flex items-center gap-1 text-red-500 text-xs font-medium">
                        <XCircle size={14} /> Rejected
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-800">Reason: </span>
                      {r.reason}
                    </p>
                    {r.admin_notes && (
                      <p className="text-gray-600 mt-2 border-t border-gray-200 pt-2">
                        <span className="font-medium text-gray-800">Admin note: </span>
                        {r.admin_notes}
                      </p>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="flex items-center gap-2 mt-3">
                    {["requested", "approved", "picked_up", "refund_initiated", "completed"].map(
                      (step, i, arr) => {
                        const statuses = ["requested", "approved", "picked_up", "refund_initiated", "completed"];
                        const currentIdx = statuses.indexOf(r.status);
                        const stepIdx = statuses.indexOf(step);
                        const done = stepIdx <= currentIdx;
                        return (
                          <div key={step} className="flex items-center flex-1">
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                                  done ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-400"
                                }`}
                              >
                                {done ? "✓" : ""}
                              </div>
                              <p className="text-xs text-gray-400 text-center w-16 mt-0.5 capitalize">
                                {step.replace("_", " ")}
                              </p>
                            </div>
                            {i < arr.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-0.5 ${done && stepIdx < currentIdx ? "bg-brand-600" : "bg-gray-200"}`} />
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── New Return Request ───────────────────────────────────────── */}
      {view === "new-request" && (
        <div className="card p-6">
          <h3 className="font-black text-gray-900 mb-2">New Return Request</h3>
          <p className="text-sm text-gray-500 mb-6">
            Returns are accepted within <strong>7 days</strong> of delivery. Refunds are processed within 5–7 business days.
          </p>

          {deliveredOrders.length === 0 ? (
            <div className="text-center py-10">
              <Package size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No eligible delivered orders found.</p>
              <p className="text-gray-400 text-xs mt-1">Only delivered orders within 7 days are eligible for return.</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit((d) => submitReturn.mutate(d))}
              className="space-y-5"
            >
              <div>
                <label className="label">Select Order *</label>
                <select {...register("order_id", { valueAsNumber: true })} className="input">
                  <option value="">— Select an order —</option>
                  {deliveredOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} — {formatPrice(o.total_amount)} — {formatDate(o.created_at)}
                    </option>
                  ))}
                </select>
                {errors.order_id && <p className="text-xs text-red-500 mt-1">Please select an order</p>}
              </div>

              <div>
                <label className="label">Reason for Return *</label>
                <textarea
                  {...register("reason")}
                  rows={4}
                  className="input resize-none"
                  placeholder="Please describe the issue in detail — defective product, wrong item received, damaged during delivery, etc."
                />
                {errors.reason && (
                  <p className="text-xs text-red-500 mt-1">{errors.reason.message}</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                <p className="font-semibold mb-1">📋 Return Policy</p>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                  <li>Items must be unused and in original packaging</li>
                  <li>Return requests must be submitted within 7 days of delivery</li>
                  <li>Refunds are processed within 5–7 business days after pickup</li>
                  <li>Shipping charges are non-refundable for non-defective returns</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitReturn.isPending}
                  className="btn-primary flex-1"
                >
                  {submitReturn.isPending ? "Submitting..." : "Submit Return Request"}
                </button>
                <button
                  type="button"
                  onClick={() => { setView("my-returns"); reset(); }}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
