import { MEDIA_BUCKET } from "@/lib/supabase/constants";
import { getSupabaseUrl } from "@/lib/supabase/env";

/** URL pública do Storage a partir do path. */
export function publicUrlForPath(storagePath: string): string {
  const base = getSupabaseUrl().replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${storagePath.replace(/^\/+/, "")}`;
}

/** Resolve URL de mídia: Storage primeiro, senão legacy (Cloudinary). */
export function resolveMediaUrl(opts: {
  storagePath?: string | null;
  legacyUrl?: string | null;
}): string {
  if (opts.storagePath) return publicUrlForPath(opts.storagePath);
  return opts.legacyUrl || "";
}

export function resolveThumbnailUrl(opts: {
  thumbnailPath?: string | null;
  thumbnailLegacyUrl?: string | null;
  storagePath?: string | null;
  legacyUrl?: string | null;
  type: "image" | "video";
}): string {
  if (opts.thumbnailPath) return publicUrlForPath(opts.thumbnailPath);
  if (opts.thumbnailLegacyUrl) return opts.thumbnailLegacyUrl;
  if (opts.type === "image") {
    return resolveMediaUrl({ storagePath: opts.storagePath, legacyUrl: opts.legacyUrl });
  }
  return "";
}

export function extensionForMime(mime: string, fallback: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return map[mime] || fallback;
}

export function buildStoragePath(opts: {
  sectionId: string;
  kind: "images" | "videos" | "thumbnails";
  uuid: string;
  ext: string;
}): string {
  return `${opts.sectionId}/${opts.kind}/${opts.uuid}.${opts.ext.replace(/^\./, "")}`;
}
