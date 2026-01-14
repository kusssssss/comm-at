// Preconfigured storage helpers
// Uses the storage proxy (Authorization: Bearer <token>)

import { ENV } from './_core/env';

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return (await response.json()).url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

/**
 * Upload an image with automatic optimization
 * - Resizes large images to max 1200px width
 * - Compresses to ~80% quality JPEG
 * - Optionally generates and uploads a thumbnail
 */
export async function storagePutImage(
  relKey: string,
  data: Buffer | Uint8Array,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    generateThumbnail?: boolean;
  } = {}
): Promise<{
  key: string;
  url: string;
  width: number;
  height: number;
  size: number;
  thumbnail?: { key: string; url: string };
}> {
  // Dynamic import to avoid loading sharp unless needed
  const { optimizeImage } = await import("./imageOptimizer");
  
  const optimized = await optimizeImage(data, {
    maxWidth: options.maxWidth || 1200,
    maxHeight: options.maxHeight || 1600,
    quality: options.quality || 80,
    format: "jpeg",
    generateThumbnail: options.generateThumbnail ?? true,
    thumbnailSize: 200,
  });
  
  // Ensure key ends with .jpg
  const imageKey = relKey.replace(/\.[^.]+$/, "") + ".jpg";
  
  // Upload optimized image
  const { key, url } = await storagePut(imageKey, optimized.buffer, "image/jpeg");
  
  const result: {
    key: string;
    url: string;
    width: number;
    height: number;
    size: number;
    thumbnail?: { key: string; url: string };
  } = {
    key,
    url,
    width: optimized.width,
    height: optimized.height,
    size: optimized.size,
  };
  
  // Upload thumbnail if generated
  if (optimized.thumbnail) {
    const thumbKey = imageKey.replace(/\.jpg$/, "_thumb.jpg");
    const thumbResult = await storagePut(thumbKey, optimized.thumbnail.buffer, "image/jpeg");
    result.thumbnail = { key: thumbResult.key, url: thumbResult.url };
  }
  
  return result;
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey),
  };
}
