"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Star, ThumbsUp, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { Review } from "@/types";
import { formatDate, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

interface Props {
  productId: number;
  productSlug: string;
}

const schema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  title: z.string().min(3, "Title too short").max(100),
  body: z.string().min(10, "Review must be at least 10 characters"),
});
type FormData = z.infer<typeof schema>;

function StarRating({
  value,
  onChange,
  readonly = false,
  size = 16,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  const display = readonly ? value : (hover || value);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={readonly ? "cursor-default" : "cursor-pointer"}
        >
          <Star
            size={size}
            className={
              star <= display
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300 fill-gray-300"
            }
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-gray-500">{label}</span>
      <Star size={10} className="text-yellow-400 fill-yellow-400 shrink-0" />
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-gray-500">{count}</span>
    </div>
  );
}

interface ReviewsData {
  reviews: Review[];
  total: number;
  avg_rating: number;
  rating_breakdown: Record<string, number>;
}

// Extended review with user info
interface ReviewWithUser extends Review {
  user?: { full_name: string };
}

export default function ReviewSection({ productId, productSlug }: Props) {
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);

  const { data, isLoading } = useQuery<ReviewsData>({
    queryKey: ["reviews", productId],
    queryFn: () => api.get(`/reviews/${productId}`).then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const submitReview = useMutation({
    mutationFn: (formData: FormData) =>
      api.post(`/reviews/${productId}`, { ...formData, rating: selectedRating }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
      qc.invalidateQueries({ queryKey: ["product", productSlug] });
      toast.success("Review submitted! Thank you 🎉");
      reset();
      setSelectedRating(0);
      setShowForm(false);
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.detail || "Failed to submit review"),
  });

  const reviews: ReviewWithUser[] = (data?.reviews as ReviewWithUser[]) || [];
  const avgRating = data?.avg_rating || 0;
  const total = data?.total || 0;
  const breakdown = data?.rating_breakdown || {};

  return (
    <div className="mt-14" id="reviews">
      <h2 className="text-xl font-black text-gray-900 mb-6">
        Customer Reviews
        {total > 0 && <span className="text-gray-400 font-normal text-base ml-2">({total})</span>}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* ── Summary ─────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="card p-6 text-center mb-4">
            <p className="text-5xl font-black text-gray-900">{avgRating.toFixed(1)}</p>
            <StarRating value={Math.round(avgRating)} readonly size={20} />
            <p className="text-sm text-gray-500 mt-2">{total} review{total !== 1 ? "s" : ""}</p>
          </div>
          {total > 0 && (
            <div className="card p-4 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <RatingBar
                  key={star}
                  label={star}
                  count={breakdown[star] || 0}
                  total={total}
                />
              ))}
            </div>
          )}

          {/* Write review button */}
          <div className="mt-4">
            {isAuthenticated ? (
              <button
                onClick={() => setShowForm(!showForm)}
                className="w-full btn-primary text-sm py-2.5"
              >
                {showForm ? "Cancel Review" : "Write a Review"}
              </button>
            ) : (
              <p className="text-sm text-center text-gray-500">
                <a href="/auth/login" className="text-brand-600 hover:underline font-medium">
                  Log in
                </a>{" "}
                to write a review
              </p>
            )}
          </div>
        </div>

        {/* ── Reviews List ────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Write Review Form */}
          {showForm && (
            <div className="card p-5 border-brand-200 border">
              <h3 className="font-bold text-gray-900 mb-4">Your Review</h3>
              <form
                onSubmit={handleSubmit((d) => {
                  if (selectedRating === 0) {
                    toast.error("Please select a star rating");
                    return;
                  }
                  submitReview.mutate(d);
                })}
                className="space-y-4"
              >
                <div>
                  <label className="label">Rating *</label>
                  <StarRating value={selectedRating} onChange={setSelectedRating} size={24} />
                  {selectedRating === 0 && submitReview.isError && (
                    <p className="text-xs text-red-500 mt-1">Please select a rating</p>
                  )}
                </div>
                <div>
                  <label className="label">Review Title *</label>
                  <input
                    {...register("title")}
                    className="input"
                    placeholder="Summarize your experience"
                  />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="label">Review *</label>
                  <textarea
                    {...register("body")}
                    rows={4}
                    className="input resize-none"
                    placeholder="Tell others about your experience with this product..."
                  />
                  {errors.body && <p className="text-xs text-red-500 mt-1">{errors.body.message}</p>}
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitReview.isLoading}
                    className="btn-primary flex-1"
                  >
                    {submitReview.isLoading ? "Submitting..." : "Submit Review"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); reset(); setSelectedRating(0); }}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reviews */}
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-gray-200 rounded-full" />
                    <div className="space-y-1">
                      <div className="h-3 bg-gray-200 rounded w-24" />
                      <div className="h-3 bg-gray-200 rounded w-16" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="card p-10 text-center">
              <Star size={40} className="text-gray-200 mx-auto mb-3" />
              <h3 className="font-bold text-gray-700 mb-2">No reviews yet</h3>
              <p className="text-gray-400 text-sm">
                Be the first to review this product!
              </p>
            </div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="card p-5">
                {/* Reviewer info */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-bold">
                      {getInitials(r.user?.full_name || "U")}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {r.user?.full_name || "Verified Customer"}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(r.created_at)}</p>
                    </div>
                  </div>
                  {r.is_verified_purchase && (
                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle2 size={12} />
                      Verified Purchase
                    </div>
                  )}
                </div>

                <StarRating value={r.rating} readonly size={14} />

                {r.title && (
                  <h4 className="font-bold text-gray-800 mt-2 mb-1">{r.title}</h4>
                )}
                {r.body && (
                  <p className="text-sm text-gray-600 leading-relaxed">{r.body}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
