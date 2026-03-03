import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ChevronLeft, MapPin, Star } from "lucide-react";
import { type ProviderProfile, UserRole } from "../backend.d";
import StarRating from "../components/StarRating";
import { useAppContext } from "../context/AppContext";
import { useActor } from "../hooks/useActor";
import {
  SERVICE_INFO,
  categoryFromParam,
  categoryToParam,
} from "../lib/serviceHelpers";

// Sample providers for demo fallback
const SAMPLE_PROVIDERS: Record<
  string,
  Array<{
    userId: { toString: () => string };
    name: string;
    email: string;
    serviceCategory: string;
    approvalStatus: string;
    avgRating: number;
    totalReviews: bigint;
    totalEarnings: bigint;
    idProofBlobId?: string;
  }>
> = {
  mechanic: [
    {
      userId: { toString: () => "sample-mech-1" },
      name: "Ravi Kumar",
      email: "ravi@example.com",
      serviceCategory: "mechanic",
      approvalStatus: "approved",
      avgRating: 4.8,
      totalReviews: 42n,
      totalEarnings: 0n,
    },
    {
      userId: { toString: () => "sample-mech-2" },
      name: "Suresh Auto Works",
      email: "suresh@example.com",
      serviceCategory: "mechanic",
      approvalStatus: "approved",
      avgRating: 4.5,
      totalReviews: 28n,
      totalEarnings: 0n,
    },
    {
      userId: { toString: () => "sample-mech-3" },
      name: "Arjun Motors",
      email: "arjun@example.com",
      serviceCategory: "mechanic",
      approvalStatus: "approved",
      avgRating: 4.2,
      totalReviews: 15n,
      totalEarnings: 0n,
    },
  ],
  electrician: [
    {
      userId: { toString: () => "sample-elec-1" },
      name: "Prakash Electrical",
      email: "prakash@example.com",
      serviceCategory: "electrician",
      approvalStatus: "approved",
      avgRating: 4.9,
      totalReviews: 67n,
      totalEarnings: 0n,
    },
    {
      userId: { toString: () => "sample-elec-2" },
      name: "Vijay Wiring Solutions",
      email: "vijay@example.com",
      serviceCategory: "electrician",
      approvalStatus: "approved",
      avgRating: 4.6,
      totalReviews: 34n,
      totalEarnings: 0n,
    },
    {
      userId: { toString: () => "sample-elec-3" },
      name: "Kiran Electrical Co.",
      email: "kiran@example.com",
      serviceCategory: "electrician",
      approvalStatus: "approved",
      avgRating: 4.3,
      totalReviews: 22n,
      totalEarnings: 0n,
    },
  ],
  plumber: [
    {
      userId: { toString: () => "sample-plumb-1" },
      name: "Mohan Plumbing",
      email: "mohan@example.com",
      serviceCategory: "plumber",
      approvalStatus: "approved",
      avgRating: 4.7,
      totalReviews: 51n,
      totalEarnings: 0n,
    },
    {
      userId: { toString: () => "sample-plumb-2" },
      name: "Ganesh Pipes & Fittings",
      email: "ganesh@example.com",
      serviceCategory: "plumber",
      approvalStatus: "approved",
      avgRating: 4.4,
      totalReviews: 29n,
      totalEarnings: 0n,
    },
    {
      userId: { toString: () => "sample-plumb-3" },
      name: "Ramesh Water Solutions",
      email: "ramesh@example.com",
      serviceCategory: "plumber",
      approvalStatus: "approved",
      avgRating: 4.1,
      totalReviews: 18n,
      totalEarnings: 0n,
    },
  ],
  acservice: [
    {
      userId: { toString: () => "sample-ac-1" },
      name: "CoolTech AC Services",
      email: "cooltech@example.com",
      serviceCategory: "acService",
      approvalStatus: "approved",
      avgRating: 4.8,
      totalReviews: 89n,
      totalEarnings: 0n,
    },
    {
      userId: { toString: () => "sample-ac-2" },
      name: "Arctic Air Solutions",
      email: "arctic@example.com",
      serviceCategory: "acService",
      approvalStatus: "approved",
      avgRating: 4.5,
      totalReviews: 43n,
      totalEarnings: 0n,
    },
    {
      userId: { toString: () => "sample-ac-3" },
      name: "Frost AC Repairs",
      email: "frost@example.com",
      serviceCategory: "acService",
      approvalStatus: "approved",
      avgRating: 4.2,
      totalReviews: 31n,
      totalEarnings: 0n,
    },
  ],
  deepcleaning: [
    {
      userId: { toString: () => "sample-clean-1" },
      name: "SparkleClean Pro",
      email: "sparkle@example.com",
      serviceCategory: "deepCleaning",
      approvalStatus: "approved",
      avgRating: 4.9,
      totalReviews: 112n,
      totalEarnings: 0n,
    },
    {
      userId: { toString: () => "sample-clean-2" },
      name: "Shine Home Services",
      email: "shine@example.com",
      serviceCategory: "deepCleaning",
      approvalStatus: "approved",
      avgRating: 4.6,
      totalReviews: 56n,
      totalEarnings: 0n,
    },
    {
      userId: { toString: () => "sample-clean-3" },
      name: "FreshHome Cleaners",
      email: "fresh@example.com",
      serviceCategory: "deepCleaning",
      approvalStatus: "approved",
      avgRating: 4.3,
      totalReviews: 38n,
      totalEarnings: 0n,
    },
  ],
  pestcontrol: [
    {
      userId: { toString: () => "sample-pest-1" },
      name: "SafeHome Pest Control",
      email: "safehome@example.com",
      serviceCategory: "pestControl",
      approvalStatus: "approved",
      avgRating: 4.8,
      totalReviews: 74n,
      totalEarnings: 0n,
    },
    {
      userId: { toString: () => "sample-pest-2" },
      name: "BugBuster Services",
      email: "bugbuster@example.com",
      serviceCategory: "pestControl",
      approvalStatus: "approved",
      avgRating: 4.5,
      totalReviews: 42n,
      totalEarnings: 0n,
    },
    {
      userId: { toString: () => "sample-pest-3" },
      name: "Terminator Pest Solutions",
      email: "terminator@example.com",
      serviceCategory: "pestControl",
      approvalStatus: "approved",
      avgRating: 4.1,
      totalReviews: 27n,
      totalEarnings: 0n,
    },
  ],
};

export default function ProviderListPage() {
  const { category: categoryParam } = useParams({ strict: false }) as {
    category: string;
  };
  const navigate = useNavigate();
  const { user } = useAppContext();
  const { actor, isFetching } = useActor();

  const category = categoryFromParam(categoryParam ?? "");

  const {
    data: providers,
    isLoading,
    error,
  } = useQuery<ProviderProfile[]>({
    queryKey: ["providers", categoryParam],
    queryFn: async () => {
      if (!actor || !category) return [];
      return actor.getApprovedProviders(category);
    },
    enabled: !!actor && !isFetching && !!category,
  });

  if (!user || user.role !== UserRole.customer) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">
          Please log in as a customer to view providers.
        </p>
        <Button
          className="mt-4"
          onClick={() => navigate({ to: "/login" })}
          data-ocid="providers.login.button"
        >
          Sign In
        </Button>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-destructive">Invalid service category.</p>
      </div>
    );
  }

  const info = SERVICE_INFO[category];

  // Use sample data if backend returns empty
  const displayProviders =
    providers && providers.length > 0
      ? [...providers].sort((a, b) => b.avgRating - a.avgRating)
      : (SAMPLE_PROVIDERS[categoryToParam(category)] ?? []);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <section className="hero-gradient text-white py-10">
        <div className="container mx-auto px-4">
          <button
            type="button"
            className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors"
            onClick={() => navigate({ to: "/" })}
            data-ocid="providers.back.button"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Services
          </button>
          <div className="flex items-center gap-4">
            <div className="text-5xl">{info.icon}</div>
            <div>
              <h1 className="font-display text-3xl font-bold">
                {info.label} Providers
              </h1>
              <p className="text-white/70 mt-1">{info.description}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {isLoading || isFetching ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-ocid="providers.loading_state"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card rounded-xl p-6 border border-border shadow-xs"
              >
                <div className="flex items-start gap-4">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-9 w-full mt-5" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20" data-ocid="providers.error_state">
            <p className="text-destructive">
              Failed to load providers. Please try again.
            </p>
          </div>
        ) : displayProviders.length === 0 ? (
          <div className="text-center py-20" data-ocid="providers.empty_state">
            <div className="text-6xl mb-4">{info.icon}</div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              No providers available yet
            </h3>
            <p className="text-muted-foreground">
              There are currently no approved {info.label.toLowerCase()}{" "}
              providers in your area.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground text-sm">
                Sorted by customer rating · {displayProviders.length} provider
                {displayProviders.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              data-ocid="providers.list"
            >
              {displayProviders.map((provider, idx) => (
                <ProviderCard
                  key={provider.userId.toString()}
                  provider={provider}
                  categoryParam={categoryToParam(category)}
                  index={idx + 1}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function ProviderCard({
  provider,
  categoryParam,
  index,
}: {
  provider: any;
  categoryParam: string;
  index: number;
}) {
  const navigate = useNavigate();
  const initials = provider.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="bg-card rounded-xl border border-border shadow-card p-6 card-hover flex flex-col"
      data-ocid={`providers.item.${index}`}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-display font-bold text-lg flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground text-base truncate">
            {provider.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <StarRating rating={provider.avgRating} size="sm" />
            <span className="text-sm font-medium text-foreground">
              {provider.avgRating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({Number(provider.totalReviews)} reviews)
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Available in your area
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Badge variant="secondary" className="text-xs">
          <Star className="h-3 w-3 mr-1 text-amber-500 fill-amber-500" />
          Top Rated
        </Badge>
        {Number(provider.totalReviews) > 50 && (
          <Badge variant="outline" className="text-xs">
            Experienced
          </Badge>
        )}
      </div>

      <div className="mt-auto">
        <Button
          className="w-full font-semibold"
          onClick={() => {
            // Store provider name in sessionStorage for the booking page
            sessionStorage.setItem(
              `provider_name_${provider.userId.toString()}`,
              provider.name,
            );
            navigate({
              to: "/book/$providerId/$category",
              params: {
                providerId: provider.userId.toString(),
                category: categoryParam,
              },
            });
          }}
          data-ocid={`providers.book.button.${index}`}
        >
          Book Now
        </Button>
      </div>
    </div>
  );
}
