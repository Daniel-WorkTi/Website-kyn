import type { Database } from "@/lib/supabase/database.types";

export type { Database };

export type SectionType = Database["public"]["Enums"]["section_type"];
export type MediaType = Database["public"]["Enums"]["media_type"];
export type MediaSlot = Database["public"]["Enums"]["media_slot"];
export type PartnerTier = Database["public"]["Enums"]["partner_tier"];

export type SectionRow = Database["public"]["Tables"]["sections"]["Row"];
export type MediaItemRow = Database["public"]["Tables"]["media_items"]["Row"];
export type TeamMemberRow = Database["public"]["Tables"]["team_members"]["Row"];
export type PartnerRow = Database["public"]["Tables"]["partners"]["Row"];
export type SiteConfigRow = Database["public"]["Tables"]["site_config"]["Row"];
export type AdminProfileRow = Database["public"]["Tables"]["admin_profiles"]["Row"];

export const MEDIA_BUCKET = "media";

/** Limites de upload (Storage Supabase — ajustáveis). */
export const MAX_IMAGE_UPLOAD_MB = 4;
/** Plano Free = 50 MB hard limit. Com Pro podes subir (e VIDEO_STORAGE_LIMIT_MB no código). */
export const MAX_VIDEO_UPLOAD_MB = 50;
export const MAX_IMAGE_UPLOAD_BYTES = MAX_IMAGE_UPLOAD_MB * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = MAX_VIDEO_UPLOAD_MB * 1024 * 1024;
/** Acima deste tamanho, upload de vídeo usa TUS resumable. */
export const RESUMABLE_UPLOAD_THRESHOLD_BYTES = 6 * 1024 * 1024;

/** MIME finais após optimização (o que sobe para o Storage). */
export const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/** MIME de entrada aceites no admin (convertidos para WebP no browser). */
export const INPUT_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

export const ALLOWED_VIDEO_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);
