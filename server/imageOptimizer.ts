import sharp from "sharp";

interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "jpeg" | "webp" | "png";
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

interface OptimizedResult {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
  thumbnail?: {
    buffer: Buffer;
    width: number;
    height: number;
    size: number;
  };
}

const DEFAULT_OPTIONS: Required<OptimizeOptions> = {
  maxWidth: 1200,
  maxHeight: 1600,
  quality: 80,
  format: "jpeg",
  generateThumbnail: true,
  thumbnailSize: 200,
};

/**
 * Optimize an image buffer for web delivery
 * - Resizes to max dimensions while maintaining aspect ratio
 * - Compresses with specified quality
 * - Optionally generates a thumbnail
 */
export async function optimizeImage(
  input: Buffer | Uint8Array,
  options: OptimizeOptions = {}
): Promise<OptimizedResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Get original image metadata
  const image = sharp(input);
  const metadata = await image.metadata();
  
  // Calculate resize dimensions
  let width = metadata.width || opts.maxWidth;
  let height = metadata.height || opts.maxHeight;
  
  // Only resize if larger than max dimensions
  const needsResize = width > opts.maxWidth || height > opts.maxHeight;
  
  // Process main image
  let pipeline = sharp(input);
  
  if (needsResize) {
    pipeline = pipeline.resize(opts.maxWidth, opts.maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  
  // Apply format and compression
  switch (opts.format) {
    case "webp":
      pipeline = pipeline.webp({ quality: opts.quality });
      break;
    case "png":
      pipeline = pipeline.png({ quality: opts.quality, compressionLevel: 9 });
      break;
    case "jpeg":
    default:
      pipeline = pipeline.jpeg({ quality: opts.quality, mozjpeg: true });
      break;
  }
  
  const optimizedBuffer = await pipeline.toBuffer();
  const optimizedMetadata = await sharp(optimizedBuffer).metadata();
  
  const result: OptimizedResult = {
    buffer: optimizedBuffer,
    width: optimizedMetadata.width || width,
    height: optimizedMetadata.height || height,
    format: opts.format,
    size: optimizedBuffer.length,
  };
  
  // Generate thumbnail if requested
  if (opts.generateThumbnail) {
    const thumbnailBuffer = await sharp(input)
      .resize(opts.thumbnailSize, opts.thumbnailSize, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 70, mozjpeg: true })
      .toBuffer();
    
    result.thumbnail = {
      buffer: thumbnailBuffer,
      width: opts.thumbnailSize,
      height: opts.thumbnailSize,
      size: thumbnailBuffer.length,
    };
  }
  
  return result;
}

/**
 * Quick check if a buffer is a valid image
 */
export async function isValidImage(input: Buffer | Uint8Array): Promise<boolean> {
  try {
    const metadata = await sharp(input).metadata();
    return !!(metadata.width && metadata.height);
  } catch {
    return false;
  }
}

/**
 * Get image dimensions without full processing
 */
export async function getImageDimensions(
  input: Buffer | Uint8Array
): Promise<{ width: number; height: number } | null> {
  try {
    const metadata = await sharp(input).metadata();
    if (metadata.width && metadata.height) {
      return { width: metadata.width, height: metadata.height };
    }
    return null;
  } catch {
    return null;
  }
}
