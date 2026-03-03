import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Blob "mo:core/Blob";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor {
  // Hardcoded admin password SHA-256 hash for "admin123"
  // Corresponds to hex: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
  let adminPasswordSHA256 = Blob.fromArray([
    0x24, 0x0b, 0xe5, 0x18, 0xfa, 0xbd, 0x27, 0x24, 0xdd, 0xb6, 0xf0, 0x4e, 0xeb, 0x1d, 0xa5, 0x96, 0x74, 0x48, 0xd7, 0xe8, 0x31, 0xc0, 0x8c, 0x8f, 0xa8, 0x22, 0x80, 0x9f, 0x74, 0xc7, 0x20, 0xa9,
  ]);

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  type UserRole = { #customer; #provider; #admin };
  type ServiceCategory = { #mechanic; #electrician; #plumber; #acService; #deepCleaning; #pestControl };
  type ApprovalStatus = { #pending; #approved; #rejected };
  type BookingStatus = { #pending; #accepted; #rejected; #completed; #paid };

  type User = {
    principal : Principal;
    email : Text;
    passwordHash : Blob;
    name : Text;
    role : UserRole;
  };

  type ProviderProfile = {
    userId : Principal;
    name : Text;
    email : Text;
    serviceCategory : ServiceCategory;
    idProofBlobId : ?Text;
    approvalStatus : ApprovalStatus;
    avgRating : Float;
    totalReviews : Nat;
    totalEarnings : Nat;
  };

  type Booking = {
    id : Text;
    customerId : Principal;
    providerId : Principal;
    serviceCategory : ServiceCategory;
    customerName : Text;
    customerPhone : Text;
    customerLocation : Text;
    scheduledDate : Text;
    scheduledTime : Text;
    status : BookingStatus;
    createdAt : Int;
    amount : Nat;
  };

  type Review = {
    bookingId : Text;
    customerId : Principal;
    providerId : Principal;
    rating : Nat;
    comment : Text;
    createdAt : Int;
  };

  public type UserProfile = {
    name : Text;
    email : Text;
    role : UserRole;
  };

  type RevenueStats = {
    category : ServiceCategory;
    bookingCount : Nat;
    totalRevenue : Nat;
  };

  let users = Map.empty<Principal, User>();
  let providerProfiles = Map.empty<Principal, ProviderProfile>();
  let bookings = Map.empty<Text, Booking>();
  let reviews = Map.empty<Text, Review>();
  var bookingCounter : Nat = 0;
  var reviewCounter : Nat = 0;

  func generateBookingId() : Text {
    bookingCounter += 1;
    "BOOKING-" # bookingCounter.toText();
  };

  func generateReviewId() : Text {
    reviewCounter += 1;
    "REVIEW-" # reviewCounter.toText();
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    switch (users.get(caller)) {
      case (?user) {
        ?{
          name = user.name;
          email = user.email;
          role = user.role;
        };
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (users.get(user)) {
      case (?u) {
        ?{
          name = u.name;
          email = u.email;
          role = u.role;
        };
      };
      case (null) { null };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    switch (users.get(caller)) {
      case (?user) {
        let updatedUser = {
          user with
          name = profile.name;
          email = profile.email;
        };
        users.add(caller, updatedUser);
      };
      case (null) {
        Runtime.trap("User not found");
      };
    };
  };

  public shared ({ caller }) func registerCustomer(email : Text, passwordHash : Blob, name : Text) : async () {
    if (users.values().any(func(u : User) : Bool { u.email == email })) {
      Runtime.trap("Email already registered");
    };
    let user : User = {
      principal = caller;
      email;
      passwordHash;
      name;
      role = #customer;
    };
    users.add(caller, user);
    accessControlState.userRoles.add(caller, #user);
  };

  public shared ({ caller }) func registerProvider(email : Text, passwordHash : Blob, name : Text, serviceCategory : ServiceCategory) : async () {
    if (users.values().any(func(u : User) : Bool { u.email == email })) {
      Runtime.trap("Email already registered");
    };
    let user : User = {
      principal = caller;
      email;
      passwordHash;
      name;
      role = #provider;
    };
    users.add(caller, user);

    let providerProfile : ProviderProfile = {
      userId = caller;
      name;
      email;
      serviceCategory;
      idProofBlobId = null;
      approvalStatus = #pending;
      avgRating = 0.0;
      totalReviews = 0;
      totalEarnings = 0;
    };
    providerProfiles.add(caller, providerProfile);
    accessControlState.userRoles.add(caller, #user);
  };

  public shared ({ caller }) func loginWithCredentials(email : Text, passwordHash : Blob) : async (UserRole, Text) {
    // Special admin login - register admin role in access control system
    if (
      email == "admin@homeserve.com" and
      passwordHash.size() == adminPasswordSHA256.size() and
      passwordHash.toArray() == adminPasswordSHA256.toArray()
    ) {
      accessControlState.userRoles.add(caller, #admin);
      return (#admin, "Admin");
    };

    // Regular user login
    for (user in users.values()) {
      if (user.email == email and user.passwordHash == passwordHash) {
        // Ensure user is registered in access control system
        // This handles cases where user was registered before but role wasn't set
        switch (AccessControl.getUserRole(accessControlState, user.principal)) {
          case (#guest) {
            accessControlState.userRoles.add(user.principal, #user);
          };
          case (_) {
            // Already registered, do nothing
          };
        };
        return (user.role, user.name);
      };
    };
    Runtime.trap("Invalid credentials");
  };

  public query ({ caller }) func getMyProfile() : async User {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their profile");
    };
    switch (users.get(caller)) {
      case (?user) { user };
      case (null) { Runtime.trap("User not found") };
    };
  };

  module ProviderHelper {
    public func compare(p1 : ProviderProfile, p2 : ProviderProfile) : Order.Order {
      Float.compare(p2.avgRating, p1.avgRating);
    };
  };

  public query ({ caller }) func getApprovedProviders(category : ServiceCategory) : async [ProviderProfile] {
    // Public endpoint - no authorization required
    providerProfiles.values().toArray().filter(
      func(p : ProviderProfile) : Bool { p.serviceCategory == category and p.approvalStatus == #approved }
    ).sort();
  };

  public query ({ caller }) func getAllApprovedProviders() : async [ProviderProfile] {
    // Public endpoint - no authorization required
    providerProfiles.values().toArray().filter(
      func(p : ProviderProfile) : Bool { p.approvalStatus == #approved }
    );
  };

  public shared ({ caller }) func uploadIdProof(blobId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload ID proof");
    };
    switch (providerProfiles.get(caller)) {
      case (?profile) {
        let updatedProfile = { profile with idProofBlobId = ?blobId };
        providerProfiles.add(caller, updatedProfile);
      };
      case (null) { Runtime.trap("Provider profile not found") };
    };
  };

  public query ({ caller }) func getMyProviderProfile() : async ProviderProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their provider profile");
    };
    switch (providerProfiles.get(caller)) {
      case (?profile) { profile };
      case (null) { Runtime.trap("Provider profile not found") };
    };
  };

  public shared ({ caller }) func createBooking(
    providerId : Principal,
    serviceCategory : ServiceCategory,
    customerName : Text,
    customerPhone : Text,
    customerLocation : Text,
    scheduledDate : Text,
    scheduledTime : Text
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create bookings");
    };
    switch (users.get(caller)) {
      case (?user) {
        if (user.role != #customer) {
          Runtime.trap("Only customers can create bookings");
        };
      };
      case (null) {
        Runtime.trap("User not found");
      };
    };
    switch (providerProfiles.get(providerId)) {
      case (?provider) {
        if (provider.approvalStatus != #approved) {
          Runtime.trap("Provider is not approved");
        };
      };
      case (null) {
        Runtime.trap("Provider not found");
      };
    };

    let bookingId = generateBookingId();
    let booking : Booking = {
      id = bookingId;
      customerId = caller;
      providerId;
      serviceCategory;
      customerName;
      customerPhone;
      customerLocation;
      scheduledDate;
      scheduledTime;
      status = #pending;
      createdAt = Time.now();
      amount = 0;
    };
    bookings.add(bookingId, booking);
    bookingId;
  };

  public query ({ caller }) func getMyBookingsAsCustomer() : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their bookings");
    };
    bookings.values().toArray().filter(func(_booking : Booking) : Bool { _booking.customerId == caller });
  };

  public query ({ caller }) func getMyBookingsAsProvider() : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their bookings");
    };
    bookings.values().toArray().filter(func(_booking : Booking) : Bool { _booking.providerId == caller });
  };

  public shared ({ caller }) func respondToBooking(bookingId : Text, accept : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can respond to bookings");
    };
    switch (bookings.get(bookingId)) {
      case (?booking) {
        if (booking.providerId != caller) {
          Runtime.trap("Only the provider can respond to this booking");
        };
        if (booking.status != #pending) {
          Runtime.trap("Booking is not in pending status");
        };
        bookings.add(
          bookingId,
          { booking with status = if accept { #accepted } else { #rejected } },
        );
      };
      case (null) { Runtime.trap("Booking not found") };
    };
  };

  public shared ({ caller }) func markBookingCompleted(bookingId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark bookings as completed");
    };
    switch (bookings.get(bookingId)) {
      case (?booking) {
        if (booking.providerId != caller) {
          Runtime.trap("Only the provider can mark this booking as completed");
        };
        if (booking.status != #accepted) {
          Runtime.trap("Booking must be accepted first");
        };
        bookings.add(bookingId, { booking with status = #completed });
      };
      case (null) { Runtime.trap("Booking not found") };
    };
  };

  public shared ({ caller }) func markBookingPaid(bookingId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark bookings as paid");
    };
    switch (bookings.get(bookingId)) {
      case (?booking) {
        if (booking.customerId != caller) {
          Runtime.trap("Only the customer can mark this booking as paid");
        };
        if (booking.status != #completed) {
          Runtime.trap("Booking must be completed first");
        };
        bookings.add(bookingId, { booking with status = #paid });

        switch (providerProfiles.get(booking.providerId)) {
          case (?profile) {
            let updatedProfile = {
              profile with totalEarnings = profile.totalEarnings + booking.amount
            };
            providerProfiles.add(booking.providerId, updatedProfile);
          };
          case (null) { Runtime.trap("Provider not found") };
        };
      };
      case (null) { Runtime.trap("Booking not found") };
    };
  };

  public shared ({ caller }) func submitReview(bookingId : Text, rating : Nat, comment : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit reviews");
    };
    if (rating < 1 or rating > 5) {
      Runtime.trap("Rating must be between 1 and 5");
    };
    switch (bookings.get(bookingId)) {
      case (?booking) {
        if (booking.customerId != caller) {
          Runtime.trap("Only the customer can submit a review for this booking");
        };
        if (booking.status != #paid) {
          Runtime.trap("Booking must be paid to submit review");
        };

        let reviewId = generateReviewId();
        let review : Review = {
          bookingId;
          customerId = booking.customerId;
          providerId = booking.providerId;
          rating;
          comment;
          createdAt = Time.now();
        };
        reviews.add(reviewId, review);

        switch (providerProfiles.get(booking.providerId)) {
          case (?profile) {
            let newTotalReviews = profile.totalReviews + 1;
            let newAvg = ((profile.avgRating * profile.totalReviews.toFloat()) + rating.toFloat()) / (newTotalReviews.toFloat());
            let updatedProfile = {
              profile with avgRating = newAvg; totalReviews = newTotalReviews
            };
            providerProfiles.add(booking.providerId, updatedProfile);
          };
          case (null) { Runtime.trap("Provider not found") };
        };

        reviewId;
      };
      case (null) { Runtime.trap("Booking not found") };
    };
  };

  public query ({ caller }) func getReviewsForProvider(providerId : Principal) : async [Review] {
    // Public endpoint - no authorization required
    reviews.values().toArray().filter(func(_review : Review) : Bool { _review.providerId == providerId });
  };

  public query ({ caller }) func adminGetPendingProviders() : async [ProviderProfile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    providerProfiles.values().toArray().filter(func(_profile : ProviderProfile) : Bool { _profile.approvalStatus == #pending });
  };

  public shared ({ caller }) func adminApproveProvider(providerId : Principal, approve : Bool) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (providerProfiles.get(providerId)) {
      case (?profile) {
        let updatedProfile = { profile with approvalStatus = if approve { #approved } else { #rejected } };
        providerProfiles.add(providerId, updatedProfile);
      };
      case (null) { Runtime.trap("Provider not found") };
    };
  };

  public query ({ caller }) func adminGetAllBookings(_dateFilter : ?Text) : async [Booking] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let allBookings = bookings.values().toArray();
    switch (_dateFilter) {
      case (?dateFilter) {
        allBookings.filter(func(b : Booking) : Bool { b.scheduledDate == dateFilter });
      };
      case (null) {
        allBookings;
      };
    };
  };

  public query ({ caller }) func adminGetAllProviders() : async [ProviderProfile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    providerProfiles.values().toArray();
  };

  public query ({ caller }) func adminGetRevenueStats() : async [RevenueStats] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let categories : [ServiceCategory] = [#mechanic, #electrician, #plumber, #acService, #deepCleaning, #pestControl];
    let stats = categories.map(
      func(category : ServiceCategory) : RevenueStats {
        let categoryBookings = bookings.values().toArray().filter(
          func(b : Booking) : Bool { b.serviceCategory == category and b.status == #paid }
        );
        let totalRevenue = categoryBookings.foldLeft(
          0,
          func(acc : Nat, b : Booking) : Nat { acc + b.amount }
        );
        {
          category = category;
          bookingCount = categoryBookings.size();
          totalRevenue = totalRevenue;
        };
      }
    );
    stats;
  };
};
