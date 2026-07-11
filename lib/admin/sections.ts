import type { SidebarSectionId } from "@/components/admin/AdminSidebar";
import { buildSitePreviewUrl } from "@/lib/admin/preview";

/** Limite do envio directo ao Cloudinary (signed upload). */
export const CLOUDINARY_MAX_UPLOAD_MB = 10;
export const CLOUDINARY_MAX_UPLOAD_BYTES = CLOUDINARY_MAX_UPLOAD_MB * 1024 * 1024;
/** Alvo da compressão (margem abaixo do limite exacto do Cloudinary). */
export const CLOUDINARY_UPLOAD_TARGET_BYTES = Math.floor(9.5 * 1024 * 1024);

/** Ficheiros acima disto são rejeitados antes de tentar optimizar. */
export const MAX_UPLOAD_MB = 100;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export type SectionType = "home" | "gallery" | "team" | "partners" | "media";

export type AdminSection = {
  id: SidebarSectionId;
  label: string;
  file: string;
  type: SectionType;
  page: string;
  hint: string;
};

export const SECTIONS: AdminSection[] = [
  {
    id: "home",
    label: "Página Inicial",
    file: "content/site.json",
    type: "home",
    page: "/",
    hint: "Textos, vídeos de fundo e imagens da página principal."
  },
  {
    id: "media",
    label: "Mídias",
    file: "",
    type: "media",
    page: "",
    hint: "Envia, organiza e gere fotos e vídeos do site."
  },
  {
    id: "studio-space",
    label: "Studio Space",
    file: "content/galleries/studio-space.json",
    type: "gallery",
    page: "/studio-space",
    hint: "Fotos e vídeos da galeria Studio Space."
  },
  {
    id: "multicam",
    label: "Multicam",
    file: "content/galleries/multicam.json",
    type: "gallery",
    page: "/multicam",
    hint: "Conteúdo da galeria Multicam."
  },
  {
    id: "aftermovie",
    label: "Aftermovie",
    file: "content/galleries/aftermovie.json",
    type: "gallery",
    page: "/aftermovie",
    hint: "Vídeos e fotos de aftermovies."
  },
  {
    id: "photography",
    label: "Photography",
    file: "content/galleries/photography.json",
    type: "gallery",
    page: "/photography",
    hint: "Fotografias da secção Photography."
  },
  {
    id: "fpv-drone",
    label: "FPV / Drone",
    file: "content/galleries/fpv-drone.json",
    type: "gallery",
    page: "/fpv-drone",
    hint: "Conteúdo FPV e drone."
  },
  {
    id: "social-media",
    label: "Social Media",
    file: "content/galleries/social-media.json",
    type: "gallery",
    page: "/social-media",
    hint: "Conteúdo para redes sociais."
  },
  {
    id: "team",
    label: "Equipa",
    file: "content/team.json",
    type: "team",
    page: "/team",
    hint: "Membros da equipa, funções e fotos de perfil."
  },
  {
    id: "partners",
    label: "Parceiros",
    file: "content/partners.json",
    type: "partners",
    page: "/team#parceiros",
    hint: "Clientes e parceiros — aparecem na página Meet the Team."
  }
];

export const SKILL_LABELS: Record<string, string> = {
  photography: "Photography",
  videographer: "Videographer",
  drone: "Drone",
  fpv: "FPV",
  editor: "Editor",
  "social-media": "Social Media"
};

export const ALL_SKILLS = Object.keys(SKILL_LABELS);

/* ── Content types ── */

export type GalleryItem = {
  type: "image" | "video";
  featured: boolean;
  src: string;
  poster?: string;
  alt?: string;
};

export type GalleryData = {
  title?: string;
  layout?: "default" | "studio" | "multicam" | "reels";
  items: GalleryItem[];
  note?: string;
};

export type HeroVideo = {
  src: string;
  poster: string;
};

export type HomeStackItem = {
  type: "image" | "video";
  src: string;
  alt: string;
};

export type HomeData = {
  brand?: string;
  nav?: { label: string; href: string }[];
  hero: {
    title: string;
    subtitleLines: string[];
    videos: HeroVideo[];
    buttonText?: string;
    buttonLink?: string;
    buttonStyle?: "primary" | "secondary";
    buttonVisible?: boolean;
    mediaType?: "video" | "image";
    imageSrc?: string;
    heroType?: "video" | "image";
    backgroundImage?: string;
    visible?: boolean;
    titleSize?: "small" | "medium" | "large";
    titleAlign?: "left" | "center" | "right";
    titleColor?: string;
    subtitleAlign?: "left" | "center" | "right";
  };
  homeStack: HomeStackItem[];
  [key: string]: unknown;
};

export type TeamMember = {
  name: string;
  roles: string;
  photo: string;
  photoPosition?: string;
  skills?: string[];
};

export type TeamData = {
  title?: string;
  featured: TeamMember[];
  members: TeamMember[];
};

export type Partner = {
  name: string;
  logo: string;
};

export type PartnersData = {
  title?: string;
  main: Partner[];
  secondary: Partner[];
};

export type SectionData = GalleryData | HomeData | TeamData | PartnersData;

export type MediaFile = {
  url: string;
  name: string;
  type: "image" | "video" | "file";
  size?: number;
  createdAt?: string;
  width?: number;
  height?: number;
  duration?: number;
  publicId?: string;
  isCover?: boolean;
};

/* ── Helpers ── */

export function getSectionById(id: SidebarSectionId): AdminSection {
  return SECTIONS.find((s) => s.id === id) ?? SECTIONS[0];
}

export function previewUrlForSection(section: AdminSection, cacheBust?: number | string): string {
  return buildSitePreviewUrl(section.page || "/", cacheBust);
}

export function initials(name: string): string {
  return (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function guessMediaType(url: string): "image" | "video" {
  if (url.includes("/video/upload/")) return "video";
  const ext = url.slice(url.lastIndexOf(".")).toLowerCase();
  if ([".mp4", ".webm", ".mov", ".m4v"].includes(ext)) return "video";
  return "image";
}

export function previewUrl(item: {
  type?: string;
  src?: string;
  poster?: string;
  photo?: string;
  logo?: string;
}): string {
  if (item.type === "video") return item.poster || item.src || "";
  return item.src || item.photo || item.logo || "";
}
