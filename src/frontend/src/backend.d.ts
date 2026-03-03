import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ProviderProfile {
    serviceCategory: ServiceCategory;
    userId: Principal;
    name: string;
    email: string;
    approvalStatus: ApprovalStatus;
    totalEarnings: bigint;
    totalReviews: bigint;
    idProofBlobId?: string;
    avgRating: number;
}
export interface UserProfile {
    name: string;
    role: UserRole;
    email: string;
}
export interface User {
    principal: Principal;
    name: string;
    role: UserRole;
    email: string;
    passwordHash: Uint8Array;
}
export interface RevenueStats {
    category: ServiceCategory;
    totalRevenue: bigint;
    bookingCount: bigint;
}
export interface Booking {
    id: string;
    customerName: string;
    status: BookingStatus;
    serviceCategory: ServiceCategory;
    customerLocation: string;
    customerPhone: string;
    scheduledDate: string;
    scheduledTime: string;
    createdAt: bigint;
    customerId: Principal;
    amount: bigint;
    providerId: Principal;
}
export interface Review {
    bookingId: string;
    createdAt: bigint;
    comment: string;
    customerId: Principal;
    rating: bigint;
    providerId: Principal;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum BookingStatus {
    pending = "pending",
    paid = "paid",
    completed = "completed",
    rejected = "rejected",
    accepted = "accepted"
}
export enum ServiceCategory {
    plumber = "plumber",
    electrician = "electrician",
    mechanic = "mechanic",
    deepCleaning = "deepCleaning",
    pestControl = "pestControl",
    acService = "acService"
}
export enum UserRole {
    admin = "admin",
    provider = "provider",
    customer = "customer"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    adminApproveProvider(providerId: Principal, approve: boolean): Promise<void>;
    adminGetAllBookings(_dateFilter: string | null): Promise<Array<Booking>>;
    adminGetAllProviders(): Promise<Array<ProviderProfile>>;
    adminGetPendingProviders(): Promise<Array<ProviderProfile>>;
    adminGetRevenueStats(): Promise<Array<RevenueStats>>;
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    createBooking(providerId: Principal, serviceCategory: ServiceCategory, customerName: string, customerPhone: string, customerLocation: string, scheduledDate: string, scheduledTime: string): Promise<string>;
    getAllApprovedProviders(): Promise<Array<ProviderProfile>>;
    getApprovedProviders(category: ServiceCategory): Promise<Array<ProviderProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getMyBookingsAsCustomer(): Promise<Array<Booking>>;
    getMyBookingsAsProvider(): Promise<Array<Booking>>;
    getMyProfile(): Promise<User>;
    getMyProviderProfile(): Promise<ProviderProfile>;
    getReviewsForProvider(providerId: Principal): Promise<Array<Review>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    loginWithCredentials(email: string, passwordHash: Uint8Array): Promise<[UserRole, string]>;
    markBookingCompleted(bookingId: string): Promise<void>;
    markBookingPaid(bookingId: string): Promise<void>;
    registerCustomer(email: string, passwordHash: Uint8Array, name: string): Promise<void>;
    registerProvider(email: string, passwordHash: Uint8Array, name: string, serviceCategory: ServiceCategory): Promise<void>;
    respondToBooking(bookingId: string, accept: boolean): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitReview(bookingId: string, rating: bigint, comment: string): Promise<string>;
    uploadIdProof(blobId: string): Promise<void>;
}
