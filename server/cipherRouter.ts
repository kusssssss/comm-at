/**
 * Personal Cipher Router - TOTP-style authentication for comm@
 * 
 * Handles enrollment, validation, device binding, and recovery codes.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as cipher from "./cipher";

// ============================================================================
// CIPHER ROUTER
// ============================================================================

export const cipherRouter = router({
  // ============================================================================
  // INVITE CODE VALIDATION (Public - for enrollment flow)
  // ============================================================================
  validateInvite: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const inviteCode = await db.getInviteCodeByCode(input.code);
      
      if (!inviteCode) {
        return { valid: false, message: "Invalid invite code" };
      }
      
      if (inviteCode.status !== 'active') {
        return { valid: false, message: "This invite code has already been used" };
      }
      
      if (inviteCode.expiresAt && new Date() > inviteCode.expiresAt) {
        return { valid: false, message: "This invite code has expired" };
      }
      
      return { 
        valid: true, 
        defaultLayer: inviteCode.defaultLayer,
        message: "Valid invite code" 
      };
    }),

  // ============================================================================
  // ENROLLMENT FLOW
  // ============================================================================
  
  // Step 1: Start enrollment with invite code
  startEnrollment: protectedProcedure
    .input(z.object({
      inviteCode: z.string(),
      callSign: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/, "Call sign can only contain letters, numbers, and underscores"),
      deviceFingerprint: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verify invite code
      const invite = await db.getInviteCodeByCode(input.inviteCode);
      if (!invite || invite.status !== 'active') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid or expired invite code' });
      }
      
      if (invite.expiresAt && new Date() > invite.expiresAt) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invite code has expired' });
      }
      
      // Check if user already has cipher enrolled
      if (ctx.user.cipherSeed) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You already have a Personal Cipher enrolled' });
      }
      
      // Check if call sign is taken
      const existingCallSign = await db.getUserByCallSign(input.callSign);
      if (existingCallSign && existingCallSign.id !== ctx.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This call sign is already taken' });
      }
      
      // Generate cipher seed
      const cipherSeed = cipher.generateCipherSeed();
      
      // Generate recovery codes
      const recoveryCodes = cipher.generateRecoveryCodes();
      
      // Update user with cipher seed, device fingerprint, and call sign
      await db.enrollUserCipher({
        userId: ctx.user.id,
        cipherSeed,
        deviceFingerprint: input.deviceFingerprint,
        callSign: input.callSign,
        layer: invite.defaultLayer || 'initiate',
      });
      
      // Store hashed recovery codes
      for (const code of recoveryCodes) {
        await db.createRecoveryCode({
          userId: ctx.user.id,
          codeHash: cipher.hashRecoveryCode(code),
        });
      }
      
      // Mark invite code as used
      await db.useInviteCode(invite.id, ctx.user.id);
      
      // Log the enrollment
      await db.createCipherAuditLog({
        userId: ctx.user.id,
        action: 'enrollment_completed',
        details: JSON.stringify({ callSign: input.callSign }),
        deviceFingerprint: input.deviceFingerprint,
        success: true,
      });
      
      // Generate QR code for authenticator app
      const qrCode = await cipher.generateCipherQRCode(input.callSign, cipherSeed);
      const uri = cipher.getCipherURI(input.callSign, cipherSeed);
      
      return {
        success: true,
        qrCode,
        uri,
        secret: cipherSeed, // Show once for manual entry
        recoveryCodes, // Show once for user to save
        callSign: input.callSign,
      };
    }),

  // Step 2: Verify enrollment by entering first code
  verifyEnrollment: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user.cipherSeed || !ctx.user.callSign) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Enrollment not started' });
      }
      
      const isValid = cipher.validateCipherCode(ctx.user.callSign, ctx.user.cipherSeed, input.code);
      
      if (!isValid) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid code. Please try again.' });
      }
      
      // Mark enrollment as complete
      await db.completeCipherEnrollment(ctx.user.id);
      
      return { success: true, message: 'Personal Cipher activated successfully' };
    }),

  // ============================================================================
  // CIPHER VALIDATION (Sign-in)
  // ============================================================================
  
  // Validate cipher code for sign-in
  validate: protectedProcedure
    .input(z.object({
      code: z.string().length(6),
      deviceFingerprint: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if account is locked
      if (cipher.isAccountLocked(ctx.user.cipherLockedUntil)) {
        throw new TRPCError({ 
          code: 'TOO_MANY_REQUESTS', 
          message: `Account locked. Try again in ${cipher.CIPHER_CONFIG.LOCKOUT_DURATION_MINUTES} minutes.` 
        });
      }
      
      if (!ctx.user.cipherSeed || !ctx.user.callSign) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Personal Cipher not enrolled' });
      }
      
      // Validate the code
      const isValid = cipher.validateCipherCode(ctx.user.callSign, ctx.user.cipherSeed, input.code);
      
      if (!isValid) {
        // Increment failed attempts
        const failedAttempts = await db.incrementCipherFailedAttempts(ctx.user.id);
        
        // Check if should lock
        if (cipher.shouldLockAccount(failedAttempts)) {
          const lockUntil = cipher.getLockoutExpiration();
          await db.lockCipherAccount(ctx.user.id, lockUntil);
          
          await db.createCipherAuditLog({
            userId: ctx.user.id,
            action: 'account_locked',
            details: JSON.stringify({ failedAttempts }),
            deviceFingerprint: input.deviceFingerprint,
            success: false,
          });
          
          throw new TRPCError({ 
            code: 'TOO_MANY_REQUESTS', 
            message: `Too many failed attempts. Account locked for ${cipher.CIPHER_CONFIG.LOCKOUT_DURATION_MINUTES} minutes.` 
          });
        }
        
        await db.createCipherAuditLog({
          userId: ctx.user.id,
          action: 'login_failed',
          deviceFingerprint: input.deviceFingerprint,
          success: false,
        });
        
        throw new TRPCError({ 
          code: 'BAD_REQUEST', 
          message: `Invalid code. ${cipher.CIPHER_CONFIG.MAX_FAILED_ATTEMPTS - failedAttempts} attempts remaining.` 
        });
      }
      
      // Check device fingerprint
      const isKnownDevice = ctx.user.deviceFingerprint === input.deviceFingerprint;
      
      if (!isKnownDevice) {
        // New device detected - require recovery code
        await db.createCipherAuditLog({
          userId: ctx.user.id,
          action: 'login_failed',
          details: JSON.stringify({ reason: 'unknown_device' }),
          deviceFingerprint: input.deviceFingerprint,
          success: false,
        });
        
        return { 
          success: false, 
          requiresRecovery: true,
          message: 'New device detected. Please enter a recovery code to bind this device.' 
        };
      }
      
      // Success - reset failed attempts
      await db.resetCipherFailedAttempts(ctx.user.id);
      
      await db.createCipherAuditLog({
        userId: ctx.user.id,
        action: 'login_success',
        deviceFingerprint: input.deviceFingerprint,
        success: true,
      });
      
      return { success: true, message: 'Cipher validated successfully' };
    }),

  // ============================================================================
  // DEVICE RECOVERY
  // ============================================================================
  
  // Use recovery code to bind new device
  useRecoveryCode: protectedProcedure
    .input(z.object({
      recoveryCode: z.string(),
      newDeviceFingerprint: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user.cipherSeed) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Personal Cipher not enrolled' });
      }
      
      // Get unused recovery codes
      const recoveryCodes = await db.getUnusedRecoveryCodes(ctx.user.id);
      
      // Find matching code
      const matchingCode = recoveryCodes.find(rc => 
        cipher.verifyRecoveryCode(input.recoveryCode, rc.codeHash)
      );
      
      if (!matchingCode) {
        await db.createCipherAuditLog({
          userId: ctx.user.id,
          action: 'recovery_code_used',
          details: JSON.stringify({ success: false }),
          deviceFingerprint: input.newDeviceFingerprint,
          success: false,
        });
        
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid recovery code' });
      }
      
      // Mark recovery code as used
      await db.markRecoveryCodeUsed(matchingCode.id);
      
      // Update device fingerprint
      await db.updateDeviceFingerprint(ctx.user.id, input.newDeviceFingerprint);
      
      // Reset failed attempts
      await db.resetCipherFailedAttempts(ctx.user.id);
      
      await db.createCipherAuditLog({
        userId: ctx.user.id,
        action: 'device_changed',
        details: JSON.stringify({ recoveryCodeId: matchingCode.id }),
        deviceFingerprint: input.newDeviceFingerprint,
        success: true,
      });
      
      // Count remaining recovery codes
      const remainingCodes = recoveryCodes.length - 1;
      
      return { 
        success: true, 
        message: 'Device bound successfully',
        remainingRecoveryCodes: remainingCodes,
        shouldRegenerateRecoveryCodes: remainingCodes < 3,
      };
    }),

  // Regenerate recovery codes
  regenerateRecoveryCodes: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user.cipherSeed || !ctx.user.callSign) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Personal Cipher not enrolled' });
      }
      
      // Validate current cipher code first
      const isValid = cipher.validateCipherCode(ctx.user.callSign, ctx.user.cipherSeed, input.code);
      if (!isValid) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid cipher code' });
      }
      
      // Delete existing recovery codes
      await db.deleteRecoveryCodes(ctx.user.id);
      
      // Generate new recovery codes
      const recoveryCodes = cipher.generateRecoveryCodes();
      
      // Store hashed recovery codes
      for (const code of recoveryCodes) {
        await db.createRecoveryCode({
          userId: ctx.user.id,
          codeHash: cipher.hashRecoveryCode(code),
        });
      }
      
      await db.createCipherAuditLog({
        userId: ctx.user.id,
        action: 'recovery_codes_regenerated',
        success: true,
      });
      
      return { success: true, recoveryCodes };
    }),

  // ============================================================================
  // STATUS & INFO
  // ============================================================================
  
  // Get cipher status
  status: protectedProcedure.query(async ({ ctx }) => {
    const isEnrolled = !!ctx.user.cipherSeed;
    const isLocked = cipher.isAccountLocked(ctx.user.cipherLockedUntil);
    const remainingCodes = isEnrolled ? await db.countUnusedRecoveryCodes(ctx.user.id) : 0;
    
    return {
      isEnrolled,
      isLocked,
      lockedUntil: ctx.user.cipherLockedUntil,
      failedAttempts: ctx.user.failedCipherAttempts,
      remainingRecoveryCodes: remainingCodes,
      recoveryCodesRemaining: remainingCodes,
      deviceBound: !!ctx.user.deviceFingerprint,
      enrolledAt: ctx.user.cipherEnrolledAt,
      callSign: ctx.user.callSign,
      layer: ctx.user.markState,
    };
  }),

  // Get current cipher code (for display in app)
  getCurrentCode: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.cipherSeed || !ctx.user.callSign) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Personal Cipher not enrolled' });
    }
    
    const code = cipher.generateCipherCode(ctx.user.callSign, ctx.user.cipherSeed);
    const timeRemaining = 30 - (Math.floor(Date.now() / 1000) % 30);
    
    return { code, timeRemaining, period: 30 };
  }),

  // ============================================================================
  // ADMIN: INVITE CODE MANAGEMENT
  // ============================================================================
  
  // Create invite code
  createInvite: protectedProcedure
    .input(z.object({
      defaultLayer: z.enum(['outside', 'initiate', 'member', 'inner_circle', 'revoked']).optional(),
      expiresInDays: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Only admin can create invite codes
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
      }
      
      const code = cipher.generateInviteCode();
      const expiresAt = input.expiresInDays 
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null;
      
      const invite = await db.createInviteCode({
        code,
        defaultLayer: input.defaultLayer || 'initiate',
        expiresAt,
        createdById: ctx.user.id,
        notes: input.notes,
      });
      
      return { success: true, code, id: invite.id };
    }),

  // List invite codes
  listInvites: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
    }
    
    return db.getInviteCodes();
  }),

  // Revoke invite code
  revokeInvite: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
      }
      
      await db.revokeInviteCode(input.id);
      return { success: true };
    }),

  // ============================================================================
  // ADMIN: MEMBER MANAGEMENT
  // ============================================================================
  
  // Update member layer
  updateLayer: protectedProcedure
    .input(z.object({
      userId: z.number(),
      layer: z.enum(['outside', 'initiate', 'member', 'inner_circle', 'revoked']),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
      }
      
      await db.updateUserLayer(input.userId, input.layer);
      
      await db.createCipherAuditLog({
        userId: input.userId,
        action: 'layer_changed',
        details: JSON.stringify({ newLayer: input.layer, changedBy: ctx.user.id }),
        success: true,
      });
      
      return { success: true };
    }),

  // Unlock member account
  unlockAccount: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
      }
      
      await db.unlockCipherAccount(input.userId);
      await db.resetCipherFailedAttempts(input.userId);
      
      await db.createCipherAuditLog({
        userId: input.userId,
        action: 'account_unlocked',
        details: JSON.stringify({ unlockedBy: ctx.user.id }),
        success: true,
      });
      
      return { success: true };
    }),

  // Get cipher audit logs
  auditLogs: protectedProcedure
    .input(z.object({ 
      userId: z.number().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
      }
      
      return db.getCipherAuditLogs(input.userId, input.limit);
    }),
});
