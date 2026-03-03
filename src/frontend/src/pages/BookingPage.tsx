import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  Calendar,
  ChevronLeft,
  Clock,
  Loader2,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend.d";
import { useAppContext } from "../context/AppContext";
import { useActor } from "../hooks/useActor";
import { SERVICE_INFO, categoryFromParam } from "../lib/serviceHelpers";

export default function BookingPage() {
  const params = useParams({ strict: false }) as {
    providerId: string;
    category: string;
  };
  const providerId = params.providerId;
  const categoryParam = params.category;
  const navigate = useNavigate();
  const { user } = useAppContext();
  const { actor, isFetching } = useActor();

  const category = categoryFromParam(categoryParam ?? "");
  const info = category ? SERVICE_INFO[category] : null;

  // Try to get provider name from sessionStorage first, then fallback to API
  const storedName = providerId
    ? sessionStorage.getItem(`provider_name_${providerId}`)
    : null;

  const { data: allProviders } = useQuery({
    queryKey: ["all-providers-for-booking"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllApprovedProviders();
    },
    enabled: !!actor && !isFetching && !storedName,
  });

  const providerName =
    storedName ??
    allProviders?.find((p) => p.userId.toString() === providerId)?.name ??
    "Service Provider";

  // Form state
  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [locationVal, setLocationVal] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);

  // Min date is today
  const today = new Date().toISOString().split("T")[0];

  if (!user || user.role !== UserRole.customer) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">
          Please log in as a customer to book a service.
        </p>
        <Button
          className="mt-4"
          onClick={() => navigate({ to: "/login" })}
          data-ocid="booking.login.button"
        >
          Sign In
        </Button>
      </div>
    );
  }

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !category || !providerId) {
      toast.error("Unable to process booking. Please try again.");
      return;
    }
    if (
      !customerName.trim() ||
      !phone.trim() ||
      !locationVal.trim() ||
      !date ||
      !time
    ) {
      toast.error("Please fill all required fields.");
      return;
    }

    // Validate date/time is in the future
    const selectedDateTime = new Date(`${date}T${time}`);
    if (selectedDateTime <= new Date()) {
      toast.error("Please select a future date and time.");
      return;
    }

    // Check if it's a sample provider
    if (providerId.startsWith("sample-")) {
      toast.info(
        "This is a sample provider for demo purposes. Register as a real provider and get approved to accept actual bookings.",
      );
      return;
    }

    setLoading(true);
    try {
      const { Principal: PrincipalClass } = await import(
        "@icp-sdk/core/principal"
      );
      const providerPrincipal = PrincipalClass.fromText(providerId);

      await actor.createBooking(
        providerPrincipal,
        category,
        customerName.trim(),
        phone.trim(),
        locationVal.trim(),
        date,
        time,
      );

      toast.success("Booking request sent successfully!");
      navigate({ to: "/my-bookings" });
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("customer")) {
        toast.error("You need to be registered as a customer to book.");
      } else {
        toast.error("Booking failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <section className="hero-gradient text-white py-10">
        <div className="container mx-auto px-4">
          <button
            type="button"
            className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors"
            onClick={() => navigate({ to: "/" })}
            data-ocid="booking.back.button"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="font-display text-3xl font-bold">Book a Service</h1>
          {info && (
            <p className="text-white/70 mt-1">
              {info.icon} {info.label} ·{" "}
              <span className="text-white">{providerName}</span>
            </p>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="bg-card rounded-2xl border border-border shadow-card p-8">
            <h2 className="font-display text-xl font-semibold text-foreground mb-6">
              Booking Details
            </h2>

            <form onSubmit={handleBook} className="space-y-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="customer-name"
                  className="flex items-center gap-1.5"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  Your Name
                </Label>
                <Input
                  id="customer-name"
                  type="text"
                  placeholder="Full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  data-ocid="booking.name.input"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  data-ocid="booking.phone.input"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location" className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Service Location
                </Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="Full address where service is needed"
                  value={locationVal}
                  onChange={(e) => setLocationVal(e.target.value)}
                  required
                  data-ocid="booking.location.input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    min={today}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    data-ocid="booking.date.input"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="time" className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Time
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    data-ocid="booking.time.input"
                  />
                </div>
              </div>

              {/* Summary */}
              {info && (
                <div className="rounded-xl bg-accent/50 border border-border p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    Booking Summary
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      <span className="font-medium text-foreground">
                        Service:
                      </span>{" "}
                      {info.icon} {info.label}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">
                        Provider:
                      </span>{" "}
                      {providerName}
                    </p>
                    {date && time && (
                      <p>
                        <span className="font-medium text-foreground">
                          Scheduled:
                        </span>{" "}
                        {new Date(`${date}T${time}`).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full font-semibold"
                size="lg"
                disabled={loading || isFetching}
                data-ocid="booking.submit_button"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  "Book Now"
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
