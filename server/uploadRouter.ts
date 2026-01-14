/**
 * Image Upload Router
 * Handles all image uploads with automatic optimization
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { storagePutImage } from "./storage";
import { isValidImage } from "./imageOptimizer";
import * as db from "./db";
import type { User } from "../drizzle/schema";

// Role checks
const staffRoles = ["staff", "admin"] as const;
function isStaff(user: User): boolean {
  return staffRoles.includes(user.role as typeof staffRoles[number]);
}
function isAdmin(user: User): boolean {
  return user.role === "admin";
}

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isAdmin(ctx.user)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  }
  return next({ ctx });
});

const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isStaff(ctx.user)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Staff only" });
  }
  return next({ ctx });
});

// Generate a random suffix for unique file keys
function randomSuffix(): string {
  return Math.random().toString(36).substring(2, 10);
}

export const uploadRouter = router({
  /**
   * Upload and optimize an image for drops/products
   * Returns optimized image URL and thumbnail URL
   */
  dropImage: adminProcedure
    .input(z.object({
      dropId: z.number(),
      imageData: z.string(), // Base64 encoded image
      imageType: z.enum(["primary", "gallery"]).default("gallery"),
    }))
    .mutation(async ({ input, ctx }) => {
      // Decode base64 to buffer
      const buffer = Buffer.from(input.imageData, "base64");
      
      // Validate it's actually an image
      const valid = await isValidImage(buffer);
      if (!valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid image file",
        });
      }
      
      // Generate unique key
      const key = `drops/${input.dropId}/${input.imageType}-${randomSuffix()}`;
      
      // Upload with optimization
      const result = await storagePutImage(key, buffer, {
        maxWidth: input.imageType === "primary" ? 1200 : 1000,
        maxHeight: input.imageType === "primary" ? 1600 : 1400,
        quality: 80,
        generateThumbnail: true,
      });
      
      // Log the upload
      await db.createAuditLog({
        action: "image_uploaded",
        userId: ctx.user.id,
        userName: ctx.user.callSign || ctx.user.name || "Admin",
        targetType: "drop",
        targetId: input.dropId,
        description: `Uploaded ${input.imageType} image (${Math.round(result.size / 1024)}KB)`,
      });
      
      return {
        success: true,
        url: result.url,
        thumbnailUrl: result.thumbnail?.url,
        width: result.width,
        height: result.height,
        size: result.size,
      };
    }),

  /**
   * Upload and optimize UGC (user-generated content) images
   */
  ugcImage: staffProcedure
    .input(z.object({
      dropId: z.number().optional(),
      holderCallsign: z.string().optional(),
      imageData: z.string(), // Base64 encoded image
      caption: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Decode base64 to buffer
      const buffer = Buffer.from(input.imageData, "base64");
      
      // Validate it's actually an image
      const valid = await isValidImage(buffer);
      if (!valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid image file",
        });
      }
      
      // Generate unique key
      const folder = input.dropId ? `ugc/drops/${input.dropId}` : "ugc/general";
      const key = `${folder}/${randomSuffix()}`;
      
      // Upload with optimization
      const result = await storagePutImage(key, buffer, {
        maxWidth: 1200,
        maxHeight: 1600,
        quality: 80,
        generateThumbnail: true,
      });
      
      // Create UGC record in database
      const ugcId = await db.createUgcMedia({
        type: "image",
        storageUrl: result.url,
        thumbnailUrl: result.thumbnail?.url || result.url,
        dropId: input.dropId,
        caption: input.caption,
        holderCallsign: input.holderCallsign,
        moderationStatus: "approved", // Staff uploads are auto-approved
      });
      
      // Log the upload
      await db.createAuditLog({
        action: "ugc_uploaded",
        userId: ctx.user.id,
        userName: ctx.user.callSign || ctx.user.name || "Staff",
        targetType: "ugc",
        targetId: ugcId,
        description: `Uploaded UGC image (${Math.round(result.size / 1024)}KB)`,
      });
      
      return {
        success: true,
        id: ugcId,
        url: result.url,
        thumbnailUrl: result.thumbnail?.url,
        width: result.width,
        height: result.height,
        size: result.size,
      };
    }),

  /**
   * Upload and optimize event images
   */
  eventImage: adminProcedure
    .input(z.object({
      eventId: z.number(),
      imageData: z.string(), // Base64 encoded image
    }))
    .mutation(async ({ input, ctx }) => {
      // Decode base64 to buffer
      const buffer = Buffer.from(input.imageData, "base64");
      
      // Validate it's actually an image
      const valid = await isValidImage(buffer);
      if (!valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid image file",
        });
      }
      
      // Generate unique key
      const key = `events/${input.eventId}/cover-${randomSuffix()}`;
      
      // Upload with optimization
      const result = await storagePutImage(key, buffer, {
        maxWidth: 1600,
        maxHeight: 900,
        quality: 85,
        generateThumbnail: true,
      });
      
      // Log the upload
      await db.createAuditLog({
        action: "image_uploaded",
        userId: ctx.user.id,
        userName: ctx.user.callSign || ctx.user.name || "Admin",
        targetType: "event",
        targetId: input.eventId,
        description: `Uploaded event cover image (${Math.round(result.size / 1024)}KB)`,
      });
      
      return {
        success: true,
        url: result.url,
        thumbnailUrl: result.thumbnail?.url,
        width: result.width,
        height: result.height,
        size: result.size,
      };
    }),
});
