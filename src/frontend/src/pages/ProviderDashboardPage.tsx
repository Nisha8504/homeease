import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  CheckCircle,
  Clock,
  LayoutDashboard,
  Loader2,
  MapPin,
  Phone,
  Upload,
  User,
  XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ApprovalStatus,
  type Booking,
  BookingStatus,
  type ProviderProfile,
  UserRole,
} from "../backend.d";
import { useAppContext } from "../context/AppContext";
import { useActor } from "../hooks/useActor";
import {
  SERVICE_INFO,
  STATUS_CLASSES,
  STATUS_LABELS,
  formatDate,
} from "../lib/serviceHelpers";

export default function ProviderDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading: profileLoading } =
    useQuery<ProviderProfile>({
      queryKey: ["provider-profile"],
      queryFn: async () => {
        if (!actor) throw new Error("No actor");
        return actor.getMyProviderProfile();
      },
      enabled: !!actor && !isFetching,
    });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["provider-bookings"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyBookingsAsProvider();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
  });

  if (!user || user.role !== UserRole.provider) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">
          Please log in as a provider to access the dashboard.
        </p>
        <Button
          className="mt-4"
          onClick={() => navigate({ to: "/login" })}
          data-ocid="provider.login.button"
        >
          Sign In
        </Button>
      </div>
    );
  }

  const handleUploadIdProof = async (file: File) => {
    if (!actor) {
      toast.error("Not connected. Please try again.");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const blobId = `sha256:${hashHex}`;
      setUploadProgress(50);
      await actor.uploadIdProof(blobId);
      setUploadProgress(100);

      // Store the file as base64 in localStorage so admin can preview it
      // Only store if file is under 1.5MB to avoid quota issues
      if (file.size <= 1.5 * 1024 * 1024) {
        try {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              if (reader.result) {
                localStorage.setItem(
                  `idproof_${blobId}`,
                  reader.result as string,
                );
              }
            } catch {
              // localStorage quota exceeded — ignore silently
            }
          };
          reader.readAsDataURL(file);
        } catch {
          // FileReader error — ignore silently
        }
      }

      toast.success("ID proof submitted for verification!");
      queryClient.invalidateQueries({ queryKey: ["provider-profile"] });
    } catch (_err) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRespond = async (bookingId: string, accept: boolean) => {
    if (!actor) return;
    try {
      await actor.respondToBooking(bookingId, accept);
      toast.success(accept ? "Booking accepted!" : "Booking declined.");
      queryClient.invalidateQueries({ queryKey: ["provider-bookings"] });
    } catch {
      toast.error("Failed to update booking. Please try again.");
    }
  };

  const handleMarkCompleted = async (bookingId: string) => {
    if (!actor) return;
    try {
      await actor.markBookingCompleted(bookingId);
      toast.success("Work done! Customer will now proceed to payment.");
      queryClient.invalidateQueries({ queryKey: ["provider-bookings"] });
    } catch {
      toast.error("Failed to mark as completed.");
    }
  };

  const pending =
    bookings?.filter((b) => b.status === BookingStatus.pending) ?? [];
  const accepted =
    bookings?.filter((b) => b.status === BookingStatus.accepted) ?? [];
  const history =
    bookings?.filter((b) =>
      [
        BookingStatus.completed,
        BookingStatus.paid,
        BookingStatus.rejected,
      ].includes(b.status),
    ) ?? [];

  const approvalStatusColor: Record<ApprovalStatus, string> = {
    [ApprovalStatus.pending]: "bg-yellow-100 text-yellow-800 border-yellow-200",
    [ApprovalStatus.approved]: "bg-green-100 text-green-800 border-green-200",
    [ApprovalStatus.rejected]: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <section className="hero-gradient text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8" />
            <div>
              <h1 className="font-display text-3xl font-bold">
                Provider Dashboard
              </h1>
              <p className="text-white/70 mt-0.5">
                Manage your bookings and profile
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {/* Profile Card */}
        {profileLoading ? (
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>
        ) : profile ? (
          <div className="bg-card rounded-xl border border-border shadow-card p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-display font-bold text-xl">
                  {profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">
                    {profile.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {profile.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-sm font-medium text-foreground">
                      {SERVICE_INFO[profile.serviceCategory]?.icon}{" "}
                      {SERVICE_INFO[profile.serviceCategory]?.label}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${approvalStatusColor[profile.approvalStatus]}`}
                    >
                      {profile.approvalStatus.charAt(0).toUpperCase() +
                        profile.approvalStatus.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <div className="font-display text-2xl font-bold text-foreground">
                    {Number(profile.totalReviews)}
                  </div>
                  <div className="text-xs text-muted-foreground">Reviews</div>
                </div>
                <div>
                  <div className="font-display text-2xl font-bold text-foreground">
                    {profile.avgRating.toFixed(1)}⭐
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg Rating
                  </div>
                </div>
                <div>
                  <div className="font-display text-2xl font-bold text-foreground">
                    ₹{Number(profile.totalEarnings).toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-muted-foreground">Earnings</div>
                </div>
              </div>
            </div>

            {/* ID Proof Upload */}
            {(!profile.idProofBlobId ||
              profile.approvalStatus === ApprovalStatus.pending) && (
              <div className="mt-5 pt-5 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {profile.idProofBlobId
                    ? "ID Proof Submitted — Awaiting Approval"
                    : "Upload ID Proof (Required for Approval)"}
                </h3>
                {!profile.idProofBlobId && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadIdProof(file);
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      data-ocid="provider.upload.button"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading {uploadProgress}%...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload ID Proof (Image/PDF)
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Upload your government-issued ID for verification.
                      Accepted: JPG, PNG, PDF.
                    </p>
                  </div>
                )}
                {profile.idProofBlobId && (
                  <div className="flex items-center gap-2 text-sm text-yellow-700">
                    <Clock className="h-4 w-4" />
                    Your ID proof is under review by the admin team.
                  </div>
                )}
              </div>
            )}

            {profile.approvalStatus === ApprovalStatus.rejected && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                Your account was rejected. Please contact support for
                assistance.
              </div>
            )}
          </div>
        ) : null}

        {/* Bookings Tabs */}
        <Tabs defaultValue="pending">
          <TabsList
            className="mb-6 w-full sm:w-auto"
            data-ocid="provider.bookings.tab"
          >
            <TabsTrigger value="pending" data-ocid="provider.pending.tab">
              Pending
              {pending.length > 0 && (
                <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold px-1">
                  {pending.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="accepted" data-ocid="provider.accepted.tab">
              Active
            </TabsTrigger>
            <TabsTrigger value="history" data-ocid="provider.history.tab">
              History
            </TabsTrigger>
          </TabsList>

          {bookingsLoading ? (
            <div
              className="space-y-4"
              data-ocid="provider.bookings.loading_state"
            >
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl border border-border p-6"
                >
                  <Skeleton className="h-6 w-40 mb-3" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-60" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="pending">
                {pending.length === 0 ? (
                  <div
                    className="text-center py-16 text-muted-foreground"
                    data-ocid="provider.pending.empty_state"
                  >
                    <div className="text-4xl mb-3">📭</div>
                    <p>No pending requests right now.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pending.map((booking, idx) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        index={idx + 1}
                        actions={
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="font-semibold"
                              onClick={() => handleRespond(booking.id, true)}
                              data-ocid={`provider.accept.button.${idx + 1}`}
                            >
                              <CheckCircle className="mr-1.5 h-4 w-4" /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30 hover:bg-destructive/5"
                              onClick={() => handleRespond(booking.id, false)}
                              data-ocid={`provider.reject.button.${idx + 1}`}
                            >
                              <XCircle className="mr-1.5 h-4 w-4" /> Reject
                            </Button>
                          </div>
                        }
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="accepted">
                {accepted.length === 0 ? (
                  <div
                    className="text-center py-16 text-muted-foreground"
                    data-ocid="provider.active.empty_state"
                  >
                    <div className="text-4xl mb-3">🔧</div>
                    <p>No active bookings.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {accepted.map((booking, idx) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        index={idx + 1}
                        actions={
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white border-0 font-semibold"
                            onClick={() => handleMarkCompleted(booking.id)}
                            data-ocid={`provider.complete.button.${idx + 1}`}
                          >
                            <CheckCircle className="mr-1.5 h-4 w-4" />
                            Work Done
                          </Button>
                        }
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history">
                {history.length === 0 ? (
                  <div
                    className="text-center py-16 text-muted-foreground"
                    data-ocid="provider.history.empty_state"
                  >
                    <div className="text-4xl mb-3">📊</div>
                    <p>No booking history yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...history]
                      .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
                      .map((booking, idx) => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          index={idx + 1}
                        />
                      ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </section>
    </main>
  );
}

function BookingCard({
  booking,
  index,
  actions,
}: {
  booking: Booking;
  index: number;
  actions?: React.ReactNode;
}) {
  const info = SERVICE_INFO[booking.serviceCategory];
  const statusClass = STATUS_CLASSES[booking.status];
  const statusLabel = STATUS_LABELS[booking.status];

  return (
    <div
      className="bg-card rounded-xl border border-border shadow-xs p-6"
      data-ocid={`provider.booking.item.${index}`}
    >
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{info?.icon ?? "🔧"}</span>
          <div>
            <h3 className="font-display font-semibold text-foreground">
              {info?.label ?? "Service"}
            </h3>
            <p className="text-xs text-muted-foreground">
              ID: {booking.id.slice(0, 8)}...
            </p>
          </div>
        </div>
        <span
          className={`self-start inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1.5">
          <User className="h-4 w-4" />
          <span>{booking.customerName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="h-4 w-4" />
          <span>{booking.customerPhone}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          <span className="truncate">{booking.customerLocation}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          <span>
            {formatDate(booking.scheduledDate)} at {booking.scheduledTime}
          </span>
        </div>
      </div>

      {actions && <div>{actions}</div>}
    </div>
  );
}
