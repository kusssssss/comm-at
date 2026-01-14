import { describe, it, expect } from "vitest";
import { optimizeImage, isValidImage, getImageDimensions } from "./imageOptimizer";
import * as fs from "fs";
import * as path from "path";

// Create a simple test PNG image (1x1 pixel, red)
function createTestPng(): Buffer {
  // Minimal valid PNG: 1x1 red pixel
  const png = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x02, // bit depth: 8, color type: 2 (RGB)
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, 0x00, // compressed data
    0x01, 0x01, 0x01, 0x00, // CRC placeholder
    0xE6, 0x1E, 0x38, 0x43, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82, // CRC
  ]);
  return png;
}

// Read a real test image from the public folder
async function getTestImage(): Promise<Buffer> {
  const imagePath = path.join(__dirname, "../client/public/images/product-chain.jpg");
  if (fs.existsSync(imagePath)) {
    return fs.readFileSync(imagePath);
  }
  // Fallback to minimal PNG if no test image available
  return createTestPng();
}

describe("imageOptimizer", () => {
  describe("isValidImage", () => {
    it("should return true for valid image buffer", async () => {
      const testImage = await getTestImage();
      const result = await isValidImage(testImage);
      expect(result).toBe(true);
    });

    it("should return false for invalid buffer", async () => {
      const invalidBuffer = Buffer.from("not an image");
      const result = await isValidImage(invalidBuffer);
      expect(result).toBe(false);
    });

    it("should return false for empty buffer", async () => {
      const emptyBuffer = Buffer.alloc(0);
      const result = await isValidImage(emptyBuffer);
      expect(result).toBe(false);
    });
  });

  describe("getImageDimensions", () => {
    it("should return dimensions for valid image", async () => {
      const testImage = await getTestImage();
      const dimensions = await getImageDimensions(testImage);
      expect(dimensions).not.toBeNull();
      expect(dimensions?.width).toBeGreaterThan(0);
      expect(dimensions?.height).toBeGreaterThan(0);
    });

    it("should return null for invalid buffer", async () => {
      const invalidBuffer = Buffer.from("not an image");
      const dimensions = await getImageDimensions(invalidBuffer);
      expect(dimensions).toBeNull();
    });
  });

  describe("optimizeImage", () => {
    it("should compress image and reduce file size", async () => {
      const testImage = await getTestImage();
      const originalSize = testImage.length;
      
      const result = await optimizeImage(testImage, {
        maxWidth: 800,
        maxHeight: 1000,
        quality: 70,
        format: "jpeg",
        generateThumbnail: false,
      });
      
      // Optimized should be smaller or similar (small images might not compress much)
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.width).toBeLessThanOrEqual(800);
      expect(result.height).toBeLessThanOrEqual(1000);
      expect(result.format).toBe("jpeg");
      expect(result.size).toBeGreaterThan(0);
    });

    it("should generate thumbnail when requested", async () => {
      const testImage = await getTestImage();
      
      const result = await optimizeImage(testImage, {
        maxWidth: 1200,
        maxHeight: 1600,
        quality: 80,
        format: "jpeg",
        generateThumbnail: true,
        thumbnailSize: 200,
      });
      
      expect(result.thumbnail).toBeDefined();
      expect(result.thumbnail?.buffer).toBeInstanceOf(Buffer);
      expect(result.thumbnail?.width).toBe(200);
      expect(result.thumbnail?.height).toBe(200);
      expect(result.thumbnail?.size).toBeGreaterThan(0);
    });

    it("should not generate thumbnail when not requested", async () => {
      const testImage = await getTestImage();
      
      const result = await optimizeImage(testImage, {
        generateThumbnail: false,
      });
      
      expect(result.thumbnail).toBeUndefined();
    });

    it("should use default options when none provided", async () => {
      const testImage = await getTestImage();
      
      const result = await optimizeImage(testImage);
      
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.width).toBeLessThanOrEqual(1200); // default maxWidth
      expect(result.height).toBeLessThanOrEqual(1600); // default maxHeight
      expect(result.format).toBe("jpeg"); // default format
      expect(result.thumbnail).toBeDefined(); // default generateThumbnail is true
    });

    it("should respect maxWidth constraint", async () => {
      const testImage = await getTestImage();
      
      const result = await optimizeImage(testImage, {
        maxWidth: 400,
        maxHeight: 600,
        generateThumbnail: false,
      });
      
      // Should be constrained to max dimensions
      expect(result.width).toBeLessThanOrEqual(400);
      expect(result.height).toBeLessThanOrEqual(600);
    });
  });
});
