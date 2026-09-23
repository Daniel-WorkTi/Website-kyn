import type { GalleryData, GalleryItem } from "@/lib/admin/sections";

export function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com");
}

/**
 * Normaliza src de galeria.
 * URLs Supabase / externas passam intactas.
 * URLs Cloudinary legadas mantêm-se (sem transforms novos — conta pode estar inacessível).
 */
export function normalizeGalleryItemSrc(item: Pick<GalleryItem, "type" | "src">): string {
  return item.src;
}

const UUID_NAME_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Nome legível a partir de filename/URL — ignora UUIDs do Storage. */
export function friendlyMediaLabel(nameOrUrl: string): string {
  const raw = nameOrUrl.includes("/")
    ? nameOrUrl.split("/").pop()?.split("?")[0] || ""
    : nameOrUrl;
  const base = raw.replace(/\.[^.]+$/, "").replace(/-optim$/i, "");
  if (!base || UUID_NAME_RE.test(base)) return "";
  return base;
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

export type GalleryItemInput = Pick<GalleryItem, "type" | "src"> &
  Partial<Omit<GalleryItem, "type" | "src">>;

/**
 * Normaliza item de galeria.
 * Não força alt com defaults de secção — descrição vazia permanece vazia.
 * (O site usa item.alt || "" no render.)
 */
export function normalizeGalleryItem(item: GalleryItemInput, _defaultAlt?: string): GalleryItem {
  const rawAlt = item.alt ?? "";
  return {
    ...item,
    featured: item.featured ?? false,
    src: normalizeGalleryItemSrc(item),
    alt: looksLikeUuidLabel(rawAlt) ? "" : rawAlt
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
  if (data.layout === "studio") {
    return {
      ...data,
      items: (data.items || []).map((item) => normalizeGalleryItem(item))
    };
  }
  if (data.layout === "multicam") {
    return {
      ...data,
      items: (data.items || []).map((item) => normalizeGalleryItem(item))
    };
  }
  if (data.layout === "reels") {
    return {
      ...data,
      items: (data.items || []).map((item) => normalizeGalleryItem(item))
    };
  }
  if (sectionId === "photography") {
    return {
      ...data,
      items: (data.items || []).map((item) => normalizeGalleryItem(item))
    };
  }

  return {
    ...data,
    items: (data.items || []).map((item) => normalizeGalleryItem(item))
  };
}

export function createGalleryItemFromUpload(
  url: string,
  file: File,
  sectionId: string
): GalleryItem {
  const type = inferGalleryMediaType(file.name || url, file.type);
  const base: GalleryItem = {
    type,
    featured: false,
    src: url,
    alt: friendlyMediaLabel(file.name) || ""
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
  displayName?: string
): GalleryItem {
  const mediaType = inferGalleryMediaType(url, type);
  const base: GalleryItem = {
    type: mediaType,
    featured: false,
    src: url,
    alt: friendlyMediaLabel(displayName || "") || friendlyMediaLabel(url) || ""
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
