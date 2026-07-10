import { publicIdFromUrl } from "@/lib/admin/media-utils";
import { cloudinaryGalleryImage, cloudinaryGalleryVideo } from "@/lib/cloudinary-urls";
import type { GalleryData, GalleryItem } from "@/lib/admin/sections";

export function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com");
}

/** Garante URL pública válida (MP4 para vídeo, imagem otimizada). */
export function normalizeGalleryItemSrc(item: Pick<GalleryItem, "type" | "src">): string {
  if (!isCloudinaryUrl(item.src)) return item.src;

  const publicId = publicIdFromUrl(item.src);
  if (!publicId) return item.src;

  if (item.type === "video") return cloudinaryGalleryVideo(publicId);
  return cloudinaryGalleryImage(publicId);
}

export type GalleryItemInput = Pick<GalleryItem, "type" | "src"> &
  Partial<Omit<GalleryItem, "type" | "src">>;

export function normalizeGalleryItem(item: GalleryItemInput, defaultAlt = "Studio Space"): GalleryItem {
  return {
    ...item,
    featured: item.featured ?? false,
    src: normalizeGalleryItemSrc(item),
    alt: item.alt || defaultAlt
  };
}

/** Vídeos primeiro (topo), fotos depois (grid) — igual ao site. */
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
    const defaultAlt = sectionId === "multicam" ? "Multicam" : data.title || "Gallery";
    return {
      ...data,
      items: (data.items || []).map((item) => normalizeGalleryItem(item, defaultAlt))
    };
  }
  if (data.layout === "multicam") {
    return {
      ...data,
      items: (data.items || []).map((item) => normalizeGalleryItem(item, "Multicam"))
    };
  }
  if (data.layout === "reels") {
    return {
      ...data,
      items: (data.items || []).map((item) => normalizeGalleryItem(item, "Aftermovie"))
    };
  }
  if (sectionId === "photography") {
    return {
      ...data,
      items: (data.items || []).map((item) => normalizeGalleryItem(item, "Photography"))
    };
  }
  return data;
}

export function createGalleryItemFromUpload(
  url: string,
  file: File,
  sectionId: string
): GalleryItem {
  const type = file.type.startsWith("video/") ? "video" : "image";
  const base: GalleryItem = {
    type,
    featured: false,
    src: url,
    alt: file.name.replace(/\.[^.]+$/, "") || "Studio Space"
  };

  if (sectionId === "studio-space") {
    return normalizeGalleryItem(base);
  }

  return base;
}

export function createGalleryItemFromLibrary(
  url: string,
  type: string,
  sectionId: string
): GalleryItem {
  const mediaType = type === "video" ? "video" : "image";
  const base: GalleryItem = {
    type: mediaType,
    featured: false,
    src: url,
    alt: url.split("/").pop()?.replace(/\.[^.]+$/, "") || "Studio Space"
  };

  if (sectionId === "studio-space") {
    return normalizeGalleryItem(base);
  }

  return base;
}
