import type { MediaFile } from "@/lib/admin/sections";
import { guessMediaType } from "@/lib/admin/sections";

export type MediaFilter = "all" | "image" | "video" | "cover";

export function formatFileSize(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatMediaDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function formatDuration(seconds?: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatDimensions(file: MediaFile): string {
  if (file.width && file.height) return `${file.width} × ${file.height}`;
  return "—";
}

export function isCoverCandidate(file: MediaFile): boolean {
  if (file.isCover) return true;
  const name = file.name.toLowerCase();
  return /poster|cover|capa|thumb/.test(name);
}

export function filterMediaFiles(
  files: MediaFile[],
  filter: MediaFilter,
  query: string
): MediaFile[] {
  const q = query.trim().toLowerCase();
  return files.filter((file) => {
    if (filter === "image" && file.type !== "image") return false;
    if (filter === "video" && file.type !== "video") return false;
    if (filter === "cover" && !isCoverCandidate(file)) return false;
    if (q && !file.name.toLowerCase().includes(q) && !file.url.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });
}

export function publicIdFromUrl(url: string): string | null {
  const match = url.match(/\/upload\/(?:[^/]+\/)*(?:v\d+\/)?(.+?)(?:\.[^/.]+)?$/);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

function cloudNameFromUrl(url: string): string | null {
  return url.match(/res\.cloudinary\.com\/([^/]+)/)?.[1] ?? null;
}

/** URL que o browser consegue mostrar (HEIC → JPG/WEBP, vídeo → frame). */
export function mediaThumbnailUrl(file: MediaFile): string {
  const cloud = cloudNameFromUrl(file.url);
  const publicId = file.publicId ?? publicIdFromUrl(file.url);
  if (!cloud || !publicId) return file.url;

  if (file.type === "video") {
    return `https://res.cloudinary.com/${cloud}/video/upload/so_0,w_1200,h_750,c_fill,f_jpg,q_auto/${publicId}.jpg`;
  }

  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_1200,c_limit/${publicId}`;
}

/** URL de reprodução para vídeos (MP4 compatível com Chrome). */
export function mediaPlaybackUrl(file: MediaFile): string {
  if (file.type !== "video") return file.url;

  const cloud = cloudNameFromUrl(file.url);
  const publicId = file.publicId ?? publicIdFromUrl(file.url);
  if (!cloud || !publicId) return file.url;

  return `https://res.cloudinary.com/${cloud}/video/upload/f_mp4,vc_h264,q_auto/${publicId}.mp4`;
}

export function mediaFileFromUpload(url: string, file: File): MediaFile {
  const name = file.name || url.split("/").pop() || url;
  const type = file.type.startsWith("video/") ? "video" : guessMediaType(url);

  return {
    url,
    name,
    type: type === "video" ? "video" : "image",
    size: file.size,
    createdAt: new Date().toISOString(),
    publicId: publicIdFromUrl(url) ?? undefined
  };
}
