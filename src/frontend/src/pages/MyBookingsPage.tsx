import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  ClipboardList,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Phone,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type Booking, BookingStatus, UserRole } from "../backend.d";
import StarRating from "../components/StarRating";
import { useAppContext } from "../context/AppContext";
import { useActor } from "../hooks/useActor";
import {
  SERVICE_INFO,
  STATUS_CLASSES,
  STATUS_LABELS,
  formatDate,
} from "../lib/serviceHelpers";

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);

  const {
    data: bookings,
    isLoading,
    error,
    refetch,
  } = useQuery<Booking[]>({
    queryKey: ["my-bookings"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyBookingsAsCustomer();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetch]);

  if (!user || user.role !== UserRole.customer) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">
          Please log in as a customer to view bookings.
        </p>
        <Button
          className="mt-4"
          onClick={() => navigate({ to: "/login" })}
          data-ocid="bookings.login.button"
        >
          Sign In
        </Button>
      </div>
    );
  }

  const handlePay = async (bookingId: string) => {
    if (!actor) return;
    setPayingBookingId(bookingId);
    try {
      await actor.markBookingPaid(bookingId);
      toast.success("Payment successful! Thank you.");
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    } catch {
      toast.error("Payment failed. Please try again.");
    } finally {
      setPayingBookingId(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!actor || !reviewBookingId) return;
    if (reviewRating < 1 || reviewRating > 5) {
      toast.error("Please select a rating.");
      return;
    }
    setSubmittingReview(true);
    try {
      await actor.submitReview(
        reviewBookingId,
        BigInt(reviewRating),
        reviewComment.trim(),
      );
      toast.success("Review submitted! Thank you for your feedback.");
      setReviewBookingId(null);
      setReviewRating(5);
      setReviewComment("");
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    } catch {
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const sortedBookings = bookings
    ? [...bookings].sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    : [];

  return (
    <main className="min-h-screen bg-background">
      <section className="hero-gradient text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-8 w-8" />
            <div>
              <h1 className="font-display text-3xl font-bold">My Bookings</h1>
              <p className="text-white/70 mt-0.5">
                Track all your service requests
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {isLoading || isFetching ? (
          <div className="space-y-4" data-ocid="bookings.loading_state">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-60" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-9 w-28 mt-4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20" data-ocid="bookings.error_state">
            <p className="text-destructive">
              Failed to load bookings. Please try again.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        ) : sortedBookings.length === 0 ? (
          <div className="text-center py-24" data-ocid="bookings.empty_state">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              No bookings yet
            </h3>
            <p className="text-muted-foreground mb-6">
              You haven't made any service bookings. Browse services to get
              started.
            </p>
            <Button
              onClick={() => navigate({ to: "/" })}
              data-ocid="bookings.browse.button"
            >
              Browse Services
            </Button>
          </div>
        ) : (
          <div className="space-y-4" data-ocid="bookings.list">
            <p className="text-sm text-muted-foreground mb-2">
              {sortedBookings.length} booking
              {sortedBookings.length !== 1 ? "s" : ""} · Auto-refreshes every 10
              seconds
            </p>
            {sortedBookings.map((booking, idx) => {
              const info = SERVICE_INFO[booking.serviceCategory];
              const statusClass = STATUS_CLASSES[booking.status];
              const statusLabel = STATUS_LABELS[booking.status];

              return (
                <div
                  key={booking.id}
                  className="bg-card rounded-xl border border-border shadow-xs p-6"
                  data-ocid={`bookings.item.${idx + 1}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <h3 className="font-display font-semibold text-foreground">
                          {info.label}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ID: {booking.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClass}`}
                      data-ocid={`bookings.status.${idx + 1}`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(booking.scheduledDate)} at{" "}
                        {booking.scheduledTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">
                        {booking.customerLocation}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4" />
                      <span>{booking.customerPhone}</span>
                    </div>
                  </div>

                  {/* Status messages */}
                  {booking.status === BookingStatus.pending && (
                    <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700 mb-4">
                      ⏳ Waiting for the provider to accept your request.
                    </div>
                  )}
                  {booking.status === BookingStatus.accepted && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 mb-4 flex items-start gap-2">
                      <Clock className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
                      <div>
                        <span className="font-semibold">Booking accepted!</span>{" "}
                        Provider will arrive within{" "}
                        <span className="font-semibold">30–60 minutes</span>.
                        Please be available at the service location.
                      </div>
                    </div>
                  )}
                  {booking.status === BookingStatus.rejected && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">
                      ❌ Your booking was rejected by the provider. Please try
                      booking another provider.
                    </div>
                  )}
                  {booking.status === BookingStatus.completed && (
                    <div className="rounded-lg bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-300 p-4 text-sm text-blue-800 mb-4">
                      <div className="flex items-start gap-2">
                        <CreditCard className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                        <div>
                          <p className="font-semibold text-blue-900 mb-0.5">
                            🎉 Work Completed!
                          </p>
                          <p>
                            Your provider has finished the work. Please complete
                            the payment to leave a review.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {booking.status === BookingStatus.completed && (
                      <Button
                        size="lg"
                        onClick={() => handlePay(booking.id)}
                        disabled={payingBookingId === booking.id}
                        className="font-semibold bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white border-0 shadow-md"
                        data-ocid={`bookings.pay.button.${idx + 1}`}
                      >
                        {payingBookingId === booking.id ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                            Processing Payment...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-5 w-5" /> Pay Now
                          </>
                        )}
                      </Button>
                    )}
                    {booking.status === BookingStatus.paid && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setReviewBookingId(booking.id);
                          setReviewRating(5);
                          setReviewComment("");
                        }}
                        className="font-semibold"
                        data-ocid={`bookings.review.button.${idx + 1}`}
                      >
                        <Star className="mr-2 h-4 w-4 text-amber-500" />
                        Leave Review
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Review Modal */}
      <Dialog
        open={!!reviewBookingId}
        onOpenChange={(open) => {
          if (!open) setReviewBookingId(null);
        }}
      >
        <DialogContent data-ocid="review.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Leave a Review</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Your Rating</Label>
              <StarRating
                rating={reviewRating}
                interactive
                onRate={setReviewRating}
                size="lg"
              />
              <p className="text-sm text-muted-foreground">
                {reviewRating === 5
                  ? "Excellent"
                  : reviewRating === 4
                    ? "Good"
                    : reviewRating === 3
                      ? "Average"
                      : reviewRating === 2
                        ? "Poor"
                        : "Very Poor"}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="review-comment">Comment (optional)</Label>
              <Textarea
                id="review-comment"
                placeholder="Share your experience with this provider..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                data-ocid="review.comment.textarea"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewBookingId(null)}
              data-ocid="review.cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submittingReview}
              data-ocid="review.submit_button"
            >
              {submittingReview ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
