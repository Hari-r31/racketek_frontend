"use client";
/**
 * ReviewSection.tsx
 *
 * Purchase gate:
 * - "Write a Review" button only appears if user_has_purchased === true
 * - If logged in but NOT a buyer → show "Purchase this product to leave a review"
 * - If already reviewed → show "You have already reviewed this product"
 * - Backend enforces the same rule (403 if not a buyer) as a double-guard
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Star, CheckCircle2, ShoppingBag, Lock } from "lucide-react";
import api from "@/lib/api";
import { Review } from "@/types";
import { formatDate, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import Link from "next/link";

interface Props {
  productId: number;
  productSlug: string;
}

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  body:  z.string().min(10, "Review must be at least 10 characters"),
});
type FormData = z.infer<typeof schema>;

// ── Star Rating Widget ────────────────────────────────────────────────────────
function StarRating({
  value, onChange, readonly = false, size = 16,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  const display = readonly ? value : hover || value;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star} type="button" disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={readonly ? "cursor-default" : "cursor-pointer hover:scale-110 transition-transform"}
        >
          <Star
            size={size}
            className={star <= display ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-300"}
          />
        </button>
      ))}
    </div>
  );
}

// ── Rating Bar ────────────────────────────────────────────────────────────────
function RatingBar({ label, count, total }: { label: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-gray-500 shrink-0">{label}</span>
      <Star size={10} className="text-yellow-400 fill-yellow-400 shrink-0" />
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-gray-500 shrink-0">{count}</span>
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────
interface ReviewUser { id: number; full_name: string; }
interface ReviewWithUser extends Review { user?: ReviewUser; }
interface ReviewsData {
  items: ReviewWithUser[];
  total: number;
  page: number;
  per_page: number;
  avg_rating: number;
  rating_breakdown: Record<number, number>;
  user_has_purchased: boolean;   // true only if user has a DELIVERED order with this product
  user_has_reviewed: boolean;    // true if user already submitted a review
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ReviewSection({ productId, productSlug }: Props) {
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const [showForm,       setShowForm]       = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingError,    setRatingError]    = useState(false);

  const { data, isLoading } = useQuery<ReviewsData>({
    queryKey: ["reviews", productId],
    queryFn: () => api.get(`/reviews/${productId}`).then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const submitReview = useMutation({
    mutationFn: (formData: FormData) =>
      api.post(`/reviews`, {
        product_id: productId,
        rating:     selectedRating,
        title:      formData.title,
        body:       formData.body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
      qc.invalidateQueries({ queryKey: ["product", productSlug] });
      toast.success("Review submitted! Thank you 🎉");
      reset();
      setSelectedRating(0);
      setRatingError(false);
      setShowForm(false);
    },
    onError: (e: any) => {
      const detail = e.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Failed to submit review. Please try again.");
    },
  });

  const onSubmit = (formData: FormData) => {
    if (selectedRating === 0) { setRatingError(true); toast.error("Please select a star rating"); return; }
    setRatingError(false);
    submitReview.mutate(formData);
  };

  const reviews   = data?.items ?? [];
  const avgRating = data?.avg_rating ?? 0;
  const total     = data?.total ?? 0;
  const breakdown = data?.rating_breakdown ?? {};

  // Purchase gate flags — from server
  const userHasPurchased = data?.user_has_purchased ?? false;
  const userHasReviewed  = data?.user_has_reviewed  ?? false;

  // What to show in the write-review CTA slot
  const reviewCTA = () => {
    if (!isAuthenticated) {
      return (
        <p className="text-sm text-center text-gray-500">
          <Link href="/auth/login" className="text-brand-600 hover:underline font-medium">Log in</Link>{" "}
          to write a review
        </p>
      );
    }
    if (userHasReviewed) {
      return (
        <div className="flex items-center gap-2 justify-center text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 size={14} />
          <span className="font-medium">You've already reviewed this product</span>
        </div>
      );
    }
    if (!userHasPurchased) {
      // User is logged in but has not bought this product
      return (
        <div className="flex flex-col items-center gap-2 text-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Lock size={14} />
            <span className="text-sm font-semibold text-gray-700">Verified purchases only</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Only customers who have purchased and received this product can leave a review.
          </p>
          <Link
            href={`/products/${productSlug}`}
            className="mt-1 text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
          >
            <ShoppingBag size={11} /> Buy this product
          </Link>
        </div>
      );
    }
    // Eligible buyer — show the button
    return (
      <button
        onClick={() => { setShowForm((v) => !v); setRatingError(false); }}
        className="w-full btn-primary text-sm py-2.5"
      >
        {showForm ? "Cancel Review" : "Write a Review"}
      </button>
    );
  };

  return (
    <div className="mt-14" id="reviews">
      <h2 className="text-xl font-black text-gray-900 mb-6">
        Customer Reviews
        {total > 0 && <span className="text-gray-400 font-normal text-base ml-2">({total})</span>}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

        {/* ── Left: Summary + CTA ──────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="card p-6 text-center mb-4">
            <p className="text-5xl font-black text-gray-900">{avgRating.toFixed(1)}</p>
            <div className="flex justify-center mt-1">
              <StarRating value={Math.round(avgRating)} readonly size={20} />
            </div>
            <p className="text-sm text-gray-500 mt-2">{total} review{total !== 1 ? "s" : ""}</p>
          </div>

          {total > 0 && (
            <div className="card p-4 space-y-2 mb-4">
              {[5, 4, 3, 2, 1].map((star) => (
                <RatingBar key={star} label={star} count={breakdown[star] ?? 0} total={total} />
              ))}
            </div>
          )}

          {/* Purchase-gated review CTA */}
          <div className="mt-2">
            {isLoading ? (
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              reviewCTA()
            )}
          </div>
        </div>

        {/* ── Right: Form + Reviews ────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Write Review Form — only visible for eligible buyers */}
          {showForm && userHasPurchased && !userHasReviewed && (
            <div className="card p-5 border border-brand-200">
              <h3 className="font-bold text-gray-900 mb-4">Your Review</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rating <span className="text-red-500">*</span>
                  </label>
                  <StarRating
                    value={selectedRating}
                    onChange={(v) => { setSelectedRating(v); setRatingError(false); }}
                    size={28}
                  />
                  {ratingError && <p className="text-xs text-red-500 mt-1">Please select a star rating</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Review Title <span className="text-red-500">*</span>
                  </label>
                  <input {...register("title")} className="input" placeholder="Summarize your experience" />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Review <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("body")} rows={4} className="input resize-none"
                    placeholder="Tell others about your experience with this product..."
                  />
                  {errors.body && <p className="text-xs text-red-500 mt-1">{errors.body.message}</p>}
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit" disabled={submitReview.isPending}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {submitReview.isPending && (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {submitReview.isPending ? "Submitting…" : "Submit Review"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); reset(); setSelectedRating(0); setRatingError(false); }}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reviews list */}
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
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="card p-10 text-center">
              <Star size={40} className="text-gray-200 mx-auto mb-3" />
              <h3 className="font-bold text-gray-700 mb-2">No reviews yet</h3>
              <p className="text-gray-400 text-sm">Be the first to review this product!</p>
            </div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                      {getInitials(r.user?.full_name || "C")}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{r.user?.full_name || "Verified Customer"}</p>
                      <p className="text-xs text-gray-400">{formatDate(r.created_at)}</p>
                    </div>
                  </div>
                  {r.is_verified_purchase && (
                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium shrink-0">
                      <CheckCircle2 size={12} /> Verified Purchase
                    </div>
                  )}
                </div>
                <StarRating value={r.rating} readonly size={14} />
                {r.title && <h4 className="font-bold text-gray-800 mt-2 mb-1 text-sm">{r.title}</h4>}
                {r.body  && <p className="text-sm text-gray-600 leading-relaxed">{r.body}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
