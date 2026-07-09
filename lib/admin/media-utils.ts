import type { MediaFile } from "@/lib/admin/sections";

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
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^/]+$/);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}
