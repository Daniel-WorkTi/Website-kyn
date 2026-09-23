import type { GalleryData, GalleryItem, MediaFile } from "@/lib/admin/sections";

export function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com");
}

export function normalizeGalleryItemSrc(item: Pick<GalleryItem, "type" | "src">): string {
  return item.src;
}

const UUID_NAME_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Basename sem extensão; ignora UUIDs do Storage. */
export function friendlyMediaLabel(nameOrUrl: string): string {
  const raw = nameOrUrl.includes("/")
    ? nameOrUrl.split("/").pop()?.split("?")[0] || ""
    : nameOrUrl;
  const base = raw.replace(/\.[^.]+$/, "").replace(/-optim$/i, "");
  if (!base || UUID_NAME_RE.test(base)) return "";
  return base;
}

/** "proimagem-after-movie-lisboa" → "Proimagem After Movie Lisboa" */
export function formatHumanTitle(nameOrUrl: string): string {
  const base = friendlyMediaLabel(nameOrUrl);
  if (!base) return "";
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
}

export function looksLikeUuidLabel(value: string | undefined): boolean {
  if (!value) return false;
  return UUID_NAME_RE.test(value.trim());
}

export function inferGalleryMediaType(
  urlOrName: string,
  mimeOrType?: string
): "image" | "video" {
  if (mimeOrType === "video" || mimeOrType?.startsWith("video/")) return "video";
  if (mimeOrType === "image" || mimeOrType?.startsWith("image/")) return "image";
  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(urlOrName)) return "video";
  return "image";
}

/** Título mostrado no CMS — nunca UUID. */
export function galleryDisplayTitle(
  item: GalleryItem,
  libraryFile?: MediaFile | null
): string {
  if (item.title?.trim() && !looksLikeUuidLabel(item.title)) {
    return formatHumanTitle(item.title) || item.title.trim();
  }
  if (libraryFile?.name) {
    const fromLib = formatHumanTitle(libraryFile.name);
    if (fromLib) return fromLib;
  }
  return item.type === "video" ? "Vídeo sem título" : "Imagem sem título";
}

export function formatGalleryMetaLine(item: GalleryItem): string {
  const parts: string[] = [item.type === "video" ? "Vídeo" : "Foto"];
  if (item.width && item.height && item.width > 0 && item.height > 0) {
    parts.push(`${item.width}×${item.height}`);
  }
  if (item.type === "video" && item.duration && item.duration > 0) {
    const m = Math.floor(item.duration / 60);
    const s = Math.floor(item.duration % 60);
    parts.push(m > 0 ? `${m}m ${s}s` : `${s}s`);
  }
  if (item.size && item.size > 0) {
    const mb = item.size / (1024 * 1024);
    parts.push(mb >= 0.1 ? `${mb.toFixed(1)} MB` : `${Math.round(item.size / 1024)} KB`);
  }
  return parts.join(" · ");
}

export type GalleryItemInput = Pick<GalleryItem, "type" | "src"> &
  Partial<Omit<GalleryItem, "type" | "src">>;

/** Mantém assinatura compatível; defaultAlt já não é aplicado (alt vazio permanece). */
export function normalizeGalleryItem(
  item: GalleryItemInput,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _defaultAlt?: string
): GalleryItem {
  const rawAlt = item.alt ?? "";
  const rawTitle = item.title ?? "";
  return {
    ...item,
    featured: item.featured ?? false,
    src: normalizeGalleryItemSrc(item),
    alt: looksLikeUuidLabel(rawAlt) ? "" : rawAlt,
    title: looksLikeUuidLabel(rawTitle) ? undefined : rawTitle || undefined,
    poster: item.poster || undefined
  };
}

export function sortStudioGalleryItems(items: GalleryItem[]): GalleryItem[] {
  const videos = items.filter((i) => i.type === "video");
  const images = items.filter((i) => i.type === "image");
  return [...videos, ...images];
}

export function prepareStudioGallery(data: GalleryData): GalleryData {
  const items = sortStudioGalleryItems((data.items || []).map((item) => normalizeGalleryItem(item)));
  return {
    ...data,
    layout: "studio",
    title: data.title || "Studio Space",
    items
  };
}

export function prepareGalleryForSection(sectionId: string, data: GalleryData): GalleryData {
  if (sectionId === "studio-space") {
    return prepareStudioGallery(data);
  }
  return {
    ...data,
    items: (data.items || []).map((item) => normalizeGalleryItem(item))
  };
}

export function createGalleryItemFromUpload(
  url: string,
  file: File,
  sectionId: string,
  meta?: Partial<Pick<GalleryItem, "width" | "height" | "duration" | "size" | "poster">>
): GalleryItem {
  const type = inferGalleryMediaType(file.name || url, file.type);
  const base: GalleryItem = {
    type,
    featured: false,
    src: url,
    alt: "",
    title: formatHumanTitle(file.name) || undefined,
    size: file.size || undefined,
    ...meta
  };

  if (sectionId === "studio-space") {
    return normalizeGalleryItem(base);
  }
  return base;
}

export function createGalleryItemFromLibrary(
  url: string,
  type: string,
  sectionId: string,
  displayName?: string,
  meta?: Partial<Pick<GalleryItem, "width" | "height" | "duration" | "size" | "poster">>
): GalleryItem {
  const mediaType = inferGalleryMediaType(url, type);
  const base: GalleryItem = {
    type: mediaType,
    featured: false,
    src: url,
    alt: "",
    title: formatHumanTitle(displayName || "") || undefined,
    ...meta
  };

  if (sectionId === "studio-space") {
    return normalizeGalleryItem(base);
  }
  return base;
}

export function galleryItemKey(item: GalleryItem, index: number): string {
  if (item.src) return `${item.src}::${index}`;
  return `empty-${index}-${item.type}`;
}

export function findLibraryFile(
  files: MediaFile[],
  src: string
): MediaFile | undefined {
  return files.find((f) => f.url === src);
}
