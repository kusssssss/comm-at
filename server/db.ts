import { eq, and, or, desc, gte, lt, sql, count, gt, inArray, like, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as crypto from "crypto";
import { nanoid } from "nanoid";
import { 
  users, InsertUser, User,
  otpCodes, InsertOtpCode,
  drops, InsertDrop,
  artifacts, InsertArtifact,
  markingLogs, InsertMarkingLog,
  events, InsertEvent,
  eventPasses, InsertEventPass,
  eventRsvps, InsertEventRsvp,
  checkInLogs, InsertCheckInLog,
  auditLogs, InsertAuditLog,
  doctrineCards, InsertDoctrineCard,
  rateLimits,
  clearanceRequests, InsertClearanceRequest,
  memoryLogs, InsertMemoryLog,
  marks, InsertMark,
  userCredentials, InsertUserCredential, UserCredential,
  // Social tables
  posts, InsertPost, Post,
  comments, InsertComment, Comment,
  likes, InsertLike, Like,
  follows, InsertFollow, Follow,
  userProfiles, InsertUserProfile, UserProfile,
  bookmarks, InsertBookmark, Bookmark
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER FUNCTIONS
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      phoneNumber: user.phoneNumber ?? null,
      role: user.role ?? (user.openId === ENV.ownerOpenId ? 'admin' : 'public'),
      callSign: user.callSign ?? null,
      chapter: user.chapter ?? 'South Jakarta',
      status: user.status ?? 'active',
      lastSignedIn: user.lastSignedIn ?? new Date(),
    };

    const updateSet: Record<string, unknown> = {
      lastSignedIn: new Date(),
    };

    if (user.name !== undefined) updateSet.name = user.name;
    if (user.email !== undefined) updateSet.email = user.email;
    if (user.loginMethod !== undefined) updateSet.loginMethod = user.loginMethod;
    if (user.phoneNumber !== undefined) updateSet.phoneNumber = user.phoneNumber;
    if (user.role !== undefined) updateSet.role = user.role;
    if (user.callSign !== undefined) updateSet.callSign = user.callSign;
    if (user.chapter !== undefined) updateSet.chapter = user.chapter;
    if (user.status !== undefined) updateSet.status = user.status;

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByPhone(phoneNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByCallSign(callSign: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.callSign, callSign)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTestUsers() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    id: users.id,
    openId: users.openId,
    name: users.name,
    email: users.email,
    role: users.role,
    markState: users.markState,
    callSign: users.callSign,
  }).from(users).where(like(users.openId, 'test-%'));
  return result;
}

export async function updateUserRole(userId: number, role: User['role'], callSign?: string, chapter?: string) {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Partial<InsertUser> = { role };
  if (callSign) updateData.callSign = callSign;
  if (chapter) updateData.chapter = chapter;
  
  await db.update(users).set(updateData).where(eq(users.id, userId));
}

export async function revokeUser(userId: number, reason: string, revokedById: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    status: 'revoked',
    revokedReason: reason,
    revokedAt: new Date(),
    revokedById,
  }).where(eq(users.id, userId));
}

export async function banUser(userId: number, revokedById: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    status: 'banned',
    revokedAt: new Date(),
    revokedById,
  }).where(eq(users.id, userId));
}

export async function getAllUsers(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
}

export async function getMarkedUsers(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users)
    .where(sql`${users.role} IN ('marked_initiate', 'marked_member', 'marked_inner_circle')`)
    .orderBy(desc(users.createdAt))
    .limit(limit);
}

// ============================================================================
// OTP FUNCTIONS
// ============================================================================

export async function createOtp(phoneNumber: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  
  await db.insert(otpCodes).values({
    phoneNumber,
    code,
    expiresAt,
  });
  
  return code;
}

export async function verifyOtp(phoneNumber: string, code: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select().from(otpCodes)
    .where(and(
      eq(otpCodes.phoneNumber, phoneNumber),
      eq(otpCodes.code, code),
      gte(otpCodes.expiresAt, new Date()),
      sql`${otpCodes.usedAt} IS NULL`
    ))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  
  if (result.length === 0) return false;
  
  // Mark as used
  await db.update(otpCodes).set({ usedAt: new Date() }).where(eq(otpCodes.id, result[0].id));
  return true;
}

export async function incrementOtpAttempts(phoneNumber: string) {
  const db = await getDb();
  if (!db) return;
  
  const recent = await db.select().from(otpCodes)
    .where(eq(otpCodes.phoneNumber, phoneNumber))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  
  if (recent.length > 0) {
    await db.update(otpCodes)
      .set({ attempts: recent[0].attempts + 1 })
      .where(eq(otpCodes.id, recent[0].id));
  }
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export async function checkRateLimit(identifier: string, action: string, maxCount: number, windowMinutes: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return true; // Allow if DB unavailable
  
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
  
  const result = await db.select().from(rateLimits)
    .where(and(
      eq(rateLimits.identifier, identifier),
      eq(rateLimits.action, action),
      gte(rateLimits.windowStart, windowStart)
    ))
    .limit(1);
  
  if (result.length === 0) {
    await db.insert(rateLimits).values({ identifier, action, count: 1, windowStart: new Date() });
    return true;
  }
  
  if (result[0].count >= maxCount) {
    return false;
  }
  
  await db.update(rateLimits)
    .set({ count: result[0].count + 1 })
    .where(eq(rateLimits.id, result[0].id));
  
  return true;
}

// ============================================================================
// DROP FUNCTIONS
// ============================================================================

export async function createDrop(data: InsertDrop) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(drops).values(data);
  return result[0].insertId;
}

export async function getDropById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(drops).where(eq(drops.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllDrops() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(drops).orderBy(desc(drops.createdAt));
}

export async function publishDrop(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(drops).set({ status: 'published', publishedAt: new Date() }).where(eq(drops.id, id));
}

export async function archiveDrop(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(drops).set({ status: 'archived' }).where(eq(drops.id, id));
}

// ============================================================================
// ARTIFACT FUNCTIONS
// ============================================================================

export function hashActivationCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function createArtifact(data: InsertArtifact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(artifacts).values(data);
}

export async function generateArtifacts(dropId: number, count: number): Promise<{ serials: string[], codes: string[] }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const drop = await getDropById(dropId);
  if (!drop) throw new Error("Drop not found");
  
  const serials: string[] = [];
  const codes: string[] = [];
  
  for (let i = 1; i <= count; i++) {
    const serial = `${drop.artistName.substring(0, 3).toUpperCase()}-${dropId.toString().padStart(4, '0')}-${i.toString().padStart(4, '0')}`;
    const activationCode = nanoid(12).toUpperCase();
    
    serials.push(serial);
    codes.push(activationCode);
    
    await db.insert(artifacts).values({
      dropId,
      serialNumber: serial,
      activationCodeHash: hashActivationCode(activationCode),
    });
  }
  
  return { serials, codes };
}

export async function getArtifactBySerial(serialNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(artifacts).where(eq(artifacts.serialNumber, serialNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getArtifactById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(artifacts).where(eq(artifacts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getArtifactsByDrop(dropId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(artifacts).where(eq(artifacts.dropId, dropId)).orderBy(artifacts.serialNumber);
}

export async function getArtifactsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(artifacts).where(eq(artifacts.markedByUserId, userId));
}

export async function markArtifact(artifactId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Use transaction-like approach with status check
  const artifact = await getArtifactById(artifactId);
  if (!artifact || artifact.status !== 'unmarked') return false;
  
  const result = await db.update(artifacts)
    .set({
      status: 'marked',
      markedByUserId: userId,
      markedAt: new Date(),
    })
    .where(and(
      eq(artifacts.id, artifactId),
      eq(artifacts.status, 'unmarked')
    ));
  
  return true;
}

export async function flagArtifact(artifactId: number, reason: string, flaggedById: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(artifacts).set({
    status: 'flagged',
    flagReason: reason,
    flaggedAt: new Date(),
    flaggedById,
  }).where(eq(artifacts.id, artifactId));
}

export async function reissueActivationCode(artifactId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  
  const artifact = await getArtifactById(artifactId);
  if (!artifact || artifact.status !== 'unmarked') return null;
  
  const newCode = nanoid(12).toUpperCase();
  await db.update(artifacts)
    .set({ activationCodeHash: hashActivationCode(newCode) })
    .where(eq(artifacts.id, artifactId));
  
  return newCode;
}

// ============================================================================
// MARKING LOG FUNCTIONS
// ============================================================================

export async function createMarkingLog(data: InsertMarkingLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(markingLogs).values(data);
}

export async function getMarkingLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(markingLogs).orderBy(desc(markingLogs.createdAt)).limit(limit);
}

// ============================================================================
// EVENT FUNCTIONS
// ============================================================================

export async function createEvent(data: InsertEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(events).values(data);
  return result[0].insertId;
}

export async function getEventById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events).orderBy(desc(events.createdAt));
}

export async function getPublishedEvents() {
  const db = await getDb();
  if (!db) return [];
  // Note: Database has eventStatus column, but Drizzle schema uses 'status'
  // Using raw SQL query to work around schema mismatch
  const result = await db.execute(sql`SELECT * FROM events WHERE eventStatus = 'published' ORDER BY eventDate DESC`);
  return ((result as any)[0] || []) as any[];
}

export async function updateEvent(id: number, data: Partial<InsertEvent>) {
  const db = await getDb();
  if (!db) return;
  await db.update(events).set(data).where(eq(events.id, id));
}

export async function publishEvent(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(events).set({ status: 'published', publishedAt: new Date() }).where(eq(events.id, id));
}

export async function cancelEvent(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(events).set({ status: 'cancelled' }).where(eq(events.id, id));
}

export async function getEventPassCount(eventId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(eventPasses)
    .where(and(
      eq(eventPasses.eventId, eventId),
      sql`${eventPasses.passStatus} != 'revoked'`
    ));
  return result[0]?.count ?? 0;
}

// ============================================================================
// EVENT PASS FUNCTIONS
// ============================================================================

export async function createEventPass(
  eventId: number, 
  userId: number, 
  scannableCode?: string, 
  plusOneName?: string
): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Check capacity
  const event = await getEventById(eventId);
  if (!event) return null;
  
  const currentCount = await getEventPassCount(eventId);
  if (currentCount >= event.capacity) return null;
  
  // Check if user already has pass
  const existing = await db.select().from(eventPasses)
    .where(and(
      eq(eventPasses.eventId, eventId),
      eq(eventPasses.userId, userId)
    ))
    .limit(1);
  
  if (existing.length > 0) return existing[0].qrPayload;
  
  const qrPayload = `PASS-${nanoid(16)}`;
  const finalScannableCode = scannableCode || `SC-${nanoid(12)}`;
  
  await db.insert(eventPasses).values({
    eventId,
    userId,
    qrPayload,
    scannableCode: finalScannableCode,
    plusOneName: plusOneName || null,
  });
  
  return qrPayload;
}

export async function getEventPassByQr(qrPayload: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(eventPasses).where(eq(eventPasses.qrPayload, qrPayload)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getEventPassByUserAndEvent(userId: number, eventId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(eventPasses)
    .where(and(
      eq(eventPasses.userId, userId),
      eq(eventPasses.eventId, eventId)
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getEventPasses(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(eventPasses).where(eq(eventPasses.eventId, eventId));
}

export async function getEventPassesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(eventPasses).where(eq(eventPasses.userId, userId));
}

export async function hasUserAttendedEvent(userId: number, eventId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select().from(eventPasses)
    .where(and(
      eq(eventPasses.userId, userId),
      eq(eventPasses.eventId, eventId),
      isNotNull(eventPasses.checkedInAt)
    ))
    .limit(1);
  
  return result.length > 0;
}

// Waitlist functions
export async function createEventPassWithWaitlist(
  eventId: number,
  userId: number,
  isWaitlisted: boolean,
  waitlistPosition?: number,
  plusOneName?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const qrPayload = `EP-${nanoid(16)}`;
  const scannableCode = `SC-${nanoid(12)}`;
  
  await db.insert(eventPasses).values({
    eventId,
    userId,
    qrPayload,
    scannableCode,
    plusOneName: plusOneName || null,
    isWaitlisted,
    waitlistPosition: isWaitlisted ? waitlistPosition : null,
    waitlistedAt: isWaitlisted ? new Date() : null,
  });
  
  return { qrPayload, isWaitlisted, waitlistPosition };
}

export async function promoteFromWaitlist(passId: number) {
  const db = await getDb();
  if (!db) return false;
  
  await db.update(eventPasses).set({
    isWaitlisted: false,
    waitlistPosition: null,
    promotedFromWaitlistAt: new Date(),
  }).where(eq(eventPasses.id, passId));
  
  return true;
}

export async function updateWaitlistPosition(passId: number, newPosition: number) {
  const db = await getDb();
  if (!db) return false;
  
  await db.update(eventPasses).set({
    waitlistPosition: newPosition,
  }).where(eq(eventPasses.id, passId));
  
  return true;
}

export async function getWaitlistedPasses(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(eventPasses)
    .where(and(
      eq(eventPasses.eventId, eventId),
      eq(eventPasses.isWaitlisted, true),
      sql`${eventPasses.passStatus} != 'revoked'`,
      sql`${eventPasses.passStatus} != 'expired'`
    ))
    .orderBy(eventPasses.waitlistPosition);
}

export async function getConfirmedPassCount(eventId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ count: count() }).from(eventPasses)
    .where(and(
      eq(eventPasses.eventId, eventId),
      eq(eventPasses.isWaitlisted, false),
      sql`${eventPasses.passStatus} != 'revoked'`,
      sql`${eventPasses.passStatus} != 'expired'`
    ));
  
  return result[0]?.count || 0;
}

export async function getWaitlistCount(eventId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ count: count() }).from(eventPasses)
    .where(and(
      eq(eventPasses.eventId, eventId),
      eq(eventPasses.isWaitlisted, true),
      sql`${eventPasses.passStatus} != 'revoked'`,
      sql`${eventPasses.passStatus} != 'expired'`
    ));
  
  return result[0]?.count || 0;
}

export async function markPassUsed(passId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(eventPasses).set({ passStatus: 'used', usedAt: new Date() }).where(eq(eventPasses.id, passId));
  return true;
}

export async function revokePass(passId: number, reason: string, revokedById: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(eventPasses).set({
    passStatus: 'revoked',
    revokedAt: new Date(),
    revokedReason: reason,
    revokedById,
  }).where(eq(eventPasses.id, passId));
}

// ============================================================================
// CHECK-IN LOG FUNCTIONS
// ============================================================================

export async function createCheckInLog(data: InsertCheckInLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(checkInLogs).values(data);
}

export async function getCheckInLogs(eventId?: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  if (eventId) {
    return db.select().from(checkInLogs)
      .where(eq(checkInLogs.eventId, eventId))
      .orderBy(desc(checkInLogs.createdAt))
      .limit(limit);
  }
  
  return db.select().from(checkInLogs).orderBy(desc(checkInLogs.createdAt)).limit(limit);
}

// ============================================================================
// CHECK-IN FUNCTIONS
// ============================================================================

export async function getEventPassByScannableCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(eventPasses)
    .where(eq(eventPasses.scannableCode, code))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function checkInPass(
  passId: number, 
  staffUserId: number, 
  reputationPoints: number = 10
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: 'Database not available' };
  
  // Get the pass
  const passResult = await db.select().from(eventPasses).where(eq(eventPasses.id, passId)).limit(1);
  if (passResult.length === 0) {
    return { success: false, error: 'Pass not found' };
  }
  
  const pass = passResult[0];
  
  // Check if already checked in
  if (pass.checkedInAt) {
    return { success: false, error: 'Already checked in' };
  }
  
  // Check if pass is valid
  if (pass.passStatus === 'revoked') {
    return { success: false, error: 'Pass has been revoked' };
  }
  
  if (pass.passStatus === 'expired') {
    return { success: false, error: 'Pass has expired' };
  }
  
  // Update pass with check-in info
  await db.update(eventPasses).set({
    checkedInAt: new Date(),
    checkedInById: staffUserId,
    reputationAwarded: reputationPoints,
    passStatus: 'used',
    usedAt: new Date(),
  }).where(eq(eventPasses.id, passId));
  
  // Award reputation points to user
  await db.update(users).set({
    reputationPoints: sql`${users.reputationPoints} + ${reputationPoints}`,
  }).where(eq(users.id, pass.userId));
  
  // Create check-in log
  await db.insert(checkInLogs).values({
    eventId: pass.eventId,
    eventPassId: passId,
    scannedByUserId: staffUserId,
    result: 'accepted',
    reason: `Checked in, awarded ${reputationPoints} reputation points`,
  });
  
  return { success: true };
}

export async function getEventAttendance(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    passId: eventPasses.id,
    userId: eventPasses.userId,
    userName: users.name,
    callSign: users.callSign,
    plusOneName: eventPasses.plusOneName,
    claimedAt: eventPasses.claimedAt,
    checkedInAt: eventPasses.checkedInAt,
    checkedInById: eventPasses.checkedInById,
    reputationAwarded: eventPasses.reputationAwarded,
    passStatus: eventPasses.passStatus,
  })
    .from(eventPasses)
    .innerJoin(users, eq(eventPasses.userId, users.id))
    .where(eq(eventPasses.eventId, eventId))
    .orderBy(desc(eventPasses.checkedInAt));
  
  return result;
}

export async function getEventCheckInStats(eventId: number) {
  const db = await getDb();
  if (!db) return { total: 0, checkedIn: 0, pending: 0 };
  
  const passes = await db.select({
    checkedInAt: eventPasses.checkedInAt,
    passStatus: eventPasses.passStatus,
  }).from(eventPasses).where(eq(eventPasses.eventId, eventId));
  
  const total = passes.length;
  const checkedIn = passes.filter(p => p.checkedInAt !== null).length;
  const pending = passes.filter(p => p.checkedInAt === null && p.passStatus === 'claimed').length;
  
  return { total, checkedIn, pending };
}

// ============================================================================
// AUDIT LOG FUNCTIONS
// ============================================================================

export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(data);
}

export async function getAuditLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

// ============================================================================
// DOCTRINE CARD FUNCTIONS
// ============================================================================

export async function createDoctrineCard(data: InsertDoctrineCard) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(doctrineCards).values(data);
}

export async function getDoctrineCards() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(doctrineCards).orderBy(desc(doctrineCards.isPinned), doctrineCards.sortOrder);
}

export async function updateDoctrineCard(id: number, data: Partial<InsertDoctrineCard>) {
  const db = await getDb();
  if (!db) return;
  await db.update(doctrineCards).set(data).where(eq(doctrineCards.id, id));
}

export async function deleteDoctrineCard(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(doctrineCards).where(eq(doctrineCards.id, id));
}


// ============================================================================
// UGC MEDIA FUNCTIONS
// ============================================================================

import { ugcMedia, InsertUgcMedia, ugcConsent, InsertUgcConsent } from "../drizzle/schema";

export async function createUgcMedia(data: InsertUgcMedia) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ugcMedia).values(data);
  return result[0].insertId;
}

export async function getUgcMediaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(ugcMedia).where(eq(ugcMedia.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUgcMedia(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ugcMedia).orderBy(ugcMedia.sortOrder, desc(ugcMedia.createdAt)).limit(limit);
}

export async function getUgcMediaByDrop(dropId: number, visibility?: 'public' | 'inside_only') {
  const db = await getDb();
  if (!db) return [];
  
  if (visibility) {
    return db.select().from(ugcMedia)
      .where(and(eq(ugcMedia.dropId, dropId), eq(ugcMedia.visibility, visibility)))
      .orderBy(ugcMedia.sortOrder, desc(ugcMedia.createdAt));
  }
  
  return db.select().from(ugcMedia)
    .where(eq(ugcMedia.dropId, dropId))
    .orderBy(ugcMedia.sortOrder, desc(ugcMedia.createdAt));
}

// Legacy alias
export const getUgcMediaByArtifact = getUgcMediaByDrop;

export async function updateUgcMedia(id: number, data: Partial<InsertUgcMedia>) {
  const db = await getDb();
  if (!db) return;
  await db.update(ugcMedia).set(data).where(eq(ugcMedia.id, id));
}

export async function deleteUgcMedia(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(ugcMedia).where(eq(ugcMedia.id, id));
}

// ============================================================================
// UGC CONSENT FUNCTIONS
// ============================================================================

export async function createUgcConsent(data: InsertUgcConsent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(ugcConsent).values(data);
}

export async function getUgcConsentByMediaId(ugcMediaId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(ugcConsent).where(eq(ugcConsent.ugcMediaId, ugcMediaId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}


// ============================================================================
// COMMUNITY STATS FUNCTIONS
// ============================================================================

export async function getCommunityStats() {
  const db = await getDb();
  if (!db) return {
    totalMarked: 0,
    totalArtifacts: 0,
    totalDrops: 0,
    totalEvents: 0,
    recentMarkings: [],
    activeChapters: [],
  };
  
  // Total marked users
  const markedResult = await db.select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(sql`${users.role} IN ('marked_initiate', 'marked_member', 'marked_inner_circle')`);
  const totalMarked = markedResult[0]?.count || 0;
  
  // Total artifacts
  const artifactsResult = await db.select({ count: sql<number>`COUNT(*)` })
    .from(artifacts);
  const totalArtifacts = artifactsResult[0]?.count || 0;
  
  // Total drops
  const dropsResult = await db.select({ count: sql<number>`COUNT(*)` })
    .from(drops)
    .where(eq(drops.status, 'published'));
  const totalDrops = dropsResult[0]?.count || 0;
  
  // Total events
  const eventsResult = await db.select({ count: sql<number>`COUNT(*)` })
    .from(events)
    .where(eq(events.status, 'published'));
  const totalEvents = eventsResult[0]?.count || 0;
  
  // Active chapters (unique chapters with marked users)
  const chaptersResult = await db.select({ chapter: users.chapter, count: sql<number>`COUNT(*)` })
    .from(users)
    .where(sql`${users.role} IN ('marked_initiate', 'marked_member', 'marked_inner_circle') AND ${users.chapter} IS NOT NULL`)
    .groupBy(users.chapter)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(10);
  
  const activeChapters = chaptersResult.map(r => ({
    name: r.chapter || 'Unknown',
    count: r.count,
  }));
  
  return {
    totalMarked,
    totalArtifacts,
    totalDrops,
    totalEvents,
    activeChapters,
  };
}

export async function getRecentMarkings(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  
  // Get recent marking logs with user info
  const result = await db.select({
    id: markingLogs.id,
    createdAt: markingLogs.createdAt,
    callSign: users.callSign,
    chapter: users.chapter,
    serialNumber: artifacts.serialNumber,
    dropTitle: drops.title,
  })
    .from(markingLogs)
    .innerJoin(users, eq(markingLogs.userId, users.id))
    .innerJoin(artifacts, eq(markingLogs.artifactId, artifacts.id))
    .innerJoin(drops, eq(artifacts.dropId, drops.id))
    .where(eq(markingLogs.result, 'success'))
    .orderBy(desc(markingLogs.createdAt))
    .limit(limit);
  
  return result;
}

export async function getRecentCheckIns(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    id: checkInLogs.id,
    createdAt: checkInLogs.createdAt,
    callSign: users.callSign,
    chapter: users.chapter,
    eventTitle: events.title,
  })
    .from(checkInLogs)
    .innerJoin(eventPasses, eq(checkInLogs.eventPassId, eventPasses.id))
    .innerJoin(users, eq(eventPasses.userId, users.id))
    .innerJoin(events, eq(eventPasses.eventId, events.id))
    .orderBy(desc(checkInLogs.createdAt))
    .limit(limit);
  
  return result;
}


// ============================================================================
// CLEARANCE REQUEST FUNCTIONS
// ============================================================================

export async function createClearanceRequest(data: {
  userId: number;
  reason: string;
  vouchCallSign?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if user already has pending request
  const existing = await db.select().from(clearanceRequests)
    .where(and(
      eq(clearanceRequests.userId, data.userId),
      eq(clearanceRequests.status, 'pending')
    ))
    .limit(1);
  
  if (existing.length > 0) {
    throw new Error("You already have a pending clearance request");
  }
  
  // Find vouching user if provided
  let vouchUserId: number | undefined;
  if (data.vouchCallSign) {
    const vouchUser = await db.select().from(users)
      .where(eq(users.callSign, data.vouchCallSign))
      .limit(1);
    if (vouchUser.length > 0) {
      vouchUserId = vouchUser[0].id;
    }
  }
  
  const result = await db.insert(clearanceRequests).values({
    userId: data.userId,
    reason: data.reason,
    vouchUserId,
    status: 'pending',
  });
  
  // Update user's clearance state
  await db.update(users)
    .set({ clearanceState: 'applied' })
    .where(eq(users.id, data.userId));
  
  return result[0].insertId;
}

export async function getClearanceRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clearanceRequests)
    .where(eq(clearanceRequests.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getClearanceRequestByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clearanceRequests)
    .where(eq(clearanceRequests.userId, userId))
    .orderBy(desc(clearanceRequests.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPendingClearanceRequests() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: clearanceRequests.id,
    userId: clearanceRequests.userId,
    reason: clearanceRequests.reason,
    vouchUserId: clearanceRequests.vouchUserId,
    status: clearanceRequests.status,
    createdAt: clearanceRequests.createdAt,
    userName: users.name,
    userCallSign: users.callSign,
  })
    .from(clearanceRequests)
    .innerJoin(users, eq(clearanceRequests.userId, users.id))
    .where(eq(clearanceRequests.status, 'pending'))
    .orderBy(desc(clearanceRequests.createdAt));
}

export async function approveClearanceRequest(requestId: number, adminId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const request = await getClearanceRequestById(requestId);
  if (!request) throw new Error("Request not found");
  if (request.status !== 'pending') throw new Error("Request already processed");
  
  // Generate clearance code (valid for 48 hours)
  const clearanceCode = `CLR-${nanoid(12)}`;
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  
  // Update request
  await db.update(clearanceRequests)
    .set({
      status: 'approved',
      reviewedById: adminId,
      reviewedAt: new Date(),
      expiresAt,
    })
    .where(eq(clearanceRequests.id, requestId));
  
  // Update user's clearance state
  await db.update(users)
    .set({
      clearanceState: 'granted',
      clearanceCode,
      clearanceExpiresAt: expiresAt,
    })
    .where(eq(users.id, request.userId));
  
  return { clearanceCode, expiresAt };
}

export async function denyClearanceRequest(requestId: number, adminId: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const request = await getClearanceRequestById(requestId);
  if (!request) throw new Error("Request not found");
  if (request.status !== 'pending') throw new Error("Request already processed");
  
  // Update request
  await db.update(clearanceRequests)
    .set({
      status: 'denied',
      reviewedById: adminId,
      reviewedAt: new Date(),
      adminNotes: reason,
    })
    .where(eq(clearanceRequests.id, requestId));
  
  // Update user's clearance state
  await db.update(users)
    .set({ clearanceState: 'denied' })
    .where(eq(users.id, request.userId));
}

// ============================================================================
// MEMORY LOG FUNCTIONS
// ============================================================================

export async function createMemoryLog(data: {
  userId: number;
  markId?: number;
  memoryType: 'activation' | 'event_attended' | 'chapter_change' | 'state_change' | 'unmarking' | 'mark_revoked';
  referenceId?: number;
  referenceType?: string;
  details?: string;
  visibilityLevel?: 'public_fragment' | 'marked_fragment' | 'full_context' | 'inner_only';
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(memoryLogs).values({
    userId: data.userId,
    markId: data.markId || 0, // markId is required in schema
    memoryType: data.memoryType,
    referenceId: data.referenceId,
    referenceType: data.referenceType,
    description: data.details,
    visibilityLevel: data.visibilityLevel ?? 'full_context',
  });
  
  return result[0].insertId;
}

export async function getMemoryLogsByUserId(userId: number, visibilityLevel?: string) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(memoryLogs)
    .where(eq(memoryLogs.userId, userId))
    .orderBy(desc(memoryLogs.createdAt));
  
  return query;
}

export async function getMemoryLogsByMarkId(markId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(memoryLogs)
    .where(eq(memoryLogs.markId, markId))
    .orderBy(desc(memoryLogs.createdAt));
}

// ============================================================================
// ORDER FUNCTIONS
// ============================================================================

import { orders } from "../drizzle/schema";

export async function createOrder(data: {
  userId: number;
  dropId: number;
  artifactId: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: string;
  size?: string;
  totalAmount: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(orders).values({
    userId: data.userId,
    dropId: data.dropId,
    markId: data.artifactId, // Using markId field
    status: data.status,
    shippingAddress: data.shippingAddress,
    selectedSize: data.size,
    totalIdr: data.totalAmount,
  });
  
  return { id: result[0].insertId };
}

export async function getOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  
  return result[0] || null;
}

export async function updateOrderStatus(orderId: number, status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(orders)
    .set({ status })
    .where(eq(orders.id, orderId));
}

// ============================================================================
// ARTIFACT RESERVATION FUNCTIONS
// ============================================================================

export async function getFirstAvailableArtifact(dropId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(artifacts)
    .where(and(
      eq(artifacts.dropId, dropId),
      eq(artifacts.status, 'unmarked')
    ))
    .orderBy(artifacts.editionNumber)
    .limit(1);
  
  return result[0] || null;
}

export async function reserveArtifact(artifactId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Mark as reserved by setting markedByUserId but keeping status as unmarked
  // until payment is confirmed
  await db.update(artifacts)
    .set({ 
      markedByUserId: userId,
      // Keep status as unmarked until activation
    })
    .where(eq(artifacts.id, artifactId));
}


// ============================================================================
// UNMARKING FUNCTIONS
// ============================================================================

export async function updateUserMarkState(userId: number, markState: 'outside' | 'initiate' | 'member' | 'inner_circle' | 'revoked') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users)
    .set({ markState })
    .where(eq(users.id, userId));
}

export async function revokeArtifact(artifactId: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(artifacts)
    .set({ 
      status: 'revoked',
      revokedReason: reason,
      revokedAt: new Date(),
    })
    .where(eq(artifacts.id, artifactId));
}

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

import {
  notificationSubscriptions, InsertNotificationSubscription,
  notificationPreferences, InsertNotificationPreference,
  notifications, InsertNotification,
  reputationEvents, InsertReputationEvent,
  referrals, InsertReferral,
  sponsors, InsertSponsor,
  sponsorEvents, InsertSponsorEvent,
  sponsorDrops, InsertSponsorDrop,
  sponsorAnalytics, InsertSponsorAnalytic,
  sponsorInquiries, InsertSponsorInquiry
} from "../drizzle/schema";

export async function createNotificationSubscription(data: InsertNotificationSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notificationSubscriptions).values(data);
  return result;
}

export async function getNotificationSubscriptionsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notificationSubscriptions)
    .where(and(
      eq(notificationSubscriptions.userId, userId),
      eq(notificationSubscriptions.isActive, true)
    ));
}

export async function deleteNotificationSubscription(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(notificationSubscriptions).where(eq(notificationSubscriptions.id, id));
}

export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertNotificationPreferences(userId: number, prefs: Partial<InsertNotificationPreference>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getNotificationPreferences(userId);
  if (existing) {
    await db.update(notificationPreferences)
      .set(prefs)
      .where(eq(notificationPreferences.userId, userId));
  } else {
    await db.insert(notificationPreferences).values({ userId, ...prefs });
  }
}

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(data);
  return result;
}

export async function getNotificationsByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ));
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ));
  return result[0]?.count || 0;
}

// ============================================================================
// EVENT RSVP FUNCTIONS
// ============================================================================

export async function createEventRsvp(data: {
  eventId: number;
  userId: number;
  plusOneName?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Generate unique QR code
  const qrCode = `RSVP-${nanoid(12)}`;
  
  const result = await db.insert(eventRsvps).values({
    eventId: data.eventId,
    userId: data.userId,
    qrCode,
    plusOneName: data.plusOneName,
    status: 'confirmed',
  });
  
  return { id: result[0].insertId, qrCode };
}

export async function getEventRsvpByUserAndEvent(userId: number, eventId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(eventRsvps)
    .where(and(
      eq(eventRsvps.userId, userId),
      eq(eventRsvps.eventId, eventId)
    )).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getEventRsvpByQrCode(qrCode: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(eventRsvps)
    .where(eq(eventRsvps.qrCode, qrCode)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getEventRsvps(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(eventRsvps)
    .where(eq(eventRsvps.eventId, eventId))
    .orderBy(desc(eventRsvps.createdAt));
}

export async function getEventRsvpCount(eventId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(eventRsvps)
    .where(and(
      eq(eventRsvps.eventId, eventId),
      inArray(eventRsvps.status, ['pending', 'confirmed'])
    ));
  return result[0]?.count || 0;
}

export async function checkInEventRsvp(qrCode: string, staffId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const rsvp = await getEventRsvpByQrCode(qrCode);
  if (!rsvp) throw new Error("RSVP not found");
  if (rsvp.status === 'attended') throw new Error("Already checked in");
  if (rsvp.status === 'cancelled') throw new Error("RSVP was cancelled");
  
  await db.update(eventRsvps)
    .set({
      status: 'attended',
      checkedInAt: new Date(),
      checkedInById: staffId,
    })
    .where(eq(eventRsvps.qrCode, qrCode));
  
  return rsvp;
}

export async function cancelEventRsvp(userId: number, eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(eventRsvps)
    .set({ status: 'cancelled' })
    .where(and(
      eq(eventRsvps.userId, userId),
      eq(eventRsvps.eventId, eventId)
    ));
}

// ============================================================================
// REPUTATION FUNCTIONS
// ============================================================================

export async function addReputationPoints(data: {
  userId: number;
  eventType: 'first_mark' | 'additional_mark' | 'event_attendance' | 'referral_joined' | 'referral_marked' | 'early_adopter' | 'inner_circle' | 'admin_bonus' | 'admin_penalty';
  points: number;
  referenceId?: number;
  referenceType?: string;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Create reputation event log
  await db.insert(reputationEvents).values({
    userId: data.userId,
    eventType: data.eventType,
    points: data.points,
    referenceId: data.referenceId,
    referenceType: data.referenceType,
    description: data.description,
  });
  
  // Update user's total reputation points
  await db.update(users)
    .set({ 
      reputationPoints: sql`${users.reputationPoints} + ${data.points}` 
    })
    .where(eq(users.id, data.userId));
}

export async function getReputationEvents(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reputationEvents)
    .where(eq(reputationEvents.userId, userId))
    .orderBy(desc(reputationEvents.createdAt))
    .limit(limit);
}

export async function getLeaderboard(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    callSign: users.callSign,
    chapter: users.chapter,
    reputationPoints: users.reputationPoints,
    markState: users.markState,
  }).from(users)
    .where(and(
      gt(users.reputationPoints, 0),
      inArray(users.markState, ['initiate', 'member', 'inner_circle'])
    ))
    .orderBy(desc(users.reputationPoints))
    .limit(limit);
}

export async function getUserRank(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const user = await getUserById(userId);
  if (!user) return 0;
  
  const result = await db.select({ count: count() }).from(users)
    .where(gt(users.reputationPoints, user.reputationPoints || 0));
  
  return (result[0]?.count || 0) + 1;
}

// ============================================================================
// REFERRAL FUNCTIONS
// ============================================================================

export async function generateReferralCode(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if user already has a referral code
  const user = await getUserById(userId);
  if (user?.referralCode) return user.referralCode;
  
  // Generate unique code
  const code = `REF-${nanoid(8).toUpperCase()}`;
  
  // Update user with referral code
  await db.update(users)
    .set({ referralCode: code })
    .where(eq(users.id, userId));
  
  return code;
}

export async function getUserByReferralCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users)
    .where(eq(users.referralCode, code)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createReferral(referrerId: number, referralCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Set expiry to 30 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  const result = await db.insert(referrals).values({
    referrerId,
    referralCode,
    expiresAt,
  });
  
  return result[0].insertId;
}

export async function getReferralsByReferrer(referrerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(referrals)
    .where(eq(referrals.referrerId, referrerId))
    .orderBy(desc(referrals.createdAt));
}

export async function getReferralStats(referrerId: number) {
  const db = await getDb();
  if (!db) return { total: 0, joined: 0, marked: 0, pointsEarned: 0 };
  
  const allReferrals = await getReferralsByReferrer(referrerId);
  const joined = allReferrals.filter(r => r.status === 'joined' || r.status === 'marked').length;
  const marked = allReferrals.filter(r => r.status === 'marked').length;
  const pointsEarned = allReferrals.reduce((sum, r) => sum + (r.referrerPointsAwarded || 0), 0);
  
  return {
    total: allReferrals.length,
    joined,
    marked,
    pointsEarned,
  };
}

export async function updateReferralOnJoin(referralCode: string, referredUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Find the referrer by code
  const referrer = await getUserByReferralCode(referralCode);
  if (!referrer) return null;
  
  // Create referral record
  await db.insert(referrals).values({
    referrerId: referrer.id,
    referredUserId,
    referralCode,
    status: 'joined',
    joinedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  
  // Award points to referrer for join
  await addReputationPoints({
    userId: referrer.id,
    eventType: 'referral_joined',
    points: 100,
    referenceId: referredUserId,
    referenceType: 'user',
    description: 'Referred user joined the collective',
  });
  
  return referrer;
}

export async function updateReferralOnMark(referredUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Find the referral for this user
  const result = await db.select().from(referrals)
    .where(eq(referrals.referredUserId, referredUserId))
    .limit(1);
  
  if (result.length === 0) return null;
  
  const referral = result[0];
  
  // Update referral status
  await db.update(referrals)
    .set({
      status: 'marked',
      markedAt: new Date(),
      referrerPointsAwarded: sql`${referrals.referrerPointsAwarded} + 200`,
    })
    .where(eq(referrals.id, referral.id));
  
  // Award additional points to referrer for marking
  await addReputationPoints({
    userId: referral.referrerId,
    eventType: 'referral_marked',
    points: 200,
    referenceId: referredUserId,
    referenceType: 'user',
    description: 'Referred user completed marking',
  });
  
  return referral;
}


// ============================================================================
// TIER PROGRESS FUNCTIONS
// ============================================================================

export interface UserTierStats {
  marksOwned: number;
  eventsAttended: number;
  referralsMade: number;
}

export async function getUserTierStats(userId: number): Promise<UserTierStats> {
  const db = await getDb();
  if (!db) {
    return { marksOwned: 0, eventsAttended: 0, referralsMade: 0 };
  }
  
  // Count marks owned by user
  const marksResult = await db.select({ count: count() })
    .from(artifacts)
    .where(eq(artifacts.markedByUserId, userId));
  const marksOwned = marksResult[0]?.count || 0;
  
  // Count events attended (checked in)
  const eventsResult = await db.select({ count: count() })
    .from(eventRsvps)
    .where(and(
      eq(eventRsvps.userId, userId),
      eq(eventRsvps.status, 'attended')
    ));
  const eventsAttended = eventsResult[0]?.count || 0;
  
  // Count successful referrals (joined status or higher)
  const referralsResult = await db.select({ count: count() })
    .from(referrals)
    .where(and(
      eq(referrals.referrerId, userId),
      inArray(referrals.status, ['joined', 'marked'])
    ));
  const referralsMade = referralsResult[0]?.count || 0;
  
  return { marksOwned, eventsAttended, referralsMade };
}


// ============================================================================
// SPONSOR FUNCTIONS
// ============================================================================

export async function getSponsors(options?: { 
  status?: 'active' | 'pending' | 'expired' | 'paused';
  tier?: 'platinum' | 'gold' | 'silver' | 'bronze';
  showOnHomepage?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(sponsors);
  const conditions = [];
  
  if (options?.status) {
    conditions.push(eq(sponsors.status, options.status));
  }
  if (options?.tier) {
    conditions.push(eq(sponsors.tier, options.tier));
  }
  if (options?.showOnHomepage !== undefined) {
    conditions.push(eq(sponsors.showOnHomepage, options.showOnHomepage));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  
  return query.orderBy(sponsors.displayOrder, sponsors.tier);
}

export async function getSponsorById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(sponsors).where(eq(sponsors.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getSponsorBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(sponsors).where(eq(sponsors.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createSponsor(data: InsertSponsor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(sponsors).values(data);
  return { id: result[0].insertId };
}

export async function updateSponsor(id: number, data: Partial<InsertSponsor>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(sponsors)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(sponsors.id, id));
}

export async function deleteSponsor(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(sponsors).where(eq(sponsors.id, id));
}

export async function getSponsorsForEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    sponsor: sponsors,
    isPrimarySponsor: sponsorEvents.isPrimarySponsor,
    customMessage: sponsorEvents.customMessage,
  })
    .from(sponsorEvents)
    .innerJoin(sponsors, eq(sponsorEvents.sponsorId, sponsors.id))
    .where(and(
      eq(sponsorEvents.eventId, eventId),
      eq(sponsors.status, 'active')
    ))
    .orderBy(sponsorEvents.isPrimarySponsor, sponsors.tier);
  
  return result;
}

export async function getSponsorsForDrop(dropId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    sponsor: sponsors,
    isPrimarySponsor: sponsorDrops.isPrimarySponsor,
    customMessage: sponsorDrops.customMessage,
  })
    .from(sponsorDrops)
    .innerJoin(sponsors, eq(sponsorDrops.sponsorId, sponsors.id))
    .where(and(
      eq(sponsorDrops.dropId, dropId),
      eq(sponsors.status, 'active')
    ))
    .orderBy(sponsorDrops.isPrimarySponsor, sponsors.tier);
  
  return result;
}

export async function linkSponsorToEvent(sponsorId: number, eventId: number, isPrimary: boolean = false, message?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(sponsorEvents).values({
    sponsorId,
    eventId,
    isPrimarySponsor: isPrimary,
    customMessage: message,
  });
}

export async function unlinkSponsorFromEvent(sponsorId: number, eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(sponsorEvents).where(and(
    eq(sponsorEvents.sponsorId, sponsorId),
    eq(sponsorEvents.eventId, eventId)
  ));
}

export async function linkSponsorToDrop(sponsorId: number, dropId: number, isPrimary: boolean = false, message?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(sponsorDrops).values({
    sponsorId,
    dropId,
    isPrimarySponsor: isPrimary,
    customMessage: message,
  });
}

export async function unlinkSponsorFromDrop(sponsorId: number, dropId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(sponsorDrops).where(and(
    eq(sponsorDrops.sponsorId, sponsorId),
    eq(sponsorDrops.dropId, dropId)
  ));
}

export async function trackSponsorAnalytic(data: {
  sponsorId: number;
  eventType: 'impression' | 'click' | 'hover';
  pageType: 'homepage' | 'event' | 'drop' | 'sponsors';
  referenceId?: number;
  userId?: number;
  userAgent?: string;
  ipHash?: string;
}) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(sponsorAnalytics).values(data);
  
  // Update aggregate counts on sponsor
  if (data.eventType === 'impression') {
    await db.update(sponsors)
      .set({ totalImpressions: sql`${sponsors.totalImpressions} + 1` })
      .where(eq(sponsors.id, data.sponsorId));
  } else if (data.eventType === 'click') {
    await db.update(sponsors)
      .set({ totalClicks: sql`${sponsors.totalClicks} + 1` })
      .where(eq(sponsors.id, data.sponsorId));
  }
}

export async function getSponsorAnalytics(sponsorId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return { impressions: 0, clicks: 0, ctr: 0, byPage: [] };
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Get total impressions
  const impressionsResult = await db.select({ count: count() })
    .from(sponsorAnalytics)
    .where(and(
      eq(sponsorAnalytics.sponsorId, sponsorId),
      eq(sponsorAnalytics.eventType, 'impression'),
      gte(sponsorAnalytics.createdAt, startDate)
    ));
  
  // Get total clicks
  const clicksResult = await db.select({ count: count() })
    .from(sponsorAnalytics)
    .where(and(
      eq(sponsorAnalytics.sponsorId, sponsorId),
      eq(sponsorAnalytics.eventType, 'click'),
      gte(sponsorAnalytics.createdAt, startDate)
    ));
  
  const impressions = impressionsResult[0]?.count || 0;
  const clicks = clicksResult[0]?.count || 0;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  
  // Get breakdown by page type
  const byPageResult = await db.select({
    pageType: sponsorAnalytics.pageType,
    eventType: sponsorAnalytics.eventType,
    count: count(),
  })
    .from(sponsorAnalytics)
    .where(and(
      eq(sponsorAnalytics.sponsorId, sponsorId),
      gte(sponsorAnalytics.createdAt, startDate)
    ))
    .groupBy(sponsorAnalytics.pageType, sponsorAnalytics.eventType);
  
  return { impressions, clicks, ctr, byPage: byPageResult };
}

export async function createSponsorInquiry(data: InsertSponsorInquiry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(sponsorInquiries).values(data);
  return { id: result[0].insertId };
}

export async function getSponsorInquiries(status?: string) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(sponsorInquiries);
  if (status) {
    query = query.where(eq(sponsorInquiries.status, status)) as typeof query;
  }
  
  return query.orderBy(desc(sponsorInquiries.createdAt));
}

export async function updateSponsorInquiry(id: number, data: { status?: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(sponsorInquiries)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(sponsorInquiries.id, id));
}

// ============================================================================
// USER CREDENTIALS FUNCTIONS - Custom Authentication System
// ============================================================================

import * as bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a random temporary password
 */
export function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Create user credentials (admin-only)
 */
export async function createUserCredentials(data: {
  userId: number;
  username: string;
  password: string;
  phoneNumber?: string;
  createdById: number;
}): Promise<{ id: number; tempPassword?: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if username already exists
  const existing = await db.select()
    .from(userCredentials)
    .where(eq(userCredentials.username, data.username))
    .limit(1);
  
  if (existing.length > 0) {
    throw new Error("Username already exists");
  }
  
  // Check if user already has credentials
  const existingUser = await db.select()
    .from(userCredentials)
    .where(eq(userCredentials.userId, data.userId))
    .limit(1);
  
  if (existingUser.length > 0) {
    throw new Error("User already has credentials");
  }
  
  const passwordHash = await hashPassword(data.password);
  
  const result = await db.insert(userCredentials).values({
    userId: data.userId,
    username: data.username,
    passwordHash,
    phoneNumber: data.phoneNumber || null,
    mustChangePassword: true,
    createdById: data.createdById,
  });
  
  return { id: result[0].insertId };
}

/**
 * Get user credentials by username
 */
export async function getCredentialsByUsername(username: string): Promise<UserCredential | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select()
    .from(userCredentials)
    .where(eq(userCredentials.username, username))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Get user credentials by user ID
 */
export async function getCredentialsByUserId(userId: number): Promise<UserCredential | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select()
    .from(userCredentials)
    .where(eq(userCredentials.userId, userId))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Authenticate user with username and password
 */
export async function authenticateUser(username: string, password: string, ipAddress?: string): Promise<{
  success: boolean;
  user?: User;
  credential?: UserCredential;
  error?: string;
  mustChangePassword?: boolean;
}> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };
  
  const credential = await getCredentialsByUsername(username);
  
  if (!credential) {
    return { success: false, error: "Invalid username or password" };
  }
  
  // Check if account is locked
  if (credential.lockedUntil && new Date(credential.lockedUntil) > new Date()) {
    const remainingMinutes = Math.ceil((new Date(credential.lockedUntil).getTime() - Date.now()) / 60000);
    return { success: false, error: `Account locked. Try again in ${remainingMinutes} minutes.` };
  }
  
  // Verify password
  const isValid = await verifyPassword(password, credential.passwordHash);
  
  if (!isValid) {
    // Increment failed attempts
    const newAttempts = credential.failedAttempts + 1;
    const updates: any = { failedAttempts: newAttempts };
    
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
      updates.lockedUntil = lockUntil;
    }
    
    await db.update(userCredentials)
      .set(updates)
      .where(eq(userCredentials.id, credential.id));
    
    const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
    if (remaining > 0) {
      return { success: false, error: `Invalid username or password. ${remaining} attempts remaining.` };
    } else {
      return { success: false, error: `Account locked for ${LOCKOUT_DURATION_MINUTES} minutes due to too many failed attempts.` };
    }
  }
  
  // Get the user
  const user = await getUserById(credential.userId);
  if (!user) {
    return { success: false, error: "User not found" };
  }
  
  // Check if user is banned or revoked
  if (user.status === 'banned' || user.status === 'revoked') {
    return { success: false, error: "Account has been suspended" };
  }
  
  // Reset failed attempts and update last login
  await db.update(userCredentials)
    .set({
      failedAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress || null,
    })
    .where(eq(userCredentials.id, credential.id));
  
  // Update user's last signed in
  await db.update(users)
    .set({ lastSignedIn: new Date(), lastActiveAt: new Date() })
    .where(eq(users.id, user.id));
  
  return {
    success: true,
    user,
    credential,
    mustChangePassword: credential.mustChangePassword,
  };
}

/**
 * Change user password
 */
export async function changePassword(userId: number, newPassword: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const passwordHash = await hashPassword(newPassword);
  
  await db.update(userCredentials)
    .set({
      passwordHash,
      mustChangePassword: false,
    })
    .where(eq(userCredentials.userId, userId));
  
  return true;
}

/**
 * Reset user password (admin)
 */
export async function resetUserPassword(userId: number, adminId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  
  await db.update(userCredentials)
    .set({
      passwordHash,
      mustChangePassword: true,
      failedAttempts: 0,
      lockedUntil: null,
    })
    .where(eq(userCredentials.userId, userId));
  
  // Log the action
  await createAuditLog({
    userId: adminId,
    action: 'password_reset',
    targetType: 'user',
    targetId: userId,
    description: `Password reset by admin ID ${adminId}`,
  });
  
  return tempPassword;
}

/**
 * Bind phone number to credentials
 */
export async function bindPhoneToCredentials(userId: number, phoneNumber: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db.update(userCredentials)
    .set({
      phoneNumber,
      phoneVerified: false,
      phoneVerifiedAt: null,
    })
    .where(eq(userCredentials.userId, userId));
  
  return true;
}

/**
 * Verify phone number
 */
export async function verifyCredentialPhone(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db.update(userCredentials)
    .set({
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
    })
    .where(eq(userCredentials.userId, userId));
  
  return true;
}

/**
 * Get all users with credentials (for admin)
 */
export async function getAllUsersWithCredentials(): Promise<Array<User & { credential?: UserCredential }>> {
  const db = await getDb();
  if (!db) return [];
  
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
  const allCredentials = await db.select().from(userCredentials);
  
  const credentialMap = new Map(allCredentials.map(c => [c.userId, c]));
  
  return allUsers.map(user => ({
    ...user,
    credential: credentialMap.get(user.id),
  }));
}

/**
 * Delete user credentials
 */
export async function deleteUserCredentials(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db.delete(userCredentials).where(eq(userCredentials.userId, userId));
  return true;
}

/**
 * Unlock user account
 */
export async function unlockUserAccount(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db.update(userCredentials)
    .set({
      failedAttempts: 0,
      lockedUntil: null,
    })
    .where(eq(userCredentials.userId, userId));
  
  return true;
}


// ============================================================================
// PERSONAL CIPHER FUNCTIONS
// ============================================================================

import { inviteCodes, recoveryCodes, cipherAuditLogs, InsertInviteCode, InsertRecoveryCode, InsertCipherAuditLog } from "../drizzle/schema";

/**
 * Get invite code by code string
 */
export async function getInviteCodeByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select()
    .from(inviteCodes)
    .where(eq(inviteCodes.code, code))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Create a new invite code
 */
export async function createInviteCode(data: InsertInviteCode) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(inviteCodes).values(data);
  return { id: result[0].insertId };
}

/**
 * Mark invite code as used
 */
export async function useInviteCode(id: number, usedById: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(inviteCodes)
    .set({
      status: 'used',
      usedByUserId: usedById,
      usedAt: new Date(),
    })
    .where(eq(inviteCodes.id, id));
}

/**
 * Get all invite codes (for admin)
 */
export async function getInviteCodes() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(inviteCodes).orderBy(desc(inviteCodes.createdAt));
}

/**
 * Revoke an invite code
 */
export async function revokeInviteCode(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(inviteCodes)
    .set({ status: 'revoked' })
    .where(eq(inviteCodes.id, id));
}

/**
 * Enroll user with cipher
 */
export async function enrollUserCipher(data: {
  userId: number;
  cipherSeed: string;
  deviceFingerprint: string;
  callSign: string;
  layer: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users)
    .set({
      cipherSeed: data.cipherSeed,
      deviceFingerprint: data.deviceFingerprint,
      callSign: data.callSign,
      markState: data.layer as any,
      cipherEnrolledAt: new Date(),
    })
    .where(eq(users.id, data.userId));
}

/**
 * Complete cipher enrollment
 */
export async function completeCipherEnrollment(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users)
    .set({ cipherEnrolledAt: new Date() })
    .where(eq(users.id, userId));
}

// getUserByCallSign already exists above

/**
 * Create recovery code
 */
export async function createRecoveryCode(data: InsertRecoveryCode) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(recoveryCodes).values(data);
}

/**
 * Get unused recovery codes for user
 */
export async function getUnusedRecoveryCodes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(recoveryCodes)
    .where(and(
      eq(recoveryCodes.userId, userId),
      eq(recoveryCodes.usedAt, null as any)
    ));
}

/**
 * Count unused recovery codes
 */
export async function countUnusedRecoveryCodes(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ count: count() })
    .from(recoveryCodes)
    .where(and(
      eq(recoveryCodes.userId, userId),
      eq(recoveryCodes.usedAt, null as any)
    ));
  
  return result[0]?.count || 0;
}

/**
 * Mark recovery code as used
 */
export async function markRecoveryCodeUsed(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(recoveryCodes)
    .set({ usedAt: new Date() })
    .where(eq(recoveryCodes.id, id));
}

/**
 * Delete all recovery codes for user
 */
export async function deleteRecoveryCodes(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(recoveryCodes).where(eq(recoveryCodes.userId, userId));
}

/**
 * Update device fingerprint
 */
export async function updateDeviceFingerprint(userId: number, deviceFingerprint: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users)
    .set({ deviceFingerprint })
    .where(eq(users.id, userId));
}

/**
 * Increment cipher failed attempts
 */
export async function incrementCipherFailedAttempts(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const user = await getUserById(userId);
  const newCount = (user?.failedCipherAttempts || 0) + 1;
  
  await db.update(users)
    .set({ failedCipherAttempts: newCount })
    .where(eq(users.id, userId));
  
  return newCount;
}

/**
 * Reset cipher failed attempts
 */
export async function resetCipherFailedAttempts(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users)
    .set({ failedCipherAttempts: 0 })
    .where(eq(users.id, userId));
}

/**
 * Lock cipher account
 */
export async function lockCipherAccount(userId: number, lockUntil: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users)
    .set({ cipherLockedUntil: lockUntil })
    .where(eq(users.id, userId));
}

/**
 * Unlock cipher account
 */
export async function unlockCipherAccount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users)
    .set({ 
      cipherLockedUntil: null,
      failedCipherAttempts: 0,
    })
    .where(eq(users.id, userId));
}

/**
 * Update user layer
 */
export async function updateUserLayer(userId: number, layer: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users)
    .set({ markState: layer as any })
    .where(eq(users.id, userId));
}

/**
 * Create cipher audit log
 */
export async function createCipherAuditLog(data: InsertCipherAuditLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(cipherAuditLogs).values(data);
}

/**
 * Get cipher audit logs
 */
export async function getCipherAuditLogs(userId?: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(cipherAuditLogs);
  
  if (userId) {
    query = query.where(eq(cipherAuditLogs.userId, userId)) as typeof query;
  }
  
  return query.orderBy(desc(cipherAuditLogs.createdAt)).limit(limit);
}


// ============================================================================
// ACCESS REQUEST (RSVP) FUNCTIONS
// ============================================================================

export async function createAccessRequest(data: {
  eventId: number;
  userId: number;
  requestMessage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if user already has a request for this event
  const existing = await db.select().from(eventRsvps)
    .where(and(
      eq(eventRsvps.eventId, data.eventId),
      eq(eventRsvps.userId, data.userId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    throw new Error("You already have a request for this event");
  }
  
  const result = await db.insert(eventRsvps).values({
    eventId: data.eventId,
    userId: data.userId,
    status: 'pending',
    requestMessage: data.requestMessage || null,
  });
  
  return result[0].insertId;
}

export async function getAccessRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(eventRsvps)
    .where(eq(eventRsvps.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAccessRequestByUserAndEvent(userId: number, eventId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(eventRsvps)
    .where(and(
      eq(eventRsvps.userId, userId),
      eq(eventRsvps.eventId, eventId)
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAccessRequestsByEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: eventRsvps.id,
    eventId: eventRsvps.eventId,
    userId: eventRsvps.userId,
    status: eventRsvps.status,
    requestMessage: eventRsvps.requestMessage,
    adminResponse: eventRsvps.adminResponse,
    respondedById: eventRsvps.respondedById,
    respondedAt: eventRsvps.respondedAt,
    createdAt: eventRsvps.createdAt,
    userName: users.name,
    userCallSign: users.callSign,
    userRole: users.role,
    userChapter: users.chapter,
  })
    .from(eventRsvps)
    .innerJoin(users, eq(eventRsvps.userId, users.id))
    .where(eq(eventRsvps.eventId, eventId))
    .orderBy(desc(eventRsvps.createdAt));
}

export async function getPendingAccessRequests(eventId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const query = db.select({
    id: eventRsvps.id,
    eventId: eventRsvps.eventId,
    userId: eventRsvps.userId,
    status: eventRsvps.status,
    requestMessage: eventRsvps.requestMessage,
    createdAt: eventRsvps.createdAt,
    userName: users.name,
    userCallSign: users.callSign,
    userRole: users.role,
    userChapter: users.chapter,
    eventTitle: events.title,
  })
    .from(eventRsvps)
    .innerJoin(users, eq(eventRsvps.userId, users.id))
    .innerJoin(events, eq(eventRsvps.eventId, events.id))
    .where(eq(eventRsvps.status, 'pending'))
    .orderBy(desc(eventRsvps.createdAt));
  
  if (eventId) {
    return db.select({
      id: eventRsvps.id,
      eventId: eventRsvps.eventId,
      userId: eventRsvps.userId,
      status: eventRsvps.status,
      requestMessage: eventRsvps.requestMessage,
      createdAt: eventRsvps.createdAt,
      userName: users.name,
      userCallSign: users.callSign,
      userRole: users.role,
      userChapter: users.chapter,
      eventTitle: events.title,
    })
      .from(eventRsvps)
      .innerJoin(users, eq(eventRsvps.userId, users.id))
      .innerJoin(events, eq(eventRsvps.eventId, events.id))
      .where(and(
        eq(eventRsvps.status, 'pending'),
        eq(eventRsvps.eventId, eventId)
      ))
      .orderBy(desc(eventRsvps.createdAt));
  }
  
  return query;
}

export async function approveAccessRequest(
  requestId: number, 
  adminId: number, 
  response?: string
) {
  const db = await getDb();
  if (!db) return false;
  
  await db.update(eventRsvps).set({
    status: 'approved',
    adminResponse: response || null,
    respondedById: adminId,
    respondedAt: new Date(),
  }).where(eq(eventRsvps.id, requestId));
  
  return true;
}

export async function denyAccessRequest(
  requestId: number, 
  adminId: number, 
  response?: string
) {
  const db = await getDb();
  if (!db) return false;
  
  await db.update(eventRsvps).set({
    status: 'denied',
    adminResponse: response || null,
    respondedById: adminId,
    respondedAt: new Date(),
  }).where(eq(eventRsvps.id, requestId));
  
  return true;
}

export async function waitlistAccessRequest(
  requestId: number, 
  adminId: number, 
  response?: string
) {
  const db = await getDb();
  if (!db) return false;
  
  await db.update(eventRsvps).set({
    status: 'waitlisted',
    adminResponse: response || null,
    respondedById: adminId,
    respondedAt: new Date(),
  }).where(eq(eventRsvps.id, requestId));
  
  return true;
}

export async function getUserAccessRequests(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: eventRsvps.id,
    eventId: eventRsvps.eventId,
    status: eventRsvps.status,
    requestMessage: eventRsvps.requestMessage,
    adminResponse: eventRsvps.adminResponse,
    respondedAt: eventRsvps.respondedAt,
    createdAt: eventRsvps.createdAt,
    eventTitle: events.title,
    eventDate: events.eventDate,
  })
    .from(eventRsvps)
    .innerJoin(events, eq(eventRsvps.eventId, events.id))
    .where(eq(eventRsvps.userId, userId))
    .orderBy(desc(eventRsvps.createdAt));
}


// ============================================================================
// ADMIN ACCESS REQUEST FUNCTIONS
// ============================================================================

export async function getAllAccessRequests(options: {
  eventId?: number;
  status?: 'pending' | 'approved' | 'denied' | 'waitlisted';
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { requests: [], total: 0 };
  
  const conditions = [];
  
  if (options.eventId) {
    conditions.push(eq(eventRsvps.eventId, options.eventId));
  }
  
  if (options.status) {
    conditions.push(eq(eventRsvps.status, options.status));
  }
  
  if (options.search) {
    conditions.push(
      or(
        like(users.name, `%${options.search}%`),
        like(users.callSign, `%${options.search}%`)
      )
    );
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  // Get total count
  const countResult = await db.select({ count: count() })
    .from(eventRsvps)
    .innerJoin(users, eq(eventRsvps.userId, users.id))
    .innerJoin(events, eq(eventRsvps.eventId, events.id))
    .where(whereClause);
  
  const total = countResult[0]?.count || 0;
  
  // Get paginated results
  const requests = await db.select({
    id: eventRsvps.id,
    eventId: eventRsvps.eventId,
    userId: eventRsvps.userId,
    status: eventRsvps.status,
    requestMessage: eventRsvps.requestMessage,
    adminResponse: eventRsvps.adminResponse,
    respondedById: eventRsvps.respondedById,
    respondedAt: eventRsvps.respondedAt,
    createdAt: eventRsvps.createdAt,
    userName: users.name,
    userCallSign: users.callSign,
    userRole: users.role,
    userChapter: users.chapter,
    userEmail: users.email,
    eventTitle: events.title,
    eventDate: events.eventDate,
    eventVenue: events.venueName,
  })
    .from(eventRsvps)
    .innerJoin(users, eq(eventRsvps.userId, users.id))
    .innerJoin(events, eq(eventRsvps.eventId, events.id))
    .where(whereClause)
    .orderBy(desc(eventRsvps.createdAt))
    .limit(options.limit || 50)
    .offset(options.offset || 0);
  
  return { requests, total };
}

export async function getAccessRequestStats(eventId?: number) {
  const db = await getDb();
  if (!db) return { pending: 0, approved: 0, denied: 0, waitlisted: 0, total: 0 };
  
  const conditions = eventId ? [eq(eventRsvps.eventId, eventId)] : [];
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const result = await db.select({
    status: eventRsvps.status,
    count: count(),
  })
    .from(eventRsvps)
    .where(whereClause)
    .groupBy(eventRsvps.status);
  
  const stats = { pending: 0, approved: 0, denied: 0, waitlisted: 0, total: 0 };
  
  for (const row of result) {
    if (row.status === 'pending') stats.pending = row.count;
    else if (row.status === 'approved') stats.approved = row.count;
    else if (row.status === 'denied') stats.denied = row.count;
    else if (row.status === 'waitlisted') stats.waitlisted = row.count;
    stats.total += row.count;
  }
  
  return stats;
}


// ============================================================================
// SOCIAL FEED FUNCTIONS - Posts, Comments, Likes, Follows
// ============================================================================

// --- POSTS ---

export async function createPost(data: InsertPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(posts).values({
    ...data,
    publishedAt: data.scheduledFor ? null : new Date(),
  });
  
  return { id: result[0].insertId };
}

export async function getPostById(postId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select({
    post: posts,
    author: {
      id: users.id,
      name: users.name,
      callSign: users.callSign,
      role: users.role,
    },
  })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, postId))
    .limit(1);
  
  if (result.length === 0) return null;
  
  return {
    ...result[0].post,
    author: result[0].author,
  };
}

export async function getFeedPosts(options: {
  visibility?: 'public' | 'members' | 'inner_circle';
  limit?: number;
  offset?: number;
  authorId?: number;
  postType?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    isNotNull(posts.publishedAt),
  ];
  
  if (options.visibility) {
    // Show posts at or below the user's visibility level
    const visibilityLevels = ['public', 'members', 'inner_circle'];
    const userLevel = visibilityLevels.indexOf(options.visibility);
    const allowedVisibilities = visibilityLevels.slice(0, userLevel + 1);
    conditions.push(inArray(posts.visibility, allowedVisibilities as any));
  } else {
    conditions.push(eq(posts.visibility, 'public'));
  }
  
  if (options.authorId) {
    conditions.push(eq(posts.authorId, options.authorId));
  }
  
  if (options.postType) {
    conditions.push(eq(posts.postType, options.postType as any));
  }
  
  const result = await db.select({
    post: posts,
    author: {
      id: users.id,
      name: users.name,
      callSign: users.callSign,
      role: users.role,
    },
  })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(...conditions))
    .orderBy(desc(posts.isPinned), desc(posts.publishedAt))
    .limit(options.limit || 20)
    .offset(options.offset || 0);
  
  return result.map(r => ({
    ...r.post,
    author: r.author,
  }));
}

export async function updatePost(postId: number, data: Partial<InsertPost>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(posts)
    .set(data)
    .where(eq(posts.id, postId));
}

export async function deletePost(postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete related comments and likes first
  await db.delete(comments).where(eq(comments.postId, postId));
  await db.delete(likes).where(and(
    eq(likes.targetType, 'post'),
    eq(likes.targetId, postId)
  ));
  await db.delete(bookmarks).where(eq(bookmarks.postId, postId));
  await db.delete(posts).where(eq(posts.id, postId));
}

export async function pinPost(postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(posts)
    .set({ isPinned: true, pinnedAt: new Date() })
    .where(eq(posts.id, postId));
}

export async function unpinPost(postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(posts)
    .set({ isPinned: false, pinnedAt: null })
    .where(eq(posts.id, postId));
}

// --- COMMENTS ---

export async function createComment(data: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(comments).values(data);
  
  // Update post comment count
  await db.update(posts)
    .set({ commentsCount: sql`${posts.commentsCount} + 1` })
    .where(eq(posts.id, data.postId));
  
  // If this is a reply, update parent reply count
  if (data.parentId) {
    await db.update(comments)
      .set({ repliesCount: sql`${comments.repliesCount} + 1` })
      .where(eq(comments.id, data.parentId));
  }
  
  return { id: result[0].insertId };
}

export async function getCommentsByPost(postId: number, options?: {
  limit?: number;
  offset?: number;
  parentId?: number | null;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    eq(comments.postId, postId),
    eq(comments.isHidden, false),
  ];
  
  // If parentId is null, get top-level comments; if specified, get replies
  if (options?.parentId === null || options?.parentId === undefined) {
    conditions.push(sql`${comments.parentId} IS NULL`);
  } else {
    conditions.push(eq(comments.parentId, options.parentId));
  }
  
  const result = await db.select({
    comment: comments,
    user: {
      id: users.id,
      name: users.name,
      callSign: users.callSign,
      role: users.role,
    },
  })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(comments.createdAt))
    .limit(options?.limit || 50)
    .offset(options?.offset || 0);
  
  return result.map(r => ({
    ...r.comment,
    user: r.user,
  }));
}

export async function deleteComment(commentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const comment = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
  if (comment.length === 0) return;
  
  // Delete likes on this comment
  await db.delete(likes).where(and(
    eq(likes.targetType, 'comment'),
    eq(likes.targetId, commentId)
  ));
  
  // Delete the comment
  await db.delete(comments).where(eq(comments.id, commentId));
  
  // Update post comment count
  await db.update(posts)
    .set({ commentsCount: sql`${posts.commentsCount} - 1` })
    .where(eq(posts.id, comment[0].postId));
  
  // If this was a reply, update parent reply count
  if (comment[0].parentId) {
    await db.update(comments)
      .set({ repliesCount: sql`${comments.repliesCount} - 1` })
      .where(eq(comments.id, comment[0].parentId));
  }
}

export async function hideComment(commentId: number, adminId: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(comments)
    .set({
      isHidden: true,
      hiddenReason: reason,
      hiddenById: adminId,
    })
    .where(eq(comments.id, commentId));
}

// --- LIKES ---

export async function toggleLike(userId: number, targetType: 'post' | 'comment', targetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if already liked
  const existing = await db.select()
    .from(likes)
    .where(and(
      eq(likes.userId, userId),
      eq(likes.targetType, targetType),
      eq(likes.targetId, targetId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // Unlike
    await db.delete(likes).where(eq(likes.id, existing[0].id));
    
    // Update count
    if (targetType === 'post') {
      await db.update(posts)
        .set({ likesCount: sql`${posts.likesCount} - 1` })
        .where(eq(posts.id, targetId));
    } else {
      await db.update(comments)
        .set({ likesCount: sql`${comments.likesCount} - 1` })
        .where(eq(comments.id, targetId));
    }
    
    return { liked: false };
  } else {
    // Like
    await db.insert(likes).values({
      userId,
      targetType,
      targetId,
    });
    
    // Update count
    if (targetType === 'post') {
      await db.update(posts)
        .set({ likesCount: sql`${posts.likesCount} + 1` })
        .where(eq(posts.id, targetId));
    } else {
      await db.update(comments)
        .set({ likesCount: sql`${comments.likesCount} + 1` })
        .where(eq(comments.id, targetId));
    }
    
    return { liked: true };
  }
}

export async function getUserLikes(userId: number, targetType: 'post' | 'comment', targetIds: number[]) {
  const db = await getDb();
  if (!db) return [];
  
  if (targetIds.length === 0) return [];
  
  const result = await db.select()
    .from(likes)
    .where(and(
      eq(likes.userId, userId),
      eq(likes.targetType, targetType),
      inArray(likes.targetId, targetIds)
    ));
  
  return result.map(l => l.targetId);
}

// --- FOLLOWS ---

export async function toggleFollow(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (followerId === followingId) {
    throw new Error("Cannot follow yourself");
  }
  
  // Check if already following
  const existing = await db.select()
    .from(follows)
    .where(and(
      eq(follows.followerId, followerId),
      eq(follows.followingId, followingId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // Unfollow
    await db.delete(follows).where(eq(follows.id, existing[0].id));
    
    // Update counts
    await db.update(userProfiles)
      .set({ followingCount: sql`${userProfiles.followingCount} - 1` })
      .where(eq(userProfiles.userId, followerId));
    
    await db.update(userProfiles)
      .set({ followersCount: sql`${userProfiles.followersCount} - 1` })
      .where(eq(userProfiles.userId, followingId));
    
    return { following: false };
  } else {
    // Follow
    await db.insert(follows).values({
      followerId,
      followingId,
    });
    
    // Update counts (create profile if doesn't exist)
    const followerProfile = await db.select().from(userProfiles).where(eq(userProfiles.userId, followerId)).limit(1);
    if (followerProfile.length === 0) {
      await db.insert(userProfiles).values({ userId: followerId, followingCount: 1 });
    } else {
      await db.update(userProfiles)
        .set({ followingCount: sql`${userProfiles.followingCount} + 1` })
        .where(eq(userProfiles.userId, followerId));
    }
    
    const followingProfile = await db.select().from(userProfiles).where(eq(userProfiles.userId, followingId)).limit(1);
    if (followingProfile.length === 0) {
      await db.insert(userProfiles).values({ userId: followingId, followersCount: 1 });
    } else {
      await db.update(userProfiles)
        .set({ followersCount: sql`${userProfiles.followersCount} + 1` })
        .where(eq(userProfiles.userId, followingId));
    }
    
    return { following: true };
  }
}

export async function isFollowing(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select()
    .from(follows)
    .where(and(
      eq(follows.followerId, followerId),
      eq(follows.followingId, followingId)
    ))
    .limit(1);
  
  return result.length > 0;
}

export async function getFollowers(userId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    follow: follows,
    user: {
      id: users.id,
      name: users.name,
      callSign: users.callSign,
      role: users.role,
    },
  })
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, userId))
    .orderBy(desc(follows.createdAt))
    .limit(limit)
    .offset(offset);
  
  return result.map(r => r.user);
}

export async function getFollowing(userId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    follow: follows,
    user: {
      id: users.id,
      name: users.name,
      callSign: users.callSign,
      role: users.role,
    },
  })
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, userId))
    .orderBy(desc(follows.createdAt))
    .limit(limit)
    .offset(offset);
  
  return result.map(r => r.user);
}

// --- USER PROFILES ---

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function upsertUserProfile(userId: number, data: Partial<InsertUserProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getUserProfile(userId);
  
  if (existing) {
    await db.update(userProfiles)
      .set(data)
      .where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({
      userId,
      ...data,
    });
  }
}

// --- BOOKMARKS ---

export async function toggleBookmark(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select()
    .from(bookmarks)
    .where(and(
      eq(bookmarks.userId, userId),
      eq(bookmarks.postId, postId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    await db.delete(bookmarks).where(eq(bookmarks.id, existing[0].id));
    return { bookmarked: false };
  } else {
    await db.insert(bookmarks).values({ userId, postId });
    return { bookmarked: true };
  }
}

export async function getUserBookmarks(userId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    bookmark: bookmarks,
    post: posts,
    author: {
      id: users.id,
      name: users.name,
      callSign: users.callSign,
      role: users.role,
    },
  })
    .from(bookmarks)
    .innerJoin(posts, eq(bookmarks.postId, posts.id))
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt))
    .limit(limit)
    .offset(offset);
  
  return result.map(r => ({
    ...r.post,
    author: r.author,
    bookmarkedAt: r.bookmark.createdAt,
  }));
}

export async function isBookmarked(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select()
    .from(bookmarks)
    .where(and(
      eq(bookmarks.userId, userId),
      eq(bookmarks.postId, postId)
    ))
    .limit(1);
  
  return result.length > 0;
}
