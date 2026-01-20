import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint, datetime } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// ============================================================================
// ENUMS - All enums used across the system
// ============================================================================

// User mark state - determines visibility and permissions
export const markStateEnum = mysqlEnum("markState", [
  "outside",      // Not logged in or no Mark
  "initiate",     // Has activated a Mark, basic access
  "member",       // Full access, can claim passes
  "inner_circle", // Planning notes, draft drops
  "dormant",      // Inactive 90+ days
  "restricted",   // Temporary restrictions
  "revoked"       // Unmarked, lost access
]);

// Clearance state for acquiring Marks
export const clearanceStateEnum = mysqlEnum("clearanceState", [
  "none",     // No clearance requested
  "applied",  // Request pending
  "granted",  // Approved, can acquire
  "expired",  // Code expired
  "denied"    // Request denied
]);

// User roles for admin/staff access (legacy column name is userRole in DB)
export const userRoleEnum = mysqlEnum("userRole", [
  "public",
  "marked_initiate",
  "marked_member",
  "marked_inner_circle",
  "staff",
  "admin"
]);

// User status enum
export const userStatusEnum = mysqlEnum("userStatus", [
  "active",
  "revoked",
  "banned"
]);

// ============================================================================
// USERS TABLE - Core user table with comm@ specific fields
// ============================================================================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  phoneNumber: varchar("phoneNumber", { length: 32 }).unique(),
  
  // Role and permissions (legacy column)
  role: userRoleEnum.default("public").notNull(),
  status: userStatusEnum.default("active").notNull(),
  
  // Mark identity
  callSign: varchar("callSign", { length: 64 }).unique(),
  chapter: varchar("chapter", { length: 128 }).default("South Jakarta"),
  markState: markStateEnum.default("outside").notNull(),
  rankDate: timestamp("rankDate"), // When mark_state last changed
  
  // Clearance for acquiring Marks
  clearanceState: clearanceStateEnum.default("none").notNull(),
  clearanceExpiresAt: timestamp("clearanceExpiresAt"),
  clearanceCode: varchar("clearanceCode", { length: 32 }),
  
  // Social features
  invitesAvailable: int("invitesAvailable").default(0).notNull(),
  reputationPoints: int("reputationPoints").default(0).notNull(),
  referralCode: varchar("referralCode", { length: 32 }).unique(),
  
  // Status tracking
  lastActiveAt: timestamp("lastActiveAt"),
  revokedReason: text("revokedReason"),
  revokedAt: timestamp("revokedAt"),
  revokedById: int("revokedById"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// OTP TABLE - Phone verification codes with rate limiting
// ============================================================================
export const otpCodes = mysqlTable("otp_codes", {
  id: int("id").autoincrement().primaryKey(),
  phoneNumber: varchar("phoneNumber", { length: 32 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  attempts: int("attempts").default(0).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtpCode = typeof otpCodes.$inferInsert;

// ============================================================================
// USER CREDENTIALS TABLE - Custom auth (admin-created accounts)
// ============================================================================
export const userCredentials = mysqlTable("user_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // Links to users table
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 32 }),
  phoneVerified: boolean("phoneVerified").default(false).notNull(),
  phoneVerifiedAt: timestamp("phoneVerifiedAt"),
  mustChangePassword: boolean("mustChangePassword").default(true).notNull(),
  failedAttempts: int("failedAttempts").default(0).notNull(),
  lockedUntil: timestamp("lockedUntil"),
  lastLoginAt: timestamp("lastLoginAt"),
  lastLoginIp: varchar("lastLoginIp", { length: 45 }),
  createdById: int("createdById").notNull(), // Admin who created this account
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserCredential = typeof userCredentials.$inferSelect;
export type InsertUserCredential = typeof userCredentials.$inferInsert;

// ============================================================================
// CLEARANCE REQUESTS TABLE - Applications to join the collective
// ============================================================================
export const clearanceRequestStatusEnum = mysqlEnum("clearanceRequestStatus", [
  "pending",
  "approved",
  "denied",
  "expired"
]);

export const clearanceRequests = mysqlTable("clearance_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  reason: text("reason").notNull(), // "Why do you protect the culture?"
  vouchUserId: int("vouchUserId"), // Optional: existing member vouching
  vouchCallSign: varchar("vouchCallSign", { length: 64 }),
  status: clearanceRequestStatusEnum.default("pending").notNull(),
  adminNotes: text("adminNotes"),
  reviewedById: int("reviewedById"),
  reviewedAt: timestamp("reviewedAt"),
  expiresAt: timestamp("expiresAt"), // 48hr after approval
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClearanceRequest = typeof clearanceRequests.$inferSelect;
export type InsertClearanceRequest = typeof clearanceRequests.$inferInsert;

// ============================================================================
// DROPS TABLE - Mark Series (formerly "products")
// ============================================================================
export const dropStatusEnum = mysqlEnum("dropStatus", [
  "draft",
  "published",
  "archived"
]);

export const visibilityLevelEnum = mysqlEnum("visibilityLevel", [
  "public_fragment",   // Outside users see blurred/fragments
  "marked_fragment",   // Initiates see more but not full
  "full_context",      // Members see everything
  "inner_only"         // Inner circle exclusive
]);

export const drops = mysqlTable("drops", {
  id: int("id").autoincrement().primaryKey(),
  artistName: varchar("artistName", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique(),
  description: text("description"),
  editionSize: int("editionSize").notNull(),
  status: dropStatusEnum.default("draft").notNull(),
  chapter: varchar("chapter", { length: 64 }).default("South Jakarta"),
  storyBlurb: text("storyBlurb"),
  priceIdr: int("priceIdr"),
  heroImageUrl: varchar("heroImageUrl", { length: 512 }),
  productImages: text("productImages"), // JSON array of image URLs
  availableSizes: text("availableSizes"), // JSON array of sizes
  keyTerms: text("keyTerms"), // JSON array of terms
  tags: text("tags"), // JSON array of tags
  
  // Acquisition controls
  clearanceRequired: boolean("clearanceRequired").default(true).notNull(),
  saleWindowStart: timestamp("saleWindowStart"),
  saleWindowEnd: timestamp("saleWindowEnd"),
  
  // Visibility
  visibilityLevel: visibilityLevelEnum.default("full_context").notNull(),
  
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Drop = typeof drops.$inferSelect;
export type InsertDrop = typeof drops.$inferInsert;

// ============================================================================
// MARKS TABLE - Individual artifacts (formerly "artifacts")
// ============================================================================
export const markStatusEnum = mysqlEnum("markStatus", [
  "unclaimed",  // Purchased but not activated
  "claimed",    // Activated by owner
  "flagged",    // Reported stolen/issue
  "revoked"     // Admin revoked
]);

// Keep using artifacts table with legacy column names for backwards compatibility
// New marks table exists but we'll migrate to it later
export const artifactStatusEnum = mysqlEnum("artifactStatus", [
  "unmarked",
  "marked",
  "flagged",
  "revoked"
]);

export const artifacts = mysqlTable("artifacts", {
  id: int("id").autoincrement().primaryKey(),
  dropId: int("dropId").notNull(),
  serialNumber: varchar("serialNumber", { length: 64 }).notNull().unique(),
  activationCodeHash: varchar("activationCodeHash", { length: 255 }).notNull(),
  editionNumber: int("editionNumber").notNull().default(1),
  status: artifactStatusEnum.default("unmarked").notNull(),
  size: varchar("size", { length: 8 }),
  markedByUserId: int("markedByUserId"),
  markedAt: timestamp("markedAt"),
  flagReason: text("flagReason"),
  flaggedAt: timestamp("flaggedAt"),
  flaggedById: int("flaggedById"),
  revokedReason: text("revokedReason"),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Artifact = typeof artifacts.$inferSelect;
export type InsertArtifact = typeof artifacts.$inferInsert;

// New marks table for Version One Plus (will migrate data later)
export const marks = mysqlTable("marks", {
  id: int("id").autoincrement().primaryKey(),
  dropId: int("dropId").notNull(),
  serial: varchar("serial", { length: 64 }).notNull().unique(),
  activationCode: varchar("activationCode", { length: 255 }).notNull(),
  editionNumber: int("editionNumber").notNull().default(1),
  status: markStatusEnum.default("unclaimed").notNull(),
  size: varchar("size", { length: 8 }),
  chapter: varchar("chapter", { length: 64 }).default("South Jakarta"),
  ownerId: int("ownerId"),
  activatedAt: timestamp("activatedAt"),
  flagReason: text("flagReason"),
  flaggedAt: timestamp("flaggedAt"),
  flaggedById: int("flaggedById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Mark = typeof marks.$inferSelect;
export type InsertMark = typeof marks.$inferInsert;

// ============================================================================
// MEMORY LOGS TABLE - Permanent history for each Mark
// ============================================================================
export const memoryTypeEnum = mysqlEnum("memoryType", [
  "activation",       // Mark was activated
  "event_attended",   // Attended an event
  "decision_visible", // Saw a decision/announcement
  "chapter_change",   // Changed chapters
  "unmarking",        // Mark was revoked
  "state_change",     // mark_state changed
  "mark_revoked"      // Admin revoked the mark
]);

export const memoryLogs = mysqlTable("memory_logs", {
  id: int("id").autoincrement().primaryKey(),
  markId: int("markId").notNull(),
  userId: int("userId").notNull(),
  memoryType: memoryTypeEnum.notNull(),
  referenceId: int("referenceId"), // ID of event/decision/etc
  referenceType: varchar("referenceType", { length: 64 }), // "event", "drop", etc
  description: text("description"),
  visibilityLevel: visibilityLevelEnum.default("full_context").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MemoryLog = typeof memoryLogs.$inferSelect;
export type InsertMemoryLog = typeof memoryLogs.$inferInsert;

// ============================================================================
// MARKING LOGS TABLE - Audit trail for marking attempts (legacy)
// ============================================================================
export const markingResultEnum = mysqlEnum("markingResult", [
  "success",
  "failed"
]);

export const markingLogs = mysqlTable("marking_logs", {
  id: int("id").autoincrement().primaryKey(),
  artifactId: int("artifactId").notNull(),
  userId: int("userId"),
  result: markingResultEnum.notNull(),
  failureReason: text("failureReason"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MarkingLog = typeof markingLogs.$inferSelect;
export type InsertMarkingLog = typeof markingLogs.$inferInsert;

// ============================================================================
// EVENTS TABLE - Secret gatherings
// ============================================================================
export const eventStatusEnum = mysqlEnum("eventStatus", [
  "draft",
  "published",
  "completed",
  "cancelled"
]);

export const eventVisibilityEnum = mysqlEnum("eventVisibility", [
  "member",       // Members and above
  "inner_circle"  // Inner circle only
]);

export const eventAccessTypeEnum = mysqlEnum("eventAccessType", [
  "invite_only",   // Requires invitation
  "members_only",  // Open to verified members
  "open"           // Open to all
]);

export const eventSecretLevelEnum = mysqlEnum("eventSecretLevel", [
  "low",
  "medium",
  "high"
]);

export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique(),
  chapter: varchar("chapter", { length: 128 }).default("South Jakarta").notNull(),
  description: text("description"),
  tagline: varchar("tagline", { length: 255 }), // One-liner "what it is"
  rules: text("rules"), // Event code of conduct
  capacity: int("capacity").notNull(),
  
  // Eligibility
  eligibilityMinState: markStateEnum.default("member").notNull(),
  contentVisibility: eventVisibilityEnum.default("member").notNull(),
  accessType: eventAccessTypeEnum.default("members_only").notNull(),
  secretLevel: eventSecretLevelEnum.default("medium"),
  
  // Location (hidden until reveal)
  city: varchar("city", { length: 128 }),
  area: varchar("area", { length: 128 }), // Neighborhood/district
  venueName: varchar("venueName", { length: 255 }),
  venueAddress: text("venueAddress"),
  locationText: text("locationText"),
  locationRevealHoursBefore: int("locationRevealHoursBefore").default(24).notNull(),
  locationRevealAt: timestamp("locationRevealAt"),
  coordinates: varchar("coordinates", { length: 64 }), // lat,lng
  
  // Media
  coverImageUrl: text("coverImageUrl"),
  
  // Tags for filtering
  tags: text("tags"), // JSON array: ["music", "fashion", "secret"]
  
  // Timing (legacy eventDate kept for compatibility)
  eventDate: timestamp("eventDate"),
  startDatetime: timestamp("startDatetime"),
  endDatetime: timestamp("endDatetime"),
  
  // Hero ordering
  featuredOrder: int("featuredOrder").default(0), // 0 = not featured, 1+ = order in hero
  
  status: eventStatusEnum.default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

// ============================================================================
// EVENT PASSES TABLE - Claimed passes for events
// ============================================================================
export const passStatusEnum = mysqlEnum("passStatus", [
  "claimed",
  "used",
  "revoked",
  "expired"
]);

export const eventPasses = mysqlTable("event_passes", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  userId: int("userId").notNull(),
  markId: int("markId"), // The Mark used to claim this pass
  passStatus: passStatusEnum.default("claimed").notNull(),
  
  // QR/Scannable code
  scannableCode: varchar("scannableCode", { length: 128 }).notNull().unique(),
  qrPayload: varchar("qrPayload", { length: 128 }).notNull().unique(),
  
  // Plus one
  plusOneName: varchar("plusOneName", { length: 128 }),
  
  // Rules acceptance
  rulesAcceptedAt: timestamp("rulesAcceptedAt"),
  
  claimedAt: timestamp("claimedAt").defaultNow().notNull(),
  usedAt: timestamp("usedAt"),
  revokedAt: timestamp("revokedAt"),
  revokedReason: text("revokedReason"),
  revokedById: int("revokedById"),
});

export type EventPass = typeof eventPasses.$inferSelect;
export type InsertEventPass = typeof eventPasses.$inferInsert;

// ============================================================================
// CHECK-IN LOGS TABLE - Event door control audit trail
// ============================================================================
export const checkInResultEnum = mysqlEnum("checkInResult", [
  "accepted",
  "rejected"
]);

export const checkInLogs = mysqlTable("check_in_logs", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  eventPassId: int("eventPassId"),
  scannedByUserId: int("scannedByUserId").notNull(),
  result: checkInResultEnum.notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CheckInLog = typeof checkInLogs.$inferSelect;
export type InsertCheckInLog = typeof checkInLogs.$inferInsert;

// ============================================================================
// AUDIT LOGS TABLE - General admin action audit trail
// ============================================================================
export const auditActionEnum = mysqlEnum("auditAction", [
  "drop_created",
  "drop_published",
  "drop_archived",
  "marks_generated",
  "mark_flagged",
  "mark_reissued",
  "mark_revoked",
  "mark_acquired",
  "event_created",
  "event_published",
  "event_cancelled",
  "pass_revoked",
  "user_revoked",
  "user_banned",
  "user_role_changed",
  "user_state_changed",
  "clearance_approved",
  "clearance_denied",
  "image_uploaded",
  "ugc_uploaded",
  "password_reset",
  "credential_created",
  "credential_deleted",
  "account_locked",
  "account_unlocked",
  "phone_verified"
]);

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  action: auditActionEnum.notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }),
  targetType: varchar("targetType", { length: 64 }),
  targetId: int("targetId"),
  targetIdentifier: varchar("targetIdentifier", { length: 128 }),
  description: text("description"),
  previousValue: text("previousValue"),
  newValue: text("newValue"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ============================================================================
// DOCTRINE CARDS TABLE - Content for Inside feed
// ============================================================================
export const doctrineVisibilityEnum = mysqlEnum("doctrineVisibility", [
  "initiate",     // All marked users
  "member",       // Members and above
  "inner_circle"  // Inner circle only
]);

export const doctrineCards = mysqlTable("doctrine_cards", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  imageUrl: varchar("imageUrl", { length: 512 }),
  chapter: varchar("chapter", { length: 64 }),
  visibility: doctrineVisibilityEnum.default("member").notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DoctrineCard = typeof doctrineCards.$inferSelect;
export type InsertDoctrineCard = typeof doctrineCards.$inferInsert;

// ============================================================================
// RATE LIMITS TABLE - For tracking rate limiting
// ============================================================================
export const rateLimits = mysqlTable("rate_limits", {
  id: int("id").autoincrement().primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  count: int("count").default(1).notNull(),
  windowStart: timestamp("windowStart").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RateLimit = typeof rateLimits.$inferSelect;
export type InsertRateLimit = typeof rateLimits.$inferInsert;

// ============================================================================
// UGC MEDIA TABLE - Curated user-generated content for drops/marks
// ============================================================================
export const ugcMediaTypeEnum = mysqlEnum("ugcMediaType", [
  "image",
  "video"
]);

export const ugcVisibilityEnum = mysqlEnum("ugcVisibility", [
  "public",
  "inside_only"
]);

export const ugcModerationStatusEnum = mysqlEnum("ugcModerationStatus", [
  "pending",
  "approved",
  "rejected"
]);

export const ugcMedia = mysqlTable("ugc_media", {
  id: int("id").autoincrement().primaryKey(),
  type: ugcMediaTypeEnum.notNull(),
  storageUrl: varchar("storageUrl", { length: 512 }).notNull(),
  thumbnailUrl: varchar("thumbnailUrl", { length: 512 }),
  dropId: int("dropId"),
  markId: int("markId"),
  caption: varchar("caption", { length: 140 }),
  visibility: ugcVisibilityEnum.default("public").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  moderationStatus: ugcModerationStatusEnum.default("approved").notNull(),
  rejectionReason: varchar("rejectionReason", { length: 255 }),
  holderCallsign: varchar("holderCallsign", { length: 64 }),
  chapter: varchar("chapter", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UgcMedia = typeof ugcMedia.$inferSelect;
export type InsertUgcMedia = typeof ugcMedia.$inferInsert;

// ============================================================================
// UGC CONSENT TABLE - Consent logging for UGC
// ============================================================================
export const ugcConsentStatusEnum = mysqlEnum("ugcConsentStatus", [
  "granted",
  "pending",
  "revoked"
]);

export const ugcConsent = mysqlTable("ugc_consent", {
  id: int("id").autoincrement().primaryKey(),
  ugcMediaId: int("ugcMediaId").notNull(),
  consentStatus: ugcConsentStatusEnum.default("granted").notNull(),
  consentNote: text("consentNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UgcConsent = typeof ugcConsent.$inferSelect;
export type InsertUgcConsent = typeof ugcConsent.$inferInsert;

// ============================================================================
// ORDERS TABLE - Mark acquisition orders
// ============================================================================
export const orderStatusEnum = mysqlEnum("orderStatus", [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled"
]);

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dropId: int("dropId").notNull(),
  markId: int("markId"), // Assigned after confirmation
  status: orderStatusEnum.default("pending").notNull(),
  
  // Shipping info
  shippingName: varchar("shippingName", { length: 255 }),
  shippingPhone: varchar("shippingPhone", { length: 32 }),
  shippingAddress: text("shippingAddress"),
  shippingCity: varchar("shippingCity", { length: 128 }),
  shippingPostalCode: varchar("shippingPostalCode", { length: 16 }),
  
  // Size selection
  selectedSize: varchar("selectedSize", { length: 8 }),
  
  // Payment (placeholder for now)
  totalIdr: int("totalIdr"),
  paymentMethod: varchar("paymentMethod", { length: 64 }),
  paymentReference: varchar("paymentReference", { length: 128 }),
  paidAt: timestamp("paidAt"),
  
  // Tracking
  trackingNumber: varchar("trackingNumber", { length: 128 }),
  shippedAt: timestamp("shippedAt"),
  deliveredAt: timestamp("deliveredAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;


// ============================================================================
// NOTIFICATION SUBSCRIPTIONS TABLE - Browser push notification subscriptions
// ============================================================================
export const notificationSubscriptions = mysqlTable("notification_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(), // Public key
  auth: text("auth").notNull(), // Auth secret
  userAgent: varchar("userAgent", { length: 512 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationSubscription = typeof notificationSubscriptions.$inferSelect;
export type InsertNotificationSubscription = typeof notificationSubscriptions.$inferInsert;

// ============================================================================
// NOTIFICATION PREFERENCES TABLE - User notification settings
// ============================================================================
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  newDrops: boolean("newDrops").default(true).notNull(),
  newEvents: boolean("newEvents").default(true).notNull(),
  eventReminders: boolean("eventReminders").default(true).notNull(),
  exclusiveContent: boolean("exclusiveContent").default(true).notNull(),
  referralUpdates: boolean("referralUpdates").default(true).notNull(),
  systemAnnouncements: boolean("systemAnnouncements").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

// ============================================================================
// NOTIFICATIONS TABLE - Individual notifications sent to users
// ============================================================================
export const notificationTypeEnum = mysqlEnum("notificationType", [
  "new_drop",
  "new_event",
  "event_reminder",
  "exclusive_content",
  "referral_joined",
  "referral_marked",
  "system_announcement",
  "reputation_milestone"
]);

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: notificationTypeEnum.notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  data: text("data"), // JSON for additional data (e.g., dropId, eventId)
  isRead: boolean("isRead").default(false).notNull(),
  sentAt: timestamp("sentAt"),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ============================================================================
// EVENT RSVPS TABLE - Event attendance tracking
// ============================================================================
export const rsvpStatusEnum = mysqlEnum("rsvpStatus", [
  "pending",
  "confirmed",
  "cancelled",
  "attended",
  "no_show"
]);

export const eventRsvps = mysqlTable("event_rsvps", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  userId: int("userId").notNull(),
  status: rsvpStatusEnum.default("pending").notNull(),
  qrCode: varchar("qrCode", { length: 64 }).unique(), // Unique check-in code
  plusOneName: varchar("plusOneName", { length: 128 }),
  plusOneCheckedIn: boolean("plusOneCheckedIn").default(false).notNull(),
  checkedInAt: timestamp("checkedInAt"),
  checkedInById: int("checkedInById"), // Staff who checked them in
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EventRsvp = typeof eventRsvps.$inferSelect;
export type InsertEventRsvp = typeof eventRsvps.$inferInsert;

// ============================================================================
// REPUTATION EVENTS TABLE - Point history for leaderboard
// ============================================================================
export const reputationEventTypeEnum = mysqlEnum("reputationEventType", [
  "first_mark",       // First artifact marked: 100 points
  "additional_mark",  // Additional marks: 50 points each
  "event_attendance", // Attending an event: 50 points
  "referral_joined",  // Referred user joined: 100 points
  "referral_marked",  // Referred user marked: 200 points
  "early_adopter",    // Bonus for early members: 500 points
  "inner_circle",     // Promoted to inner circle: 1000 points
  "admin_bonus",      // Admin-granted bonus
  "admin_penalty"     // Admin-applied penalty
]);

export const reputationEvents = mysqlTable("reputation_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventType: reputationEventTypeEnum.notNull(),
  points: int("points").notNull(),
  referenceId: int("referenceId"), // Related entity ID (markId, eventId, etc.)
  referenceType: varchar("referenceType", { length: 64 }), // "mark", "event", "referral"
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReputationEvent = typeof reputationEvents.$inferSelect;
export type InsertReputationEvent = typeof reputationEvents.$inferInsert;

// ============================================================================
// REFERRALS TABLE - Referral tracking
// ============================================================================
export const referralStatusEnum = mysqlEnum("referralStatus", [
  "pending",    // Referred user hasn't joined yet
  "joined",     // Referred user created account
  "marked",     // Referred user completed marking
  "expired"     // Referral link expired (30 days)
]);

export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(), // User who referred
  referredUserId: int("referredUserId"), // User who was referred (null until they join)
  referralCode: varchar("referralCode", { length: 32 }).notNull(), // The code used
  status: referralStatusEnum.default("pending").notNull(),
  joinedAt: timestamp("joinedAt"),
  markedAt: timestamp("markedAt"),
  referrerPointsAwarded: int("referrerPointsAwarded").default(0).notNull(),
  expiresAt: timestamp("expiresAt").notNull(), // 30 days from creation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;


// ============================================================================
// SPONSOR TIER ENUM
// ============================================================================
export const sponsorTierEnum = mysqlEnum("sponsorTier", [
  "platinum",   // Top tier - logo everywhere, exclusive access
  "gold",       // Premium - logo on homepage, event pages
  "silver",     // Standard - logo on sponsors page, event pages
  "bronze"      // Basic - logo on sponsors page
]);

// ============================================================================
// SPONSOR STATUS ENUM
// ============================================================================
export const sponsorStatusEnum = mysqlEnum("sponsorStatus", [
  "active",     // Currently sponsoring
  "pending",    // Awaiting approval/payment
  "expired",    // Sponsorship ended
  "paused"      // Temporarily paused
]);

// ============================================================================
// SPONSORS TABLE - Brand sponsors and partners
// ============================================================================
export const sponsors = mysqlTable("sponsors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  logoUrl: varchar("logoUrl", { length: 512 }),
  websiteUrl: varchar("websiteUrl", { length: 512 }),
  tier: sponsorTierEnum.notNull().default("bronze"),
  status: sponsorStatusEnum.notNull().default("pending"),
  contactName: varchar("contactName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 255 }),
  contractStartDate: datetime("contractStartDate"),
  contractEndDate: datetime("contractEndDate"),
  totalImpressions: int("totalImpressions").notNull().default(0),
  totalClicks: int("totalClicks").notNull().default(0),
  displayOrder: int("displayOrder").notNull().default(0),
  showOnHomepage: boolean("showOnHomepage").notNull().default(true),
  createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updatedAt").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Sponsor = typeof sponsors.$inferSelect;
export type InsertSponsor = typeof sponsors.$inferInsert;

// ============================================================================
// SPONSOR EVENTS TABLE - Link sponsors to specific events
// ============================================================================
export const sponsorEvents = mysqlTable("sponsor_events", {
  id: int("id").autoincrement().primaryKey(),
  sponsorId: int("sponsorId").notNull(),
  eventId: int("eventId").notNull(),
  isPrimarySponsor: boolean("isPrimarySponsor").notNull().default(false),
  customMessage: text("customMessage"),
  createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type SponsorEvent = typeof sponsorEvents.$inferSelect;
export type InsertSponsorEvent = typeof sponsorEvents.$inferInsert;

// ============================================================================
// SPONSOR DROPS TABLE - Link sponsors to specific drops
// ============================================================================
export const sponsorDrops = mysqlTable("sponsor_drops", {
  id: int("id").autoincrement().primaryKey(),
  sponsorId: int("sponsorId").notNull(),
  dropId: int("dropId").notNull(),
  isPrimarySponsor: boolean("isPrimarySponsor").notNull().default(false),
  customMessage: text("customMessage"),
  createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type SponsorDrop = typeof sponsorDrops.$inferSelect;
export type InsertSponsorDrop = typeof sponsorDrops.$inferInsert;

// ============================================================================
// SPONSOR ANALYTICS TABLE - Track impressions and clicks
// ============================================================================
export const sponsorAnalytics = mysqlTable("sponsor_analytics", {
  id: int("id").autoincrement().primaryKey(),
  sponsorId: int("sponsorId").notNull(),
  eventType: varchar("eventType", { length: 50 }).notNull(), // 'impression', 'click', 'hover'
  pageType: varchar("pageType", { length: 50 }).notNull(), // 'homepage', 'event', 'drop', 'sponsors'
  referenceId: int("referenceId"), // eventId or dropId if applicable
  userId: int("userId"), // null for anonymous
  userAgent: text("userAgent"),
  ipHash: varchar("ipHash", { length: 64 }), // Hashed IP for deduplication
  createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type SponsorAnalytic = typeof sponsorAnalytics.$inferSelect;
export type InsertSponsorAnalytic = typeof sponsorAnalytics.$inferInsert;

// ============================================================================
// SPONSOR INQUIRIES TABLE - Potential sponsor contact requests
// ============================================================================
export const sponsorInquiries = mysqlTable("sponsor_inquiries", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 255 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 50 }),
  sponsorTier: sponsorTierEnum,
  message: text("message"),
  status: varchar("status", { length: 50 }).notNull().default("new"), // new, contacted, converted, rejected
  notes: text("notes"),
  createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updatedAt").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type SponsorInquiry = typeof sponsorInquiries.$inferSelect;
export type InsertSponsorInquiry = typeof sponsorInquiries.$inferInsert;
