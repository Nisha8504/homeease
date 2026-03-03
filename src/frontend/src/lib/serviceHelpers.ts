import { BookingStatus, ServiceCategory } from "../backend.d";

export const SERVICE_INFO: Record<
  ServiceCategory,
  { label: string; icon: string; color: string; description: string }
> = {
  [ServiceCategory.mechanic]: {
    label: "Mechanic",
    icon: "🔧",
    color: "service-card-gradient-mechanic",
    description: "Vehicle repair & maintenance",
  },
  [ServiceCategory.electrician]: {
    label: "Electrician",
    icon: "⚡",
    color: "service-card-gradient-electrician",
    description: "Wiring, fixtures & electrical work",
  },
  [ServiceCategory.plumber]: {
    label: "Plumber",
    icon: "🔩",
    color: "service-card-gradient-plumber",
    description: "Pipes, drains & water systems",
  },
  [ServiceCategory.acService]: {
    label: "AC Service",
    icon: "❄️",
    color: "service-card-gradient-acservice",
    description: "AC installation, repair & servicing",
  },
  [ServiceCategory.deepCleaning]: {
    label: "Deep Cleaning",
    icon: "🧹",
    color: "service-card-gradient-deepcleaning",
    description: "Professional home deep cleaning",
  },
  [ServiceCategory.pestControl]: {
    label: "Pest Control",
    icon: "🐛",
    color: "service-card-gradient-pestcontrol",
    description: "Pest extermination & prevention",
  },
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.pending]: "Pending",
  [BookingStatus.accepted]: "Accepted",
  [BookingStatus.rejected]: "Rejected",
  [BookingStatus.completed]: "Completed",
  [BookingStatus.paid]: "Paid",
};

export const STATUS_CLASSES: Record<BookingStatus, string> = {
  [BookingStatus.pending]: "status-pending",
  [BookingStatus.accepted]: "status-accepted",
  [BookingStatus.rejected]: "status-rejected",
  [BookingStatus.completed]: "status-completed",
  [BookingStatus.paid]: "status-paid",
};

export function formatCurrency(amount: bigint): string {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function categoryFromParam(param: string): ServiceCategory | null {
  const map: Record<string, ServiceCategory> = {
    mechanic: ServiceCategory.mechanic,
    electrician: ServiceCategory.electrician,
    plumber: ServiceCategory.plumber,
    acservice: ServiceCategory.acService,
    "ac-service": ServiceCategory.acService,
    acService: ServiceCategory.acService,
    deepcleaning: ServiceCategory.deepCleaning,
    "deep-cleaning": ServiceCategory.deepCleaning,
    deepCleaning: ServiceCategory.deepCleaning,
    pestcontrol: ServiceCategory.pestControl,
    "pest-control": ServiceCategory.pestControl,
    pestControl: ServiceCategory.pestControl,
  };
  return map[param] ?? null;
}

export function categoryToParam(cat: ServiceCategory): string {
  const map: Record<ServiceCategory, string> = {
    [ServiceCategory.mechanic]: "mechanic",
    [ServiceCategory.electrician]: "electrician",
    [ServiceCategory.plumber]: "plumber",
    [ServiceCategory.acService]: "acservice",
    [ServiceCategory.deepCleaning]: "deepcleaning",
    [ServiceCategory.pestControl]: "pestcontrol",
  };
  return map[cat];
}
