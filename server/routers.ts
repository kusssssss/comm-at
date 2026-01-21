import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { uploadRouter } from "./uploadRouter";
import { cipherRouter } from "./cipherRouter";
import type { User } from "../drizzle/schema";
import { filterDropForVisibility, filterEventForVisibility, getMarkState, getVisibilityMessage } from "./visibility";
import { calculateRevealInfo, getRevealStateLabel, formatLayerName, type RevealInfo } from "./revealLogic";
import { checkDropGating, getDropGatingInfo, getUserLayer, getLayerLabel } from "./gatingLogic";

// ============================================================================
// ROLE GUARDS
// ============================================================================

const markedRoles = ["marked_initiate", "marked_member", "marked_inner_circle"] as const;
const staffRoles = ["staff", "admin"] as const;

function isMarked(user: User): boolean {
  return markedRoles.includes(user.role as typeof markedRoles[number]);
}

function isStaff(user: User): boolean {
  return staffRoles.includes(user.role as typeof staffRoles[number]);
}

function isAdmin(user: User): boolean {
  return user.role === "admin";
}

const markedProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isMarked(ctx.user) && !isStaff(ctx.user)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Marked users only" });
  }
  if (ctx.user.status !== "active") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Your mark has been revoked" });
  }
  return next({ ctx });
});

const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isStaff(ctx.user)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Staff only" });
  }
  return next({ ctx });
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isAdmin(ctx.user)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  }
  return next({ ctx });
});

// ============================================================================
// ROUTERS
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  upload: uploadRouter,
  
  // ============================================================================
  // AUTH ROUTER
  // ============================================================================
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  
  // ============================================================================
  // DEV ROUTER - Development/testing utilities (admin only)
  // ============================================================================
  dev: router({
    // Get list of test users for impersonation
    getTestUsers: adminProcedure.query(async () => {
      const testUsers = await db.getTestUsers();
      return testUsers;
    }),
    
    // Impersonate a test user (creates a new session as that user)
    impersonate: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const targetUser = await db.getUserById(input.userId);
        if (!targetUser) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        
        // Only allow impersonating test users (openId starts with 'test-')
        if (!targetUser.openId.startsWith('test-')) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Can only impersonate test users" });
        }
        
        // Create a new session for the target user using sdk
        const { sdk } = await import("./_core/sdk");
        const token = await sdk.createSessionToken(targetUser.openId, {
          name: targetUser.name || 'Test User',
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        
        return { success: true, user: targetUser };
      }),
      
    // Return to original admin session
    stopImpersonating: protectedProcedure.mutation(async ({ ctx }) => {
      // Clear the current session - user will need to log in again
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
  }),

  // ============================================================================
  // CREDENTIALS ROUTER - Custom Authentication System
  // ============================================================================
  credentials: router({
    // Admin: Create credentials for a user
    create: adminProcedure
      .input(z.object({
        userId: z.number(),
        username: z.string().min(3).max(64).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
        password: z.string().min(8).max(128),
        phoneNumber: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createUserCredentials({
          userId: input.userId,
          username: input.username,
          password: input.password,
          phoneNumber: input.phoneNumber,
          createdById: ctx.user.id,
        });
        
        await db.createAuditLog({
          userId: ctx.user.id,
          action: 'credential_created',
          targetType: 'user',
          targetId: input.userId,
          description: `Created credentials for user ${input.username}`,
        });
        
        return { success: true, id: result.id };
      }),
    
    // Admin: Get all users with their credential status
    listUsers: adminProcedure.query(async () => {
      const users = await db.getAllUsersWithCredentials();
      return users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        hasCredentials: !!u.credential,
        username: u.credential?.username,
        phoneNumber: u.credential?.phoneNumber,
        phoneVerified: u.credential?.phoneVerified,
        mustChangePassword: u.credential?.mustChangePassword,
        failedAttempts: u.credential?.failedAttempts,
        isLocked: u.credential?.lockedUntil ? new Date(u.credential.lockedUntil) > new Date() : false,
        lastLoginAt: u.credential?.lastLoginAt,
        createdAt: u.createdAt,
      }));
    }),
    
    // Admin: Reset user password
    resetPassword: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const tempPassword = await db.resetUserPassword(input.userId, ctx.user.id);
        return { success: true, tempPassword };
      }),
    
    // Admin: Unlock user account
    unlock: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.unlockUserAccount(input.userId);
        
        await db.createAuditLog({
          userId: ctx.user.id,
          action: 'account_unlocked',
          targetType: 'user',
          targetId: input.userId,
          description: `Account unlocked by admin`,
        });
        
        return { success: true };
      }),
    
    // Admin: Delete user credentials
    delete: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteUserCredentials(input.userId);
        
        await db.createAuditLog({
          userId: ctx.user.id,
          action: 'credential_deleted',
          targetType: 'user',
          targetId: input.userId,
          description: `Credentials deleted`,
        });
        
        return { success: true };
      }),
    
    // Admin: Bind phone to user credentials
    bindPhone: adminProcedure
      .input(z.object({
        userId: z.number(),
        phoneNumber: z.string().min(10).max(20),
      }))
      .mutation(async ({ input }) => {
        await db.bindPhoneToCredentials(input.userId, input.phoneNumber);
        return { success: true };
      }),
    
    // Public: Login with username/password
    login: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const ip = ctx.req.ip || ctx.req.headers["x-forwarded-for"] || "unknown";
        const ipAddress = typeof ip === "string" ? ip : String(ip);
        
        const result = await db.authenticateUser(input.username, input.password, ipAddress);
        
        if (!result.success || !result.user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: result.error || "Invalid credentials" });
        }
        
        // Create session token
        const { sdk } = await import("./_core/sdk");
        const token = await sdk.createSessionToken(result.user.openId, {
          name: result.user.name || result.user.callSign || 'User',
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        
        return {
          success: true,
          user: result.user,
          mustChangePassword: result.mustChangePassword,
        };
      }),
    
    // Protected: Change own password
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8).max(128),
      }))
      .mutation(async ({ input, ctx }) => {
        const credential = await db.getCredentialsByUserId(ctx.user.id);
        if (!credential) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No credentials found" });
        }
        
        const isValid = await db.verifyPassword(input.currentPassword, credential.passwordHash);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
        }
        
        await db.changePassword(ctx.user.id, input.newPassword);
        return { success: true };
      }),
    
    // Protected: Get own credential status
    me: protectedProcedure.query(async ({ ctx }) => {
      const credential = await db.getCredentialsByUserId(ctx.user.id);
      if (!credential) {
        return { hasCredentials: false };
      }
      return {
        hasCredentials: true,
        username: credential.username,
        phoneNumber: credential.phoneNumber,
        phoneVerified: credential.phoneVerified,
        mustChangePassword: credential.mustChangePassword,
      };
    }),
    
    // Protected: Request phone verification OTP
    requestPhoneVerification: protectedProcedure
      .input(z.object({ phoneNumber: z.string().min(10).max(20) }))
      .mutation(async ({ input, ctx }) => {
        const ip = ctx.req.ip || ctx.req.headers["x-forwarded-for"] || "unknown";
        const identifier = typeof ip === "string" ? ip : String(ip);
        
        // Rate limit
        const allowed = await db.checkRateLimit(identifier, "phone_verify", 3, 15);
        if (!allowed) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many requests. Try again later." });
        }
        
        // Bind phone to credentials first
        await db.bindPhoneToCredentials(ctx.user.id, input.phoneNumber);
        
        // Create OTP
        const code = await db.createOtp(input.phoneNumber);
        
        // In production, send SMS here. For now, log it.
        console.log(`[Phone Verify] Code for ${input.phoneNumber}: ${code}`);
        
        return { success: true, message: "Verification code sent" };
      }),
    
    // Protected: Verify phone with OTP
    verifyPhone: protectedProcedure
      .input(z.object({ code: z.string().length(6) }))
      .mutation(async ({ input, ctx }) => {
        const credential = await db.getCredentialsByUserId(ctx.user.id);
        if (!credential || !credential.phoneNumber) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No phone number to verify" });
        }
        
        const valid = await db.verifyOtp(credential.phoneNumber, input.code);
        if (!valid) {
          await db.incrementOtpAttempts(credential.phoneNumber);
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired code" });
        }
        
        await db.verifyCredentialPhone(ctx.user.id);
        
        await db.createAuditLog({
          userId: ctx.user.id,
          action: 'phone_verified',
          targetType: 'user',
          targetId: ctx.user.id,
          description: `Phone ${credential.phoneNumber} verified`,
        });
        
        return { success: true };
      }),
  }),

  // ============================================================================
  // OTP ROUTER - Phone verification
  // ============================================================================
  otp: router({
    request: publicProcedure
      .input(z.object({ phoneNumber: z.string().min(10).max(20) }))
      .mutation(async ({ input, ctx }) => {
        const ip = ctx.req.ip || ctx.req.headers["x-forwarded-for"] || "unknown";
        const identifier = typeof ip === "string" ? ip : String(ip);
        
        // Rate limit: 3 OTP requests per 15 minutes per IP
        const allowed = await db.checkRateLimit(identifier, "otp_request", 3, 15);
        if (!allowed) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many OTP requests. Try again later." });
        }
        
        // Rate limit: 5 OTP requests per hour per phone
        const phoneAllowed = await db.checkRateLimit(input.phoneNumber, "otp_phone", 5, 60);
        if (!phoneAllowed) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many OTP requests for this number." });
        }
        
        const code = await db.createOtp(input.phoneNumber);
        
        // In production, send SMS here. For now, log it.
        console.log(`[OTP] Code for ${input.phoneNumber}: ${code}`);
        
        return { success: true, message: "OTP sent" };
      }),
    
    verify: publicProcedure
      .input(z.object({ 
        phoneNumber: z.string().min(10).max(20),
        code: z.string().length(6)
      }))
      .mutation(async ({ input }) => {
        const valid = await db.verifyOtp(input.phoneNumber, input.code);
        
        if (!valid) {
          await db.incrementOtpAttempts(input.phoneNumber);
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired code" });
        }
        
        return { success: true, verified: true };
      }),
  }),

  // ============================================================================
  // ARTIFACT ROUTER - Public verification + marking
  // ============================================================================
  artifact: router({
    getBySerial: publicProcedure
      .input(z.object({ serialNumber: z.string() }))
      .query(async ({ input }) => {
        const artifact = await db.getArtifactBySerial(input.serialNumber);
        if (!artifact) {
          return null;
        }
        
        const drop = await db.getDropById(artifact.dropId);
        
        // Get marker info if marked
        let markerCallSign: string | null = null;
        if (artifact.markedByUserId) {
          const marker = await db.getUserById(artifact.markedByUserId);
          markerCallSign = marker?.callSign || null;
        }
        
        return {
          serialNumber: artifact.serialNumber,
          status: artifact.status,
          artistName: drop?.artistName || "Unknown",
          title: drop?.title || "Unknown",
          markedAt: artifact.markedAt,
          markerCallSign,
          flagReason: artifact.status === "flagged" ? artifact.flagReason : null,
          editionNumber: artifact.editionNumber,
          editionSize: drop?.editionSize || 0,
          dropId: artifact.dropId,
        };
      }),
    
    validateActivationCode: protectedProcedure
      .input(z.object({ 
        serialNumber: z.string(),
        activationCode: z.string()
      }))
      .mutation(async ({ input, ctx }) => {
        const artifact = await db.getArtifactBySerial(input.serialNumber);
        
        if (!artifact) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Artifact not found" });
        }
        
        if (artifact.status !== "unmarked") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Artifact already marked or flagged" });
        }
        
        const codeHash = db.hashActivationCode(input.activationCode);
        if (codeHash !== artifact.activationCodeHash) {
          // Log failed attempt
          await db.createMarkingLog({
            artifactId: artifact.id,
            userId: ctx.user.id,
            result: "failed",
            failureReason: "Invalid activation code",
            ipAddress: ctx.req.ip || null,
            userAgent: ctx.req.headers["user-agent"] || null,
          });
          
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid activation code" });
        }
        
        return { valid: true, artifactId: artifact.id };
      }),
    
    mark: protectedProcedure
      .input(z.object({
        artifactId: z.number(),
        callSign: z.string().min(2).max(32),
        chapter: z.string().default("South Jakarta"),
        acceptedCode: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!input.acceptedCode) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You must accept The Code" });
        }
        
        // Check if call sign is taken
        const existingUser = await db.getUserByCallSign(input.callSign);
        if (existingUser && existingUser.id !== ctx.user.id) {
          throw new TRPCError({ code: "CONFLICT", message: "Call sign already taken" });
        }
        
        const artifact = await db.getArtifactById(input.artifactId);
        if (!artifact || artifact.status !== "unmarked") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Artifact cannot be marked" });
        }
        
        // Execute marking
        const success = await db.markArtifact(input.artifactId, ctx.user.id);
        if (!success) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Marking failed" });
        }
        
        // Update user role and info
        await db.updateUserRole(ctx.user.id, "marked_initiate", input.callSign, input.chapter);
        
        // Log successful marking
        await db.createMarkingLog({
          artifactId: input.artifactId,
          userId: ctx.user.id,
          result: "success",
          ipAddress: ctx.req.ip || null,
          userAgent: ctx.req.headers["user-agent"] || null,
        });
        
        // Audit log
        await db.createAuditLog({
          action: "user_role_changed",
          userId: ctx.user.id,
          userName: input.callSign,
          targetType: "user",
          targetId: ctx.user.id,
          description: `User marked with artifact ${artifact.serialNumber}`,
          previousValue: "public",
          newValue: "marked_initiate",
        });
        
        // Create memory log entry for activation
        await db.createMemoryLog({
          userId: ctx.user.id,
          memoryType: 'activation',
          referenceId: input.artifactId,
          referenceType: 'artifact',
          details: `Activated ${artifact.serialNumber}`,
          visibilityLevel: 'full_context',
        });
        
        return { success: true, callSign: input.callSign };
      }),
    
    // Admin: get all artifacts for a drop
    getByDrop: adminProcedure
      .input(z.object({ dropId: z.number() }))
      .query(async ({ input }) => {
        return db.getArtifactsByDrop(input.dropId);
      }),
    
    // Admin: flag artifact
    flag: adminProcedure
      .input(z.object({ artifactId: z.number(), reason: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await db.flagArtifact(input.artifactId, input.reason, ctx.user.id);
        
        const artifact = await db.getArtifactById(input.artifactId);
        await db.createAuditLog({
          action: "mark_flagged",
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || "Admin",
          targetType: "artifact",
          targetId: input.artifactId,
          targetIdentifier: artifact?.serialNumber,
          description: input.reason,
        });
        
        return { success: true };
      }),
    
    // Admin: reissue activation code
    reissue: adminProcedure
      .input(z.object({ artifactId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const newCode = await db.reissueActivationCode(input.artifactId);
        if (!newCode) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot reissue code for this artifact" });
        }
        
        const artifact = await db.getArtifactById(input.artifactId);
        await db.createAuditLog({
          action: "mark_reissued",
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || "Admin",
          targetType: "artifact",
          targetId: input.artifactId,
          targetIdentifier: artifact?.serialNumber,
        });
        
        return { success: true, newCode };
      }),
  }),

  // ============================================================================
  // DROP ROUTER - Admin management
  // ============================================================================
  drop: router({
    // Public: get drop by ID for product page
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const drop = await db.getDropById(input.id);
        if (!drop || drop.status !== 'published') {
          return null;
        }
        
        // Get gating info
        const gatingInfo = getDropGatingInfo(drop);
        
        // Check if user can purchase
        const gatingResult = await checkDropGating(
          ctx.user as User | null,
          drop,
          db.getEventPassesByUser,
          db.getEventById
        );
        
        // Get event title if attendance-locked
        let attendanceLockEventTitle: string | undefined;
        if (gatingInfo.attendanceLockEventId) {
          const event = await db.getEventById(gatingInfo.attendanceLockEventId);
          attendanceLockEventTitle = event?.title;
        }
        
        return {
          ...drop,
          gating: {
            ...gatingInfo,
            attendanceLockEventTitle,
            canPurchase: gatingResult.canPurchase,
            reason: gatingResult.reason,
            requirements: gatingResult.requirements,
          },
        };
      }),
    
    list: publicProcedure.query(async ({ ctx }) => {
      // Public list only shows published drops with visibility filtering
      const allDrops = await db.getAllDrops();
      const publishedDrops = allDrops.filter(d => d.status === 'published');
      
      // Apply stratified reality filtering and add gating info
      const dropsWithGating = await Promise.all(
        publishedDrops.map(async (drop) => {
          const filtered = filterDropForVisibility(drop, ctx.user as User | null);
          const gatingInfo = getDropGatingInfo(drop);
          
          // Check if user can purchase
          const gatingResult = await checkDropGating(
            ctx.user as User | null,
            drop,
            db.getEventPassesByUser,
            db.getEventById
          );
          
          // Get event title if attendance-locked
          let attendanceLockEventTitle: string | undefined;
          if (gatingInfo.attendanceLockEventId) {
            const event = await db.getEventById(gatingInfo.attendanceLockEventId);
            attendanceLockEventTitle = event?.title;
          }
          
          return {
            ...filtered,
            gating: {
              ...gatingInfo,
              attendanceLockEventTitle,
              canPurchase: gatingResult.canPurchase,
              reason: gatingResult.reason,
            },
          };
        })
      );
      
      return dropsWithGating;
    }),
    
    // Admin list shows all drops including drafts
    adminList: adminProcedure.query(async () => {
      return db.getAllDrops();
    }),
    
    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getDropById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        artistName: z.string().min(1),
        title: z.string().min(1),
        editionSize: z.number().min(1).max(10000),
      }))
      .mutation(async ({ input, ctx }) => {
        const dropId = await db.createDrop(input);
        
        await db.createAuditLog({
          action: "drop_created",
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || "Admin",
          targetType: "drop",
          targetId: dropId,
          description: `Created drop: ${input.artistName} - ${input.title}`,
        });
        
        return { success: true, dropId };
      }),
    
    generateArtifacts: adminProcedure
      .input(z.object({ dropId: z.number(), count: z.number().min(1).max(1000) }))
      .mutation(async ({ input, ctx }) => {
        const { serials, codes } = await db.generateArtifacts(input.dropId, input.count);
        
        await db.createAuditLog({
          action: "marks_generated",
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || "Admin",
          targetType: "drop",
          targetId: input.dropId,
          description: `Generated ${input.count} artifacts`,
        });
        
        return { success: true, serials, codes };
      }),
    
    publish: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.publishDrop(input.id);
        
        await db.createAuditLog({
          action: "drop_published",
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || "Admin",
          targetType: "drop",
          targetId: input.id,
        });
        
        return { success: true };
      }),
    
    archive: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.archiveDrop(input.id);
        
        await db.createAuditLog({
          action: "drop_archived",
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || "Admin",
          targetType: "drop",
          targetId: input.id,
        });
        
        return { success: true };
      }),
  }),

  // ============================================================================
  // EVENT ROUTER
  // ============================================================================
  event: router({
    // Public: list published events for home page (no auth required)
    publicList: publicProcedure.query(async () => {
      const events = await db.getPublishedEvents();
      const now = new Date();
      
      // Return basic event info for public display (no sensitive location data)
      return events.map(event => ({
        id: event.id,
        title: event.title,
        slug: event.slug,
        tagline: event.tagline,
        description: event.description,
        category: event.category,
        city: event.city,
        area: event.area,
        eventDate: event.eventDate,
        startDatetime: event.startDatetime,
        endDatetime: event.endDatetime,
        coverImageUrl: event.coverImageUrl,
        capacity: event.capacity,
        featuredOrder: event.featuredOrder,
        eventAccessType: event.eventAccessType,
        // Don't reveal venue details publicly
        venueName: null,
        venueAddress: null,
        coordinates: null,
      }));
    }),

    // Marked users: list published events with reveal system
    list: markedProcedure.query(async ({ ctx }) => {
      const events = await db.getPublishedEvents();
      const now = new Date();
      
      // Get user's mark state for reveal calculations
      const userMarkState = ctx.user.markState || 'outside';
      
      // Filter by user role eligibility and add pass info + reveal info
      const eligible = [];
      for (const event of events) {
        // Check role eligibility
        const roleHierarchy = ["marked_initiate", "marked_member", "marked_inner_circle"];
        const userRoleIndex = roleHierarchy.indexOf(ctx.user.role);
        const requiredRoleIndex = roleHierarchy.indexOf(event.markState as string);
        
        if (userRoleIndex >= requiredRoleIndex || isStaff(ctx.user)) {
          const passCount = await db.getEventPassCount(event.id);
          const userPass = await db.getEventPassByUserAndEvent(ctx.user.id, event.id);
          
          // Calculate reveal info using the new reveal system
          const revealInfo = calculateRevealInfo({
            id: event.id,
            title: event.title,
            eventDate: event.eventDate,
            startDatetime: event.startDatetime,
            endDatetime: event.endDatetime,
            timeRevealHoursBefore: event.timeRevealHoursBefore,
            locationRevealHoursBefore: event.locationRevealHoursBefore,
            markState: (event.markState || 'initiate') as any,
            venueName: event.venueName,
            venueAddress: event.venueAddress,
            area: event.area,
            city: event.city,
            coordinates: event.coordinates,
          }, userMarkState, now);
          
          // Get capacity info
          const confirmedCount = await db.getConfirmedPassCount(event.id);
          const waitlistCount = await db.getWaitlistCount(event.id);
          const spotsRemaining = Math.max(0, event.capacity - confirmedCount);
          const isFull = event.capacity > 0 && spotsRemaining === 0;
          
          eligible.push({
            ...event,
            // Override location fields based on reveal state
            locationText: revealInfo.locationRevealed ? event.locationText : null,
            venueName: revealInfo.venueName,
            venueAddress: revealInfo.venueAddress,
            area: revealInfo.area,
            coordinates: revealInfo.coordinates,
            // Add reveal info
            revealState: revealInfo.state,
            revealStateLabel: getRevealStateLabel(revealInfo.state),
            timeRevealed: revealInfo.timeRevealed,
            locationRevealed: revealInfo.locationRevealed,
            revealedStartTime: revealInfo.startTime,
            revealedEndTime: revealInfo.endTime,
            timeRevealAt: revealInfo.timeRevealAt,
            locationRevealAt: revealInfo.locationRevealAt,
            countdownToTimeReveal: revealInfo.countdownToTimeReveal,
            countdownToLocationReveal: revealInfo.countdownToLocationReveal,
            countdownToEvent: revealInfo.countdownToEvent,
            userLayerSufficient: revealInfo.userLayerSufficient,
            requiredLayerLabel: formatLayerName(revealInfo.requiredLayer),
            userLayerLabel: formatLayerName(userMarkState),
            revealMessage: revealInfo.message,
            // Pass info
            passCount,
            capacity: event.capacity,
            hasPass: !!userPass,
            passStatus: userPass?.passStatus || null,
            qrPayload: userPass?.qrPayload || null,
            isWaitlisted: userPass?.isWaitlisted || false,
            waitlistPosition: userPass?.waitlistPosition || null,
            // Capacity info
            confirmedCount,
            waitlistCount,
            spotsRemaining,
            isFull,
            hasWaitlist: waitlistCount > 0,
          });
        }
      }
      
      return eligible;
    }),
    
    // Marked: claim pass with optional plus-one (with waitlist support)
    claimPass: markedProcedure
      .input(z.object({ 
        eventId: z.number(),
        plusOneName: z.string().optional(),
        acceptWaitlist: z.boolean().optional().default(true), // If false, reject if full
      }))
      .mutation(async ({ input, ctx }) => {
        const event = await db.getEventById(input.eventId);
        if (!event || event.status !== "published") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        
        // Check if user already has a pass
        const existingPass = await db.getEventPassByUserAndEvent(ctx.user.id, input.eventId);
        if (existingPass) {
          if (existingPass.isWaitlisted) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "You are already on the waitlist for this event" });
          }
          throw new TRPCError({ code: "BAD_REQUEST", message: "You already have a pass for this event" });
        }
        
        // Check eligibility based on mark_state
        const userMarkState = ctx.user.markState || "outside";
        const eligibilityMap: Record<string, number> = {
          "outside": 0,
          "initiate": 1,
          "member": 2,
          "inner_circle": 3,
        };
        const requiredLevel = eligibilityMap[event.eligibilityMinState || "initiate"] || 1;
        const userLevel = eligibilityMap[userMarkState] || 0;
        
        if (userLevel < requiredLevel) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Your mark state does not meet the eligibility requirement" });
        }
        
        // Check capacity and determine if waitlist
        const confirmedCount = await db.getConfirmedPassCount(input.eventId);
        const capacity = event.capacity || 0;
        const isFull = capacity > 0 && confirmedCount >= capacity;
        
        if (isFull && !input.acceptWaitlist) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Event is at capacity" });
        }
        
        // Get waitlist position if needed
        let waitlistPosition: number | undefined;
        if (isFull) {
          const waitlistCount = await db.getWaitlistCount(input.eventId);
          waitlistPosition = waitlistCount + 1;
        }
        
        // Create pass (with waitlist if full)
        const result = await db.createEventPassWithWaitlist(
          input.eventId,
          ctx.user.id,
          isFull,
          waitlistPosition,
          input.plusOneName
        );
        
        // Create memory log for event pass claim
        await db.createMemoryLog({
          userId: ctx.user.id,
          memoryType: "event_attended",
          referenceId: input.eventId,
          referenceType: "event",
          details: isFull 
            ? `Joined waitlist for ${event.title} (position ${waitlistPosition})${input.plusOneName ? ` (+1: ${input.plusOneName})` : ""}`
            : `Claimed pass for ${event.title}${input.plusOneName ? ` (+1: ${input.plusOneName})` : ""}`,
        });
        
        // Send notification if added to waitlist
        if (isFull && waitlistPosition) {
          await db.createNotification({
            userId: ctx.user.id,
            type: 'event_reminder',
            title: 'Added to Waitlist',
            body: `You're #${waitlistPosition} on the waitlist for "${event.title}". We'll notify you if a spot opens up.`,
          });
        }
        
        return { 
          success: true, 
          qrPayload: result.qrPayload, 
          isWaitlisted: result.isWaitlisted,
          waitlistPosition: result.waitlistPosition,
        };
      }),
    
    // Get capacity info for an event
    getCapacityInfo: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        
        const confirmedCount = await db.getConfirmedPassCount(input.eventId);
        const waitlistCount = await db.getWaitlistCount(input.eventId);
        const capacity = event.capacity || 0;
        const spotsRemaining = Math.max(0, capacity - confirmedCount);
        
        return {
          capacity,
          confirmedCount,
          waitlistCount,
          spotsRemaining,
          isFull: capacity > 0 && spotsRemaining === 0,
          hasWaitlist: waitlistCount > 0,
        };
      }),
    
    // Get user's waitlist position
    getMyWaitlistPosition: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input, ctx }) => {
        const pass = await db.getEventPassByUserAndEvent(ctx.user.id, input.eventId);
        if (!pass) {
          return { hasPass: false, isWaitlisted: false, position: null };
        }
        
        if (!pass.isWaitlisted) {
          return { hasPass: true, isWaitlisted: false, position: null };
        }
        
        // Calculate actual position (count people ahead)
        const waitlistedPasses = await db.getWaitlistedPasses(input.eventId);
        const position = waitlistedPasses.findIndex(p => p.id === pass.id) + 1;
        
        return { hasPass: true, isWaitlisted: true, position };
      }),
    
    // Request access to invite-only event
    requestAccess: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const event = await db.getEventById(input.eventId);
        if (!event || event.status !== "published") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        
        // Check if already has a request
        const existingRequest = await db.getAccessRequestByUserAndEvent(ctx.user.id, input.eventId);
        if (existingRequest) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You already have a request for this event" });
        }
        
        // Check if already has a pass
        const existingPass = await db.getEventPassByUserAndEvent(ctx.user.id, input.eventId);
        if (existingPass) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You already have a pass for this event" });
        }
        
        const requestId = await db.createAccessRequest({
          eventId: input.eventId,
          userId: ctx.user.id,
          requestMessage: input.message,
        });
        
        return { success: true, requestId };
      }),
    
    // Get my access request status
    getMyAccessRequest: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input, ctx }) => {
        const request = await db.getAccessRequestByUserAndEvent(ctx.user.id, input.eventId);
        return request || null;
      }),
    
    // Get all my access requests
    getMyAccessRequests: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserAccessRequests(ctx.user.id);
      }),
    
    // Get all my event passes
    getMyPasses: protectedProcedure
      .query(async ({ ctx }) => {
        const passes = await db.getEventPassesByUser(ctx.user.id);
        
        // Enrich with event data
        const enriched = await Promise.all(passes.map(async (pass) => {
          const event = await db.getEventById(pass.eventId);
          return {
            ...pass,
            event: event ? {
              id: event.id,
              title: event.title,
              eventDate: event.eventDate,
              startDatetime: event.startDatetime,
              venueName: event.venueName,
              city: event.city,
            } : null,
          };
        }));
        
        return enriched;
      }),
    
    // Admin: get pending access requests
    getPendingRequests: adminProcedure
      .input(z.object({ eventId: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPendingAccessRequests(input.eventId);
      }),
    
    // Admin: get all access requests for an event
    getEventRequests: adminProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return db.getAccessRequestsByEvent(input.eventId);
      }),
    
    // Admin: approve access request
    approveRequest: adminProcedure
      .input(z.object({
        requestId: z.number(),
        response: z.string().optional(),
        createPass: z.boolean().optional().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        const request = await db.getAccessRequestById(input.requestId);
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }
        
        await db.approveAccessRequest(input.requestId, ctx.user.id, input.response);
        
        // Optionally create a pass for the user
        if (input.createPass) {
          const event = await db.getEventById(request.eventId);
          const confirmedCount = await db.getConfirmedPassCount(request.eventId);
          const capacity = event?.capacity || 0;
          const isFull = capacity > 0 && confirmedCount >= capacity;
          
          let waitlistPosition: number | undefined;
          if (isFull) {
            const waitlistCount = await db.getWaitlistCount(request.eventId);
            waitlistPosition = waitlistCount + 1;
          }
          
          await db.createEventPassWithWaitlist(
            request.eventId,
            request.userId,
            isFull,
            waitlistPosition
          );
        }
        
        // Create notification for user
        await db.createNotification({
          userId: request.userId,
          type: 'system_announcement',
          title: 'Access Request Approved',
          body: `Your request to access the event has been approved.${input.response ? ` Note: ${input.response}` : ''}`,
        });
        
        return { success: true };
      }),
    
    // Admin: deny access request
    denyRequest: adminProcedure
      .input(z.object({
        requestId: z.number(),
        response: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const request = await db.getAccessRequestById(input.requestId);
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }
        
        await db.denyAccessRequest(input.requestId, ctx.user.id, input.response);
        
        // Create notification for user
        await db.createNotification({
          userId: request.userId,
          type: 'system_announcement',
          title: 'Access Request Denied',
          body: `Your request to access the event has been denied.${input.response ? ` Reason: ${input.response}` : ''}`,
        });
        
        return { success: true };
      }),
    
    // Admin: waitlist access request
    waitlistRequest: adminProcedure
      .input(z.object({
        requestId: z.number(),
        response: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const request = await db.getAccessRequestById(input.requestId);
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }
        
        await db.waitlistAccessRequest(input.requestId, ctx.user.id, input.response);
        
        // Create notification for user
        await db.createNotification({
          userId: request.userId,
          type: 'system_announcement',
          title: 'Access Request Waitlisted',
          body: `Your request has been added to the waitlist.${input.response ? ` Note: ${input.response}` : ''}`,
        });
        
        return { success: true };
      }),
    
    // Admin: bulk approve access requests
    bulkApproveRequests: adminProcedure
      .input(z.object({
        requestIds: z.array(z.number()),
        response: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const results = { approved: 0, failed: 0, errors: [] as string[] };
        
        for (const requestId of input.requestIds) {
          try {
            const request = await db.getAccessRequestById(requestId);
            if (!request) {
              results.failed++;
              results.errors.push(`Request ${requestId} not found`);
              continue;
            }
            
            if (request.status !== 'pending') {
              results.failed++;
              results.errors.push(`Request ${requestId} is not pending`);
              continue;
            }
            
            // Approve the request
            await db.approveAccessRequest(requestId, ctx.user.id, input.response);
            
            // Create pass for user
            const event = await db.getEventById(request.eventId);
            const confirmedCount = await db.getConfirmedPassCount(request.eventId);
            const capacity = event?.capacity || 0;
            const isFull = capacity > 0 && confirmedCount >= capacity;
            
            let waitlistPosition: number | undefined;
            if (isFull) {
              const waitlistCount = await db.getWaitlistCount(request.eventId);
              waitlistPosition = waitlistCount + 1;
            }
            
            await db.createEventPassWithWaitlist(
              request.eventId,
              request.userId,
              isFull,
              waitlistPosition
            );
            
            // Send notification
            await db.createNotification({
              userId: request.userId,
              type: 'system_announcement',
              title: 'Access Request Approved',
              body: `Your request to access "${event?.title || 'the event'}" has been approved.${input.response ? ` Note: ${input.response}` : ''}`,
            });
            
            results.approved++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Request ${requestId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        return results;
      }),
    
    // Admin: bulk deny access requests
    bulkDenyRequests: adminProcedure
      .input(z.object({
        requestIds: z.array(z.number()),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const results = { denied: 0, failed: 0, errors: [] as string[] };
        
        for (const requestId of input.requestIds) {
          try {
            const request = await db.getAccessRequestById(requestId);
            if (!request) {
              results.failed++;
              results.errors.push(`Request ${requestId} not found`);
              continue;
            }
            
            if (request.status !== 'pending') {
              results.failed++;
              results.errors.push(`Request ${requestId} is not pending`);
              continue;
            }
            
            // Deny the request
            await db.denyAccessRequest(requestId, ctx.user.id, input.reason);
            
            // Get event for notification
            const event = await db.getEventById(request.eventId);
            
            // Send notification
            await db.createNotification({
              userId: request.userId,
              type: 'system_announcement',
              title: 'Access Request Denied',
              body: `Your request to access "${event?.title || 'the event'}" has been denied.${input.reason ? ` Reason: ${input.reason}` : ''}`,
            });
            
            results.denied++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Request ${requestId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        return results;
      }),
    
    // Admin: get all access requests with filtering
    getAllAccessRequests: adminProcedure
      .input(z.object({
        eventId: z.number().optional(),
        status: z.enum(['pending', 'approved', 'denied', 'waitlisted']).optional(),
        search: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return db.getAllAccessRequests(input);
      }),
    
    // Admin: get access request stats
    getAccessRequestStats: adminProcedure
      .input(z.object({ eventId: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getAccessRequestStats(input.eventId);
      }),
    
    // Admin: list all events
    listAll: adminProcedure.query(async () => {
      return db.getAllEvents();
    }),
    
    // Admin: create event
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        city: z.string().default("South Jakarta"),
        description: z.string().optional(),
        rules: z.string().optional(),
        capacity: z.number().min(1),
        requiredRole: z.enum(["marked_initiate", "marked_member", "marked_inner_circle"]).default("marked_initiate"),
        locationText: z.string().optional(),
        locationRevealAt: z.date().optional(),
        eventDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const eventId = await db.createEvent(input);
        
        await db.createAuditLog({
          action: "event_created",
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || "Admin",
          targetType: "event",
          targetId: eventId,
          description: `Created event: ${input.title}`,
        });
        
        return { success: true, eventId };
      }),
    
    // Admin: update event
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        city: z.string().optional(),
        description: z.string().optional(),
        rules: z.string().optional(),
        capacity: z.number().min(1).optional(),
        requiredRole: z.enum(["marked_initiate", "marked_member", "marked_inner_circle"]).optional(),
        locationText: z.string().optional(),
        locationRevealAt: z.date().optional(),
        eventDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateEvent(id, data);
        return { success: true };
      }),
    
    // Admin: publish event
    publish: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.publishEvent(input.id);
        
        await db.createAuditLog({
          action: "event_published",
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || "Admin",
          targetType: "event",
          targetId: input.id,
        });
        
        return { success: true };
      }),
    
    // Admin: cancel event
    cancel: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.cancelEvent(input.id);
        
        await db.createAuditLog({
          action: "event_cancelled",
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || "Admin",
          targetType: "event",
          targetId: input.id,
        });
        
        return { success: true };
      }),
    
    // Admin: get passes for event
    getPasses: adminProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        const passes = await db.getEventPasses(input.eventId);
        const enriched = [];
        
        for (const pass of passes) {
          const user = await db.getUserById(pass.userId);
          enriched.push({
            ...pass,
            userCallSign: user?.callSign || "Unknown",
            userRole: user?.role || "unknown",
          });
        }
        
        return enriched;
      }),
    
    // Admin: revoke pass (with automatic waitlist promotion)
    revokePass: adminProcedure
      .input(z.object({ passId: z.number(), reason: z.string() }))
      .mutation(async ({ input, ctx }) => {
        // Get pass info before revoking
        const passes = await db.getEventPasses(0); // We need to find the pass first
        const passToRevoke = passes.find(p => p.id === input.passId);
        
        await db.revokePass(input.passId, input.reason, ctx.user.id);
        
        await db.createAuditLog({
          action: "pass_revoked",
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || "Admin",
          targetType: "pass",
          targetId: input.passId,
          description: input.reason,
        });
        
        // If the revoked pass was confirmed (not waitlisted), promote from waitlist
        let promotedUser = null;
        if (passToRevoke && !passToRevoke.isWaitlisted) {
          const waitlistedPasses = await db.getWaitlistedPasses(passToRevoke.eventId);
          if (waitlistedPasses.length > 0) {
            const nextInLine = waitlistedPasses[0];
            await db.promoteFromWaitlist(nextInLine.id);
            promotedUser = nextInLine.userId;
            
            // Create memory log for promotion
            const event = await db.getEventById(passToRevoke.eventId);
            await db.createMemoryLog({
              userId: nextInLine.userId,
              memoryType: "event_attended",
              referenceId: passToRevoke.eventId,
              referenceType: "event",
              details: `Promoted from waitlist for ${event?.title || 'event'}`,
            });
            
            // Send notification to promoted user
            await db.createNotification({
              userId: nextInLine.userId,
              type: 'event_reminder',
              title: 'You\'ve Been Promoted from the Waitlist!',
              body: `Great news! A spot opened up for "${event?.title || 'the event'}" and you've been promoted from the waitlist. Your pass is now confirmed.`,
            });
          }
        }
        
        return { success: true, promotedUserId: promotedUser };
      }),
    
    // User: cancel own pass (with automatic waitlist promotion)
    cancelPass: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const pass = await db.getEventPassByUserAndEvent(ctx.user.id, input.eventId);
        if (!pass) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pass not found" });
        }
        
        if (pass.passStatus === 'used') {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot cancel a used pass" });
        }
        
        const wasConfirmed = !pass.isWaitlisted;
        
        // Revoke the pass
        await db.revokePass(pass.id, "Cancelled by user", ctx.user.id);
        
        // If was confirmed, promote from waitlist
        let promotedUser = null;
        if (wasConfirmed) {
          const waitlistedPasses = await db.getWaitlistedPasses(input.eventId);
          if (waitlistedPasses.length > 0) {
            const nextInLine = waitlistedPasses[0];
            await db.promoteFromWaitlist(nextInLine.id);
            promotedUser = nextInLine.userId;
            
            // Create memory log for promotion
            const event = await db.getEventById(input.eventId);
            await db.createMemoryLog({
              userId: nextInLine.userId,
              memoryType: "event_attended",
              referenceId: input.eventId,
              referenceType: "event",
              details: `Promoted from waitlist for ${event?.title || 'event'}`,
            });
            
            // Send notification to promoted user
            await db.createNotification({
              userId: nextInLine.userId,
              type: 'event_reminder',
              title: 'You\'ve Been Promoted from the Waitlist!',
              body: `Great news! A spot opened up for "${event?.title || 'the event'}" and you've been promoted from the waitlist. Your pass is now confirmed.`,
            });
          }
        }
        
        return { success: true, promotedUserId: promotedUser };
      }),
    
    // Admin: manually promote from waitlist
    promoteFromWaitlist: adminProcedure
      .input(z.object({ passId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const passes = await db.getEventPasses(0);
        const pass = passes.find(p => p.id === input.passId);
        
        if (!pass) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pass not found" });
        }
        
        if (!pass.isWaitlisted) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Pass is not on waitlist" });
        }
        
        await db.promoteFromWaitlist(input.passId);
        
        const event = await db.getEventById(pass.eventId);
        await db.createMemoryLog({
          userId: pass.userId,
          memoryType: "event_attended",
          referenceId: pass.eventId,
          referenceType: "event",
          details: `Manually promoted from waitlist for ${event?.title || 'event'}`,
        });
        
        await db.createAuditLog({
          action: "pass_promoted",
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || "Admin",
          targetType: "pass",
          targetId: input.passId,
          description: `Promoted user from waitlist`,
        });
        
        // Send notification to promoted user
        await db.createNotification({
          userId: pass.userId,
          type: 'event_reminder',
          title: 'You\'ve Been Promoted from the Waitlist!',
          body: `Great news! You've been manually promoted from the waitlist for "${event?.title || 'the event'}". Your pass is now confirmed.`,
        });
        
        return { success: true };
      }),
  }),

  // ============================================================================
  // STAFF ROUTER - Door control
  // ============================================================================
  staff: router({
    // Get events for staff dropdown
    getEvents: staffProcedure.query(async () => {
      return db.getPublishedEvents();
    }),
    
    // Scan and validate pass
    scanPass: staffProcedure
      .input(z.object({ 
        qrPayload: z.string(),
        eventId: z.number()
      }))
      .mutation(async ({ input, ctx }) => {
        const pass = await db.getEventPassByQr(input.qrPayload);
        
        if (!pass) {
          await db.createCheckInLog({
            eventId: input.eventId,
            scannedByUserId: ctx.user.id,
            result: "rejected",
            reason: "Pass not found",
          });
          return { valid: false, reason: "Pass not found" };
        }
        
        if (pass.eventId !== input.eventId) {
          await db.createCheckInLog({
            eventId: input.eventId,
            eventPassId: pass.id,
            scannedByUserId: ctx.user.id,
            result: "rejected",
            reason: "Pass is for different event",
          });
          return { valid: false, reason: "Pass is for a different event" };
        }
        
        if (pass.passStatus === "used") {
          await db.createCheckInLog({
            eventId: input.eventId,
            eventPassId: pass.id,
            scannedByUserId: ctx.user.id,
            result: "rejected",
            reason: "Pass already used",
          });
          return { valid: false, reason: "Pass already used" };
        }
        
        if (pass.passStatus === "revoked") {
          await db.createCheckInLog({
            eventId: input.eventId,
            eventPassId: pass.id,
            scannedByUserId: ctx.user.id,
            result: "rejected",
            reason: "Pass revoked",
          });
          return { valid: false, reason: "Pass has been revoked" };
        }
        
        // Get user info
        const user = await db.getUserById(pass.userId);
        if (!user || user.status !== "active") {
          await db.createCheckInLog({
            eventId: input.eventId,
            eventPassId: pass.id,
            scannedByUserId: ctx.user.id,
            result: "rejected",
            reason: "User revoked or banned",
          });
          return { valid: false, reason: "User is not active" };
        }
        
        return {
          valid: true,
          passId: pass.id,
          userCallSign: user.callSign,
          userRole: user.role,
          claimedAt: pass.claimedAt,
        };
      }),
    
    // Mark pass as used
    markUsed: staffProcedure
      .input(z.object({ passId: z.number(), eventId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.markPassUsed(input.passId);
        
        await db.createCheckInLog({
          eventId: input.eventId,
          eventPassId: input.passId,
          scannedByUserId: ctx.user.id,
          result: "accepted",
        });
        
        return { success: true };
      }),
    
    // Get check-in logs for event
    getCheckInLogs: staffProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return db.getCheckInLogs(input.eventId);
      }),
    
    // Check in by scannable code (manual entry or QR scan)
    checkInByCode: staffProcedure
      .input(z.object({ 
        code: z.string(),
        eventId: z.number(),
        reputationPoints: z.number().default(10)
      }))
      .mutation(async ({ input, ctx }) => {
        // Find pass by scannable code or QR payload
        let pass = await db.getEventPassByScannableCode(input.code);
        if (!pass) {
          pass = await db.getEventPassByQr(input.code);
        }
        
        if (!pass) {
          await db.createCheckInLog({
            eventId: input.eventId,
            scannedByUserId: ctx.user.id,
            result: "rejected",
            reason: "Pass not found",
          });
          return { success: false, error: "Pass not found" };
        }
        
        if (pass.eventId !== input.eventId) {
          await db.createCheckInLog({
            eventId: input.eventId,
            eventPassId: pass.id,
            scannedByUserId: ctx.user.id,
            result: "rejected",
            reason: "Pass is for different event",
          });
          return { success: false, error: "Pass is for a different event" };
        }
        
        // Perform check-in
        const result = await db.checkInPass(pass.id, ctx.user.id, input.reputationPoints);
        
        if (result.success) {
          const user = await db.getUserById(pass.userId);
          return { 
            success: true, 
            userCallSign: user?.callSign || "Unknown",
            userName: user?.name || "Unknown",
            reputationAwarded: input.reputationPoints,
            plusOneName: pass.plusOneName,
          };
        }
        
        return result;
      }),
    
    // Get event attendance list
    getAttendance: staffProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return db.getEventAttendance(input.eventId);
      }),
    
    // Get check-in stats for event
    getCheckInStats: staffProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return db.getEventCheckInStats(input.eventId);
      }),
  }),

  // ============================================================================
  // USER ROUTER - Admin management
  // ============================================================================
  user: router({
    list: adminProcedure
      .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }).optional())
      .query(async ({ input }) => {
        return db.getAllUsers(input?.limit, input?.offset);
      }),
    
    getMarked: adminProcedure.query(async () => {
      return db.getMarkedUsers();
    }),
    
    revoke: adminProcedure
      .input(z.object({ userId: z.number(), reason: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await db.revokeUser(input.userId, input.reason, ctx.user.id);
        
        const user = await db.getUserById(input.userId);
        await db.createAuditLog({
          action: "user_revoked",
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || "Admin",
          targetType: "user",
          targetId: input.userId,
          targetIdentifier: user?.callSign || undefined,
          description: input.reason,
        });
        
        return { success: true };
      }),
    
    ban: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.banUser(input.userId, ctx.user.id);
        
        const user = await db.getUserById(input.userId);
        await db.createAuditLog({
          action: "user_banned",
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || "Admin",
          targetType: "user",
          targetId: input.userId,
          targetIdentifier: user?.callSign || undefined,
        });
        
        return { success: true };
      }),
    
    changeRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["public", "marked_initiate", "marked_member", "marked_inner_circle", "staff", "admin"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserById(input.userId);
        const previousRole = user?.role;
        
        await db.updateUserRole(input.userId, input.role);
        
        await db.createAuditLog({
          action: "user_role_changed",
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || "Admin",
          targetType: "user",
          targetId: input.userId,
          targetIdentifier: user?.callSign || undefined,
          previousValue: previousRole,
          newValue: input.role,
        });
        
        return { success: true };
      }),
    
    // Admin: Unmark a user (revoke their mark with consequences)
    unmark: adminProcedure
      .input(z.object({
        userId: z.number(),
        reason: z.string().min(10, "Please provide a reason for unmarking"),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserById(input.userId);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        
        // Set mark_state to revoked
        await db.updateUserMarkState(input.userId, "revoked");
        
        // Revoke all their artifacts
        const artifacts = await db.getArtifactsByUser(input.userId);
        for (const artifact of artifacts) {
          await db.revokeArtifact(artifact.id, input.reason);
        }
        
        // Create memory log for the revocation (persists even after revocation)
        await db.createMemoryLog({
          userId: input.userId,
          memoryType: "mark_revoked",
          referenceId: input.userId,
          referenceType: "user",
          details: `Mark revoked: ${input.reason}`,
          visibilityLevel: "inner_only",
        });
        
        // Audit log
        await db.createAuditLog({
          action: "mark_revoked",
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || "Admin",
          targetType: "user",
          targetId: input.userId,
          targetIdentifier: user.callSign || undefined,
          description: input.reason,
        });
        
        return { success: true, callSign: user.callSign };
      }),
    
    // Admin: Update user's mark state
    updateMarkState: adminProcedure
      .input(z.object({
        userId: z.number(),
        markState: z.enum(["outside", "initiate", "member", "inner_circle", "revoked"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserById(input.userId);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        
        const previousState = user.markState;
        await db.updateUserMarkState(input.userId, input.markState);
        
        // Create memory log for state change
        if (input.markState !== previousState) {
          await db.createMemoryLog({
            userId: input.userId,
            memoryType: "state_change",
            referenceId: input.userId,
            referenceType: "user",
            details: `Mark state changed from ${previousState} to ${input.markState}`,
          });
        }
        
        await db.createAuditLog({
          action: "user_role_changed",
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || "Admin",
          targetType: "user",
          targetId: input.userId,
          targetIdentifier: user.callSign || undefined,
          previousValue: previousState,
          newValue: input.markState,
          description: `Mark state updated`,
        });
        
        return { success: true };
      }),
  }),

  // ============================================================================
  // INSIDE ROUTER - Feed for marked users
  // ============================================================================
  inside: router({
    getFeed: markedProcedure.query(async () => {
      const doctrines = await db.getDoctrineCards();
      return { doctrines };
    }),
    
    getProfile: markedProcedure.query(async ({ ctx }) => {
      const artifacts = await db.getArtifactsByUser(ctx.user.id);
      return {
        callSign: ctx.user.callSign,
        chapter: ctx.user.chapter,
        role: ctx.user.role,
        status: ctx.user.status,
        createdAt: ctx.user.createdAt,
        artifacts: artifacts.map(a => ({
          serialNumber: a.serialNumber,
          markedAt: a.markedAt,
        })),
      };
    }),
  }),

  // ============================================================================
  // COMMUNITY ROUTER - Public community stats and activity
  // ============================================================================
  community: router({
    // Public: get community stats (no auth required)
    getStats: publicProcedure.query(async () => {
      return db.getCommunityStats();
    }),
    
    // Public: get recent markings (anonymized for non-marked users)
    getRecentMarkings: publicProcedure.query(async ({ ctx }) => {
      const markings = await db.getRecentMarkings(10);
      const isMarked = ctx.user && ['marked_initiate', 'marked_member', 'marked_inner_circle', 'staff', 'admin'].includes(ctx.user.role);
      
      // Anonymize call signs for non-marked users
      return markings.map(m => ({
        ...m,
        callSign: isMarked ? m.callSign : m.callSign?.substring(0, 2) + '***',
      }));
    }),
    
    // Marked only: get recent check-ins
    getRecentCheckIns: markedProcedure.query(async () => {
      return db.getRecentCheckIns(10);
    }),
    
    // Public: get activity feed (combined markings and check-ins)
    getActivityFeed: publicProcedure.query(async ({ ctx }) => {
      const markings = await db.getRecentMarkings(5);
      const isMarked = ctx.user && ['marked_initiate', 'marked_member', 'marked_inner_circle', 'staff', 'admin'].includes(ctx.user.role);
      
      const activity = markings.map(m => ({
        type: 'marking' as const,
        id: m.id,
        callSign: isMarked ? m.callSign : m.callSign?.substring(0, 2) + '***',
        chapter: m.chapter,
        dropTitle: m.dropTitle,
        createdAt: m.createdAt,
      }));
      
      return activity.sort((a, b) => 
        new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
      );
    }),
  }),

  // ============================================================================
  // MARK ROUTER - Mark acquisition during sale windows
  // ============================================================================
  mark: router({
    // Acquire a mark during sale window (requires clearance)
    acquire: protectedProcedure
      .input(z.object({
        dropId: z.number(),
        size: z.string().optional(),
        shippingAddress: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check clearance state
        if (ctx.user.clearanceState !== "granted") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Clearance required to acquire marks" });
        }
        
        // Check clearance expiry
        if (ctx.user.clearanceExpiresAt && new Date(ctx.user.clearanceExpiresAt) < new Date()) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Your clearance has expired" });
        }
        
        // Get drop and check sale window
        const drop = await db.getDropById(input.dropId);
        if (!drop) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Drop not found" });
        }
        
        const now = new Date();
        if (drop.saleWindowStart && drop.saleWindowEnd) {
          if (now < new Date(drop.saleWindowStart) || now > new Date(drop.saleWindowEnd)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Sale window is not open" });
          }
        }
        
        // Check gating restrictions (layer-based and attendance-locked)
        const gatingResult = await checkDropGating(
          ctx.user,
          drop,
          db.getEventPassesByUser,
          db.getEventById
        );
        
        if (!gatingResult.canPurchase) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: gatingResult.reason || "You do not have access to purchase this item"
          });
        }
        
        // Find an available artifact from this drop
        const availableArtifact = await db.getFirstAvailableArtifact(input.dropId);
        if (!availableArtifact) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No artifacts available" });
        }
        
        // Create order record
        const order = await db.createOrder({
          userId: ctx.user.id,
          dropId: input.dropId,
          artifactId: availableArtifact.id,
          status: "pending",
          shippingAddress: input.shippingAddress,
          size: input.size,
          totalAmount: drop.priceIdr || 0,
        });
        
        // Reserve the artifact
        await db.reserveArtifact(availableArtifact.id, ctx.user.id);
        
        // Log the acquisition
        await db.createAuditLog({
          action: "mark_acquired",
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.openId,
          targetType: "artifact",
          targetId: availableArtifact.id,
          description: `Reserved artifact ${availableArtifact.serialNumber} from drop ${drop.title}`,
        });
        
        return { 
          success: true, 
          orderId: order.id,
          serialNumber: availableArtifact.serialNumber,
        };
      }),
      
    // Get user's orders
    getMyOrders: protectedProcedure.query(async ({ ctx }) => {
      return db.getOrdersByUserId(ctx.user.id);
    }),
  }),

  // ============================================================================
  // CLEARANCE ROUTER - Clearance request system
  // ============================================================================
  clearance: router({
    // Get current user's clearance request
    getMyRequest: protectedProcedure.query(async ({ ctx }) => {
      return db.getClearanceRequestByUserId(ctx.user.id);
    }),
    
    // Submit a clearance request
    submit: protectedProcedure
      .input(z.object({
        reason: z.string().min(50, "Please provide at least 50 characters"),
        vouchCallSign: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if user already has clearance
        if (ctx.user.clearanceState === 'granted') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'You already have clearance' });
        }
        if (ctx.user.clearanceState === 'applied') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'You already have a pending request' });
        }
        
        const requestId = await db.createClearanceRequest({
          userId: ctx.user.id,
          reason: input.reason,
          vouchCallSign: input.vouchCallSign,
        });
        
        return { success: true, requestId };
      }),
    
    // Admin: List pending requests
    listPending: adminProcedure.query(async () => {
      return db.getPendingClearanceRequests();
    }),
    
    // Admin: Approve request
    approve: adminProcedure
      .input(z.object({ requestId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.approveClearanceRequest(input.requestId, ctx.user.id);
        
        await db.createAuditLog({
          action: 'clearance_approved',
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || 'Admin',
          targetType: 'clearance_request',
          targetId: input.requestId,
          description: `Clearance approved, code expires ${result.expiresAt.toISOString()}`,
        });
        
        return result;
      }),
    
    // Admin: Deny request
    deny: adminProcedure
      .input(z.object({
        requestId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.denyClearanceRequest(input.requestId, ctx.user.id, input.reason);
        
        await db.createAuditLog({
          action: 'clearance_denied',
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || 'Admin',
          targetType: 'clearance_request',
          targetId: input.requestId,
          description: input.reason || 'Clearance denied',
        });
        
        return { success: true };
      }),
  }),

  // ============================================================================
  // DOCTRINE ROUTER - Admin content management
  // ============================================================================
  doctrine: router({
    list: adminProcedure.query(async () => {
      return db.getDoctrineCards();
    }),
    
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        isPinned: z.boolean().default(false),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        await db.createDoctrineCard(input);
        return { success: true };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        isPinned: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateDoctrineCard(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDoctrineCard(input.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // AUDIT ROUTER - View logs
  // ============================================================================
  audit: router({
    getLogs: adminProcedure
      .input(z.object({ limit: z.number().default(100) }).optional())
      .query(async ({ input }) => {
        return db.getAuditLogs(input?.limit);
      }),
    
    getMarkingLogs: adminProcedure
      .input(z.object({ limit: z.number().default(100) }).optional())
      .query(async ({ input }) => {
        return db.getMarkingLogs(input?.limit);
      }),
  }),

  // ============================================================================
  // UGC ROUTER - Curated user-generated content
  // ============================================================================
  ugc: router({
    // Public: Get UGC for a drop (public visibility only)
    getByDrop: publicProcedure
      .input(z.object({ dropId: z.number() }))
      .query(async ({ input, ctx }) => {
        // If user is marked or staff, show all; otherwise only public
        const user = ctx.user;
        if (user && (isMarked(user as User) || isStaff(user as User))) {
          return db.getUgcMediaByDrop(input.dropId);
        }
        return db.getUgcMediaByDrop(input.dropId, 'public');
      }),
    
    // Public: Get UGC for an artifact (with fallback to drop)
    getByArtifact: publicProcedure
      .input(z.object({ serialNumber: z.string() }))
      .query(async ({ input, ctx }) => {
        const artifact = await db.getArtifactBySerial(input.serialNumber);
        if (!artifact) return [];
        
        const user = ctx.user;
        const visibility = (user && (isMarked(user as User) || isStaff(user as User))) ? undefined : 'public';
        
        // First try artifact-specific UGC
        const artifactUgc = await db.getUgcMediaByArtifact(artifact.id, visibility as 'public' | 'inside_only' | undefined);
        if (artifactUgc.length > 0) {
          return artifactUgc;
        }
        
        // Fallback to drop-level UGC
        return db.getUgcMediaByDrop(artifact.dropId, visibility as 'public' | 'inside_only' | undefined);
      }),
    
    // Admin: List all UGC
    list: adminProcedure
      .query(async () => {
        return db.getAllUgcMedia();
      }),
    
    // Admin: Upload UGC
    create: adminProcedure
      .input(z.object({
        type: z.enum(['image', 'video']),
        storageUrl: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
        dropId: z.number().optional(),
        artifactId: z.number().optional(),
        caption: z.string().max(40).optional(),
        visibility: z.enum(['public', 'inside_only']).default('public'),
        sortOrder: z.number().default(0),
        consentNote: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { consentNote, ...ugcData } = input;
        
        const ugcId = await db.createUgcMedia(ugcData);
        
        // Log consent if provided
        if (consentNote) {
          await db.createUgcConsent({
            ugcMediaId: ugcId,
            consentStatus: 'granted',
            consentNote,
          });
        }
        
        await db.createAuditLog({
          action: 'drop_created', // Using existing action type
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || 'Admin',
          targetType: 'ugc',
          targetId: ugcId,
          description: `UGC media uploaded: ${input.type}`,
        });
        
        return { success: true, id: ugcId };
      }),
    
    // Admin: Update UGC
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        dropId: z.number().optional().nullable(),
        artifactId: z.number().optional().nullable(),
        caption: z.string().max(40).optional().nullable(),
        visibility: z.enum(['public', 'inside_only']).optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateUgcMedia(id, data as Parameters<typeof db.updateUgcMedia>[1]);
        return { success: true };
      }),
    
    // Admin: Delete UGC
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteUgcMedia(input.id);
        
        await db.createAuditLog({
          action: 'drop_archived', // Using existing action type
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || 'Admin',
          targetType: 'ugc',
          targetId: input.id,
          description: 'UGC media deleted',
        });
        
        return { success: true };
      }),
  }),

  // ============================================================================
  // MEMORY ROUTER - Permanent Memory Graph
  // ============================================================================
  memory: router({
    // Get user's memory logs (authenticated users only)
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getMemoryLogsByUserId(ctx.user.id);
    }),
    
    // Admin: Get all memory logs for a user
    getByUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getMemoryLogsByUserId(input.userId);
      }),
  }),

  // ============================================================================
  // NOTIFICATION ROUTER
  // ============================================================================
  notification: router({
    // Get user's notifications
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getNotificationsByUser(ctx.user.id);
    }),
    
    // Get unread count
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadNotificationCount(ctx.user.id);
    }),
    
    // Mark notification as read
    markRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationRead(input.notificationId);
        return { success: true };
      }),
    
    // Mark all as read
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
    
    // Get preferences
    getPreferences: protectedProcedure.query(async ({ ctx }) => {
      return db.getNotificationPreferences(ctx.user.id);
    }),
    
    // Update preferences
    updatePreferences: protectedProcedure
      .input(z.object({
        newDrops: z.boolean().optional(),
        newEvents: z.boolean().optional(),
        eventReminders: z.boolean().optional(),
        exclusiveContent: z.boolean().optional(),
        referralUpdates: z.boolean().optional(),
        systemAnnouncements: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.upsertNotificationPreferences(ctx.user.id, input);
        return { success: true };
      }),
    
    // Subscribe to push notifications
    subscribe: protectedProcedure
      .input(z.object({
        endpoint: z.string(),
        p256dh: z.string(),
        auth: z.string(),
        userAgent: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createNotificationSubscription({
          userId: ctx.user.id,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
          userAgent: input.userAgent,
        });
        return { success: true };
      }),
    
    // Admin: Send notification to all users
    broadcast: adminProcedure
      .input(z.object({
        title: z.string(),
        body: z.string(),
        type: z.enum(['new_drop', 'new_event', 'system_announcement']),
      }))
      .mutation(async ({ input }) => {
        // Get all marked users
        const markedUsers = await db.getMarkedUsers(1000);
        
        // Create notifications for each user
        for (const user of markedUsers) {
          await db.createNotification({
            userId: user.id,
            type: input.type,
            title: input.title,
            body: input.body,
            sentAt: new Date(),
          });
        }
        
        return { success: true, count: markedUsers.length };
      }),
  }),

  // ============================================================================
  // RSVP ROUTER - Event RSVP & Check-in
  // ============================================================================
  rsvp: router({
    // RSVP to an event
    create: markedProcedure
      .input(z.object({
        eventId: z.number(),
        plusOneName: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if already RSVPed
        const existing = await db.getEventRsvpByUserAndEvent(ctx.user.id, input.eventId);
        if (existing) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already RSVPed to this event' });
        }
        
        // Check event capacity
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }
        
        const rsvpCount = await db.getEventRsvpCount(input.eventId);
        if (event.capacity && rsvpCount >= event.capacity) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Event is at capacity' });
        }
        
        const result = await db.createEventRsvp({
          eventId: input.eventId,
          userId: ctx.user.id,
          plusOneName: input.plusOneName,
        });
        
        return result;
      }),
    
    // Get user's RSVP for an event
    get: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getEventRsvpByUserAndEvent(ctx.user.id, input.eventId);
      }),
    
    // Get RSVP count for an event
    count: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return db.getEventRsvpCount(input.eventId);
      }),
    
    // Cancel RSVP
    cancel: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.cancelEventRsvp(ctx.user.id, input.eventId);
        return { success: true };
      }),
    
    // Staff: Check in attendee
    checkIn: staffProcedure
      .input(z.object({ qrCode: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const rsvp = await db.checkInEventRsvp(input.qrCode, ctx.user.id);
        const user = await db.getUserById(rsvp.userId);
        
        // Award reputation points for attendance
        await db.addReputationPoints({
          userId: rsvp.userId,
          eventType: 'event_attendance',
          points: 50,
          referenceId: rsvp.eventId,
          referenceType: 'event',
          description: 'Attended event',
        });
        
        return { 
          success: true, 
          user: { callSign: user?.callSign, chapter: user?.chapter },
          plusOneName: rsvp.plusOneName,
        };
      }),
    
    // Staff: Get all RSVPs for an event
    listByEvent: staffProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return db.getEventRsvps(input.eventId);
      }),
  }),

  // ============================================================================
  // LEADERBOARD ROUTER - Reputation & Rankings
  // ============================================================================
  leaderboard: router({
    // Get top members
    top: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
      .query(async ({ input }) => {
        return db.getLeaderboard(input.limit);
      }),
    
    // Get user's reputation details
    myReputation: protectedProcedure.query(async ({ ctx }) => {
      const events = await db.getReputationEvents(ctx.user.id);
      const rank = await db.getUserRank(ctx.user.id);
      const user = await db.getUserById(ctx.user.id);
      
      // Calculate tier based on points
      const points = user?.reputationPoints || 0;
      let tier = 'Bronze';
      if (points >= 5000) tier = 'Platinum';
      else if (points >= 2000) tier = 'Gold';
      else if (points >= 500) tier = 'Silver';
      
      return {
        points,
        rank,
        tier,
        events,
      };
    }),
    
    // Get user's rank
    myRank: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserRank(ctx.user.id);
    }),
    
    // Admin: Award bonus points
    awardBonus: adminProcedure
      .input(z.object({
        userId: z.number(),
        points: z.number(),
        description: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.addReputationPoints({
          userId: input.userId,
          eventType: 'admin_bonus',
          points: input.points,
          description: input.description,
        });
        return { success: true };
      }),
  }),

  // ============================================================================
  // REFERRAL ROUTER
  // ============================================================================
  referral: router({
    // Get or generate referral code
    getCode: markedProcedure.query(async ({ ctx }) => {
      const code = await db.generateReferralCode(ctx.user.id);
      return { code };
    }),
    
    // Get referral stats
    stats: markedProcedure.query(async ({ ctx }) => {
      return db.getReferralStats(ctx.user.id);
    }),
    
    // Get referral history
    history: markedProcedure.query(async ({ ctx }) => {
      return db.getReferralsByReferrer(ctx.user.id);
    }),
    
    // Validate referral code (public - for signup flow)
    validate: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const referrer = await db.getUserByReferralCode(input.code);
        if (!referrer) {
          return { valid: false, referrer: null };
        }
        return { 
          valid: true, 
          referrer: { 
            callSign: referrer.callSign,
            chapter: referrer.chapter,
          } 
        };
      }),
  }),

  // ============================================================================
  // TIER ROUTER - Member tier progress and badges
  // ============================================================================
  tier: router({
    // Get user's tier progress
    progress: protectedProcedure.query(async ({ ctx }) => {
      const stats = await db.getUserTierStats(ctx.user.id);
      
      // Import tier calculation functions
      const { calculateTierProgress, calculateUserTier } = await import('../shared/tierConfig');
      
      const progress = calculateTierProgress(stats);
      const currentTier = calculateUserTier(stats);
      
      return {
        stats,
        currentTier,
        progress,
      };
    }),
    
    // Get tier configuration (public)
    config: publicProcedure.query(async () => {
      const { TIERS, TIER_REQUIREMENTS } = await import('../shared/tierConfig');
      return { tiers: TIERS, requirements: TIER_REQUIREMENTS };
    }),
  }),

  // ============================================================================
  // SPONSOR ROUTER - Sponsor management and analytics
  // ============================================================================
  sponsor: router({
    // Public: Get active sponsors for display
    list: publicProcedure.query(async () => {
      return db.getSponsors({ status: 'active' });
    }),
    
    // Public: Get sponsors for homepage
    homepage: publicProcedure.query(async () => {
      return db.getSponsors({ status: 'active', showOnHomepage: true });
    }),
    
    // Public: Get sponsors for a specific event
    forEvent: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return db.getSponsorsForEvent(input.eventId);
      }),
    
    // Public: Get sponsors for a specific drop
    forDrop: publicProcedure
      .input(z.object({ dropId: z.number() }))
      .query(async ({ input }) => {
        return db.getSponsorsForDrop(input.dropId);
      }),
    
    // Public: Get sponsor by slug
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return db.getSponsorBySlug(input.slug);
      }),
    
    // Public: Track impression/click
    track: publicProcedure
      .input(z.object({
        sponsorId: z.number(),
        eventType: z.enum(['impression', 'click', 'hover']),
        pageType: z.enum(['homepage', 'event', 'drop', 'sponsors']),
        referenceId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.trackSponsorAnalytic({
          ...input,
          userId: ctx.user?.id,
        });
        return { success: true };
      }),
    
    // Public: Submit sponsor inquiry
    inquiry: publicProcedure
      .input(z.object({
        companyName: z.string().min(1),
        contactName: z.string().min(1),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
        sponsorTier: z.enum(['platinum', 'gold', 'silver', 'bronze']).optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.createSponsorInquiry(input);
        return { success: true, id: result.id };
      }),
    
    // Admin: Get all sponsors (including inactive)
    adminList: adminProcedure.query(async () => {
      return db.getSponsors();
    }),
    
    // Admin: Create sponsor
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        logoUrl: z.string().optional(),
        websiteUrl: z.string().optional(),
        tier: z.enum(['platinum', 'gold', 'silver', 'bronze']),
        status: z.enum(['active', 'pending', 'expired', 'paused']).optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().optional(),
        showOnHomepage: z.boolean().optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createSponsor(input);
      }),
    
    // Admin: Update sponsor
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        logoUrl: z.string().optional(),
        websiteUrl: z.string().optional(),
        tier: z.enum(['platinum', 'gold', 'silver', 'bronze']).optional(),
        status: z.enum(['active', 'pending', 'expired', 'paused']).optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().optional(),
        showOnHomepage: z.boolean().optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateSponsor(id, data);
        return { success: true };
      }),
    
    // Admin: Delete sponsor
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSponsor(input.id);
        return { success: true };
      }),
    
    // Admin: Link sponsor to event
    linkEvent: adminProcedure
      .input(z.object({
        sponsorId: z.number(),
        eventId: z.number(),
        isPrimary: z.boolean().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.linkSponsorToEvent(input.sponsorId, input.eventId, input.isPrimary, input.message);
        return { success: true };
      }),
    
    // Admin: Unlink sponsor from event
    unlinkEvent: adminProcedure
      .input(z.object({
        sponsorId: z.number(),
        eventId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.unlinkSponsorFromEvent(input.sponsorId, input.eventId);
        return { success: true };
      }),
    
    // Admin: Link sponsor to drop
    linkDrop: adminProcedure
      .input(z.object({
        sponsorId: z.number(),
        dropId: z.number(),
        isPrimary: z.boolean().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.linkSponsorToDrop(input.sponsorId, input.dropId, input.isPrimary, input.message);
        return { success: true };
      }),
    
    // Admin: Unlink sponsor from drop
    unlinkDrop: adminProcedure
      .input(z.object({
        sponsorId: z.number(),
        dropId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.unlinkSponsorFromDrop(input.sponsorId, input.dropId);
        return { success: true };
      }),
    
    // Admin: Get sponsor analytics
    analytics: adminProcedure
      .input(z.object({
        sponsorId: z.number(),
        days: z.number().optional().default(30),
      }))
      .query(async ({ input }) => {
        return db.getSponsorAnalytics(input.sponsorId, input.days);
      }),
    
    // Admin: Get sponsor inquiries
    inquiries: adminProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(async ({ input }) => {
        return db.getSponsorInquiries(input.status);
      }),
    
    // Admin: Update inquiry status
    updateInquiry: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateSponsorInquiry(id, data);
        return { success: true };
      }),
  }),

  // ============================================================================
  // CIPHER ROUTER - Personal Cipher (TOTP) System
  // ============================================================================
  cipher: cipherRouter,

  // ============================================================================
  // SOCIAL ROUTER - Posts, Comments, Likes, Follows
  // ============================================================================
  social: router({
    // --- FEED ---
    
    // Public: Get feed posts
    feed: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        postType: z.enum(['text', 'photo', 'video', 'announcement', 'event_recap', 'drop_preview']).optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        const user = ctx.user;
        let visibility: 'public' | 'members' | 'inner_circle' = 'public';
        
        if (user) {
          if (user.role === 'marked_inner_circle' || user.role === 'admin') {
            visibility = 'inner_circle';
          } else if (isMarked(user as User) || isStaff(user as User)) {
            visibility = 'members';
          }
        }
        
        const posts = await db.getFeedPosts({
          visibility,
          limit: input?.limit || 20,
          offset: input?.offset || 0,
          postType: input?.postType,
        });
        
        // Get user's likes for these posts
        let userLikes: number[] = [];
        let userBookmarks: number[] = [];
        if (user && posts.length > 0) {
          const postIds = posts.map(p => p.id);
          userLikes = await db.getUserLikes(user.id, 'post', postIds);
          // Check bookmarks
          const bookmarkChecks = await Promise.all(
            postIds.map(id => db.isBookmarked(user.id, id))
          );
          userBookmarks = postIds.filter((_, i) => bookmarkChecks[i]);
        }
        
        return posts.map(post => ({
          ...post,
          isLiked: userLikes.includes(post.id),
          isBookmarked: userBookmarks.includes(post.id),
        }));
      }),
    
    // Public: Get single post with comments
    getById: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input, ctx }) => {
        const post = await db.getPostById(input.postId);
        if (!post) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
        }
        
        // Check visibility
        const user = ctx.user;
        if (post.visibility !== 'public') {
          if (!user) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Login required' });
          }
          if (post.visibility === 'inner_circle' && 
              user.role !== 'marked_inner_circle' && user.role !== 'admin') {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Inner circle only' });
          }
          if (post.visibility === 'members' && !isMarked(user as User) && !isStaff(user as User)) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Members only' });
          }
        }
        
        // Get comments
        const comments = await db.getCommentsByPost(input.postId, { parentId: null });
        
        // Get user's like status
        let isLiked = false;
        let isBookmarked = false;
        if (user) {
          const likes = await db.getUserLikes(user.id, 'post', [post.id]);
          isLiked = likes.includes(post.id);
          isBookmarked = await db.isBookmarked(user.id, post.id);
        }
        
        return {
          ...post,
          isLiked,
          isBookmarked,
          comments,
        };
      }),
    
    // --- COMMENTS ---
    
    // Protected: Add comment
    addComment: protectedProcedure
      .input(z.object({
        postId: z.number(),
        content: z.string().min(1).max(2000),
        parentId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if post exists and allows comments
        const post = await db.getPostById(input.postId);
        if (!post) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
        }
        if (!post.allowComments) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Comments disabled on this post' });
        }
        
        const result = await db.createComment({
          postId: input.postId,
          userId: ctx.user.id,
          content: input.content,
          parentId: input.parentId,
        });
        
        return { success: true, commentId: result.id };
      }),
    
    // Protected: Get replies to a comment
    getReplies: publicProcedure
      .input(z.object({
        postId: z.number(),
        parentId: z.number(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        return db.getCommentsByPost(input.postId, {
          parentId: input.parentId,
          limit: input.limit,
          offset: input.offset,
        });
      }),
    
    // Admin: Delete comment
    deleteComment: adminProcedure
      .input(z.object({ commentId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteComment(input.commentId);
        return { success: true };
      }),
    
    // Admin: Hide comment (soft delete)
    hideComment: adminProcedure
      .input(z.object({
        commentId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.hideComment(input.commentId, ctx.user.id, input.reason);
        return { success: true };
      }),
    
    // --- LIKES ---
    
    // Protected: Toggle like on post or comment
    toggleLike: protectedProcedure
      .input(z.object({
        targetType: z.enum(['post', 'comment']),
        targetId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.toggleLike(ctx.user.id, input.targetType, input.targetId);
      }),
    
    // --- BOOKMARKS ---
    
    // Protected: Toggle bookmark
    toggleBookmark: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return db.toggleBookmark(ctx.user.id, input.postId);
      }),
    
    // Protected: Get user's bookmarks
    getBookmarks: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input, ctx }) => {
        return db.getUserBookmarks(ctx.user.id, input?.limit || 20, input?.offset || 0);
      }),
    
    // --- FOLLOWS ---
    
    // Protected: Toggle follow
    toggleFollow: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return db.toggleFollow(ctx.user.id, input.userId);
      }),
    
    // Public: Check if following
    isFollowing: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.isFollowing(ctx.user.id, input.userId);
      }),
    
    // Public: Get followers
    getFollowers: publicProcedure
      .input(z.object({
        userId: z.number(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        return db.getFollowers(input.userId, input.limit, input.offset);
      }),
    
    // Public: Get following
    getFollowing: publicProcedure
      .input(z.object({
        userId: z.number(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        return db.getFollowing(input.userId, input.limit, input.offset);
      }),
    
    // --- USER PROFILE ---
    
    // Public: Get user profile
    getProfile: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const profile = await db.getUserProfile(input.userId);
        const user = await db.getUserById(input.userId);
        
        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
        }
        
        return {
          userId: user.id,
          name: user.name,
          callSign: user.callSign,
          role: user.role,
          chapter: user.chapter,
          reputationPoints: user.reputationPoints,
          createdAt: user.createdAt,
          ...profile,
        };
      }),
    
    // Protected: Update own profile
    updateProfile: protectedProcedure
      .input(z.object({
        bio: z.string().max(500).optional(),
        coverImageUrl: z.string().url().optional(),
        avatarUrl: z.string().url().optional(),
        location: z.string().max(128).optional(),
        website: z.string().url().max(255).optional(),
        isPublic: z.boolean().optional(),
        showActivity: z.boolean().optional(),
        showFollowers: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.upsertUserProfile(ctx.user.id, input);
        return { success: true };
      }),
    
    // --- ADMIN POST MANAGEMENT ---
    
    // Admin: Create post
    createPost: adminProcedure
      .input(z.object({
        content: z.string().min(1).max(10000),
        mediaUrls: z.array(z.string().url()).optional(),
        postType: z.enum(['text', 'photo', 'video', 'announcement', 'event_recap', 'drop_preview']).default('text'),
        visibility: z.enum(['public', 'members', 'inner_circle', 'private']).default('public'),
        linkedEventId: z.number().optional(),
        linkedDropId: z.number().optional(),
        isPinned: z.boolean().optional(),
        allowComments: z.boolean().default(true),
        scheduledFor: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createPost({
          authorId: ctx.user.id,
          content: input.content,
          mediaUrls: input.mediaUrls,
          postType: input.postType,
          visibility: input.visibility,
          linkedEventId: input.linkedEventId,
          linkedDropId: input.linkedDropId,
          isPinned: input.isPinned,
          allowComments: input.allowComments,
          scheduledFor: input.scheduledFor,
        });
        
        await db.createAuditLog({
          action: 'drop_created',
          userId: ctx.user.id,
          userName: ctx.user.callSign || ctx.user.name || 'Admin',
          targetType: 'post',
          targetId: result.id,
          description: `Created ${input.postType} post`,
        });
        
        return { success: true, postId: result.id };
      }),
    
    // Admin: Update post
    updatePost: adminProcedure
      .input(z.object({
        postId: z.number(),
        content: z.string().min(1).max(10000).optional(),
        mediaUrls: z.array(z.string().url()).optional(),
        visibility: z.enum(['public', 'members', 'inner_circle', 'private']).optional(),
        allowComments: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { postId, ...data } = input;
        await db.updatePost(postId, data);
        return { success: true };
      }),
    
    // Admin: Delete post
    deletePost: adminProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePost(input.postId);
        return { success: true };
      }),
    
    // Admin: Pin/unpin post
    togglePin: adminProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ input }) => {
        const post = await db.getPostById(input.postId);
        if (!post) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
        }
        
        if (post.isPinned) {
          await db.unpinPost(input.postId);
          return { success: true, isPinned: false };
        } else {
          await db.pinPost(input.postId);
          return { success: true, isPinned: true };
        }
      }),
    
    // Admin: Get all posts (including scheduled/private)
    adminList: adminProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        const db2 = await db.getDb();
        if (!db2) return [];
        
        const { posts: postsTable, users: usersTable } = await import('../drizzle/schema');
        const { desc } = await import('drizzle-orm');
        
        const result = await db2.select({
          post: postsTable,
          author: {
            id: usersTable.id,
            name: usersTable.name,
            callSign: usersTable.callSign,
          },
        })
          .from(postsTable)
          .innerJoin(usersTable, (await import('drizzle-orm')).eq(postsTable.authorId, usersTable.id))
          .orderBy(desc(postsTable.createdAt))
          .limit(input?.limit || 50)
          .offset(input?.offset || 0);
        
        return result.map(r => ({
          ...r.post,
          author: r.author,
        }));
      }),
  }),
});

export type AppRouter = typeof appRouter;
