import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Principal } from "@icp-sdk/core/principal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  CheckCircle,
  ClipboardList,
  Eye,
  FileText,
  Loader2,
  MapPin,
  ShieldCheck,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Booking,
  type ProviderProfile,
  type RevenueStats,
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

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const [dateFilter, setDateFilter] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [viewingIdProof, setViewingIdProof] = useState<{
    name: string;
    dataUrl: string;
  } | null>(null);

  const getIdProofDataUrl = (blobId: string): string | null => {
    try {
      return localStorage.getItem(`idproof_${blobId}`);
    } catch {
      return null;
    }
  };

  const { data: pendingProviders, isLoading: pendingLoading } = useQuery<
    ProviderProfile[]
  >({
    queryKey: ["admin-pending-providers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetPendingProviders();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: allBookings, isLoading: bookingsLoading } = useQuery<Booking[]>(
    {
      queryKey: ["admin-bookings", dateFilter],
      queryFn: async () => {
        if (!actor) return [];
        return actor.adminGetAllBookings(dateFilter || null);
      },
      enabled: !!actor && !isFetching,
    },
  );

  const { data: revenueStats, isLoading: revenueLoading } = useQuery<
    RevenueStats[]
  >({
    queryKey: ["admin-revenue"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetRevenueStats();
    },
    enabled: !!actor && !isFetching,
  });

  if (!user || user.role !== UserRole.admin) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
        <Button
          className="mt-4"
          onClick={() => navigate({ to: "/login" })}
          data-ocid="admin.login.button"
        >
          Sign In
        </Button>
      </div>
    );
  }

  const handleApprove = async (provider: ProviderProfile, approve: boolean) => {
    if (!actor) return;
    const id = provider.userId.toString();
    setApprovingId(id);
    try {
      await actor.adminApproveProvider(provider.userId as Principal, approve);
      toast.success(
        approve
          ? `${provider.name} has been approved and is now visible to customers.`
          : `${provider.name}'s application has been rejected.`,
      );
      queryClient.invalidateQueries({ queryKey: ["admin-pending-providers"] });
    } catch {
      toast.error("Failed to update provider status. Please try again.");
    } finally {
      setApprovingId(null);
    }
  };

  const totalRevenue =
    revenueStats?.reduce((sum, s) => sum + Number(s.totalRevenue), 0) ?? 0;
  const totalBookings =
    revenueStats?.reduce((sum, s) => sum + Number(s.bookingCount), 0) ?? 0;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <section className="hero-gradient text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="h-8 w-8" />
            <div>
              <h1 className="font-display text-3xl font-bold">
                Admin Dashboard
              </h1>
              <p className="text-white/70 mt-0.5">
                Manage providers, bookings and revenue
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Pending Approvals",
                value: pendingProviders?.length ?? "—",
                icon: <Users className="h-5 w-5" />,
              },
              {
                label: "Total Bookings",
                value: allBookings?.length ?? "—",
                icon: <ClipboardList className="h-5 w-5" />,
              },
              {
                label: "Paid Bookings",
                value: totalBookings || "—",
                icon: <CheckCircle className="h-5 w-5" />,
              },
              {
                label: "Total Revenue",
                value: totalRevenue
                  ? `₹${totalRevenue.toLocaleString("en-IN")}`
                  : "—",
                icon: <TrendingUp className="h-5 w-5" />,
              },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                  {stat.icon}
                  {stat.label}
                </div>
                <div className="font-display text-2xl font-bold text-white">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ID Proof Viewer Dialog */}
      <Dialog
        open={!!viewingIdProof}
        onOpenChange={(open) => {
          if (!open) setViewingIdProof(null);
        }}
      >
        <DialogContent className="max-w-2xl" data-ocid="admin.id_proof.dialog">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              ID Proof — {viewingIdProof?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {viewingIdProof?.dataUrl.startsWith("data:image") ? (
              <img
                src={viewingIdProof.dataUrl}
                alt={`ID Proof for ${viewingIdProof.name}`}
                className="w-full rounded-lg border border-border object-contain max-h-[60vh]"
              />
            ) : viewingIdProof?.dataUrl.startsWith("data:application/pdf") ? (
              <iframe
                src={viewingIdProof.dataUrl}
                title={`ID Proof PDF for ${viewingIdProof.name}`}
                className="w-full h-[60vh] rounded-lg border border-border"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mb-3" />
                <p>Cannot preview this file type.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <section className="container mx-auto px-4 py-8">
        <Tabs defaultValue="approvals">
          <TabsList className="mb-6 w-full sm:w-auto" data-ocid="admin.tabs">
            <TabsTrigger value="approvals" data-ocid="admin.approvals.tab">
              Provider Approvals
              {(pendingProviders?.length ?? 0) > 0 && (
                <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold px-1">
                  {pendingProviders?.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="bookings" data-ocid="admin.bookings.tab">
              Bookings
            </TabsTrigger>
            <TabsTrigger value="revenue" data-ocid="admin.revenue.tab">
              Revenue
            </TabsTrigger>
          </TabsList>

          {/* Provider Approvals Tab */}
          <TabsContent value="approvals">
            {pendingLoading ? (
              <div
                className="space-y-4"
                data-ocid="admin.approvals.loading_state"
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-card rounded-xl border border-border p-6"
                  >
                    <div className="flex justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-52" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !pendingProviders || pendingProviders.length === 0 ? (
              <div
                className="text-center py-20"
                data-ocid="admin.approvals.empty_state"
              >
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  All caught up!
                </h3>
                <p className="text-muted-foreground">
                  No pending provider approvals.
                </p>
              </div>
            ) : (
              <div className="space-y-4" data-ocid="admin.approvals.list">
                <p className="text-sm text-muted-foreground">
                  {pendingProviders.length} provider
                  {pendingProviders.length !== 1 ? "s" : ""} awaiting approval
                </p>
                {pendingProviders.map((provider, idx) => {
                  const info = SERVICE_INFO[provider.serviceCategory];
                  const isApproving =
                    approvingId === provider.userId.toString();
                  return (
                    <div
                      key={provider.userId.toString()}
                      className="bg-card rounded-xl border border-border shadow-xs p-6"
                      data-ocid={`admin.provider.item.${idx + 1}`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-display font-bold flex-shrink-0">
                            {provider.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-display font-semibold text-foreground text-base">
                              {provider.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {provider.email}
                            </p>
                            <p className="text-sm font-medium text-foreground mt-1">
                              {info?.icon} {info?.label}
                            </p>
                            {provider.idProofBlobId &&
                              (() => {
                                const dataUrl = getIdProofDataUrl(
                                  provider.idProofBlobId,
                                );
                                return (
                                  <div className="mt-1">
                                    {dataUrl ? (
                                      <button
                                        type="button"
                                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium underline-offset-2 hover:underline transition-colors"
                                        onClick={() =>
                                          setViewingIdProof({
                                            name: provider.name,
                                            dataUrl,
                                          })
                                        }
                                        data-ocid={`admin.view_id_proof.button.${idx + 1}`}
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                        View ID Proof
                                      </button>
                                    ) : (
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <FileText className="h-3.5 w-3.5" />
                                        <span>
                                          ID proof uploaded{" "}
                                          <span className="text-amber-600">
                                            (preview unavailable on this device)
                                          </span>
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            {!provider.idProofBlobId && (
                              <p className="text-xs text-amber-600 mt-1">
                                ⚠️ No ID proof uploaded yet
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 self-start sm:self-center">
                          <Button
                            size="sm"
                            className="font-semibold"
                            onClick={() => handleApprove(provider, true)}
                            disabled={isApproving}
                            data-ocid={`admin.approve.button.${idx + 1}`}
                          >
                            {isApproving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="mr-1.5 h-4 w-4" />{" "}
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30 hover:bg-destructive/5"
                            onClick={() => handleApprove(provider, false)}
                            disabled={isApproving}
                            data-ocid={`admin.reject.button.${idx + 1}`}
                          >
                            <XCircle className="mr-1.5 h-4 w-4" /> Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <div className="mb-5 flex items-end gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="date-filter"
                  className="flex items-center gap-1.5"
                >
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Filter by Date
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="date-filter"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-40"
                    data-ocid="admin.date_filter.input"
                  />
                  {dateFilter && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDateFilter("")}
                      data-ocid="admin.clear_filter.button"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {bookingsLoading ? (
              <div
                className="space-y-3"
                data-ocid="admin.bookings.loading_state"
              >
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : !allBookings || allBookings.length === 0 ? (
              <div
                className="text-center py-20"
                data-ocid="admin.bookings.empty_state"
              >
                <div className="text-5xl mb-4">📋</div>
                <p className="text-muted-foreground">
                  {dateFilter
                    ? "No bookings found for this date."
                    : "No bookings yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-auto" data-ocid="admin.bookings.list">
                <p className="text-sm text-muted-foreground mb-3">
                  {allBookings.length} booking
                  {allBookings.length !== 1 ? "s" : ""}
                  {dateFilter ? ` on ${formatDate(dateFilter)}` : ""}
                </p>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50">
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-3 font-semibold text-foreground">
                          Booking
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-foreground hidden md:table-cell">
                          Customer
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-foreground hidden md:table-cell">
                          Date
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...allBookings]
                        .sort(
                          (a, b) => Number(b.createdAt) - Number(a.createdAt),
                        )
                        .map((booking, idx) => {
                          const info = SERVICE_INFO[booking.serviceCategory];
                          const statusClass = STATUS_CLASSES[booking.status];
                          const statusLabel = STATUS_LABELS[booking.status];
                          return (
                            <tr
                              key={booking.id}
                              className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
                              data-ocid={`admin.booking.row.${idx + 1}`}
                            >
                              <td className="px-4 py-3">
                                <div className="font-medium text-foreground">
                                  {info?.icon} {info?.label}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {booking.id.slice(0, 8)}...
                                </div>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <div className="text-foreground">
                                  {booking.customerName}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {booking.customerLocation.slice(0, 25)}
                                  {booking.customerLocation.length > 25
                                    ? "..."
                                    : ""}
                                </div>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDate(booking.scheduledDate)}
                                </div>
                                <div className="text-xs">
                                  {booking.scheduledTime}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusClass}`}
                                >
                                  {statusLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue">
            {revenueLoading ? (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                data-ocid="admin.revenue.loading_state"
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
            ) : !revenueStats || revenueStats.length === 0 ? (
              <div
                className="text-center py-20"
                data-ocid="admin.revenue.empty_state"
              >
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No revenue data available yet.
                </p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-card rounded-xl border border-border shadow-xs p-5">
                    <div className="text-sm text-muted-foreground mb-1">
                      Total Revenue
                    </div>
                    <div className="font-display text-3xl font-bold text-primary">
                      ₹{totalRevenue.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="bg-card rounded-xl border border-border shadow-xs p-5">
                    <div className="text-sm text-muted-foreground mb-1">
                      Total Paid Bookings
                    </div>
                    <div className="font-display text-3xl font-bold text-foreground">
                      {totalBookings}
                    </div>
                  </div>
                </div>

                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  data-ocid="admin.revenue.list"
                >
                  {revenueStats.map((stat, idx) => {
                    const info = SERVICE_INFO[stat.category];
                    return (
                      <div
                        key={stat.category}
                        className="bg-card rounded-xl border border-border shadow-xs p-5"
                        data-ocid={`admin.revenue.card.${idx + 1}`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">{info?.icon ?? "🔧"}</span>
                          <span className="font-display font-semibold text-foreground">
                            {info?.label ?? String(stat.category)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Revenue
                            </span>
                            <span className="font-bold text-primary">
                              ₹
                              {Number(stat.totalRevenue).toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Bookings
                            </span>
                            <span className="font-semibold text-foreground">
                              {Number(stat.bookingCount)}
                            </span>
                          </div>
                          {Number(stat.bookingCount) > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">
                                Avg per booking
                              </span>
                              <span className="text-sm text-foreground">
                                ₹
                                {Math.round(
                                  Number(stat.totalRevenue) /
                                    Number(stat.bookingCount),
                                ).toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
