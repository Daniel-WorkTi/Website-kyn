import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { MediaItemRow, PartnerRow, TeamMemberRow } from "@/lib/supabase/constants";
import { DEFAULT_SITE_NAV, HIDDEN_PUBLIC_NAV_HREFS } from "@/lib/supabase/constants";
import { resolveMediaUrl, resolveThumbnailUrl } from "@/lib/supabase/media-url";
import type {
  GalleryJson,
  Hero,
  MediaItem,
  PartnersJson,
  Partner,
  SiteJson,
  TeamJson,
  TeamMember,
} from "@/lib/types";

type Client = SupabaseClient<Database>;

function mediaRowToItem(row: MediaItemRow): MediaItem {
  const src = resolveMediaUrl({
    storagePath: row.storage_path,
    legacyUrl: row.legacy_url,
  });
  const poster =
    row.type === "video"
      ? resolveThumbnailUrl({
          thumbnailPath: row.thumbnail_path,
          thumbnailLegacyUrl: row.thumbnail_legacy_url,
          storagePath: row.storage_path,
          legacyUrl: row.legacy_url,
          type: "video",
        }) || undefined
      : undefined;

  return {
    type: row.type,
    src,
    // alt_text apenas — nunca promover title a descrição
    alt: row.alt_text ?? undefined,
    title: row.title || undefined,
    poster: poster || undefined,
    featured: row.featured,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    duration: row.duration_seconds ?? undefined,
    size: row.file_size ?? undefined,
  };
}

function teamRowToMember(row: TeamMemberRow): TeamMember {
  return {
    name: row.name,
    roles: row.roles,
    photo:
      resolveMediaUrl({
        storagePath: row.photo_path,
        legacyUrl: row.photo_legacy_url,
      }) || undefined,
    photoPosition: row.photo_position || undefined,
    skills: row.skills || [],
  };
}

function partnerRowToPartner(row: PartnerRow): Partner {
  return {
    name: row.name,
    logo:
      resolveMediaUrl({
        storagePath: row.logo_path,
        legacyUrl: row.logo_legacy_url,
      }) || undefined,
  };
}

export async function composeSite(client: Client): Promise<SiteJson> {
  const { data: config, error: configError } = await client
    .from("site_config")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (configError) throw new Error(configError.message);

  const { data: media, error: mediaError } = await client
    .from("media_items")
    .select("*")
    .eq("section_id", "home")
    .in("slot", ["hero", "home_stack"])
    .order("sort_order", { ascending: true });

  if (mediaError) throw new Error(mediaError.message);

  const heroMedia = (media || []).filter((m) => m.slot === "hero");
  const stackMedia = (media || []).filter((m) => m.slot === "home_stack");

  const heroConfig = (config?.hero || {}) as Record<string, unknown>;
  const rawSubtitle = Array.isArray(heroConfig.subtitleLines)
    ? (heroConfig.subtitleLines as string[])
    : [];
  const subtitleLines = rawSubtitle
    .map((line) =>
      String(line)
        .replace(/\s*\|\s*SOCIAL MEDIA\s*/gi, " | ")
        .replace(/\s*SOCIAL MEDIA\s*\|\s*/gi, "")
        .replace(/\s*\|\s*$/g, "")
        .replace(/^\s*\|\s*/g, "")
        .replace(/\s*\|\s*\|/g, " | ")
        .trim()
    )
    .filter(Boolean);

  const hero: Hero = {
    title: typeof heroConfig.title === "string" ? heroConfig.title : config?.brand,
    subtitleLines,
    videos: heroMedia.map((row) => ({
      src: resolveMediaUrl({ storagePath: row.storage_path, legacyUrl: row.legacy_url }),
      poster:
        resolveThumbnailUrl({
          thumbnailPath: row.thumbnail_path,
          thumbnailLegacyUrl: row.thumbnail_legacy_url,
          type: "video",
        }) || "",
    })),
  };

  // Preserve optional hero fields used by admin
  const extendedHero = {
    ...hero,
    buttonText: heroConfig.buttonText as string | undefined,
    buttonLink: heroConfig.buttonLink as string | undefined,
    buttonStyle: heroConfig.buttonStyle as "primary" | "secondary" | undefined,
    buttonVisible: heroConfig.buttonVisible as boolean | undefined,
    mediaType: heroConfig.mediaType as "video" | "image" | undefined,
    imageSrc: heroConfig.imageSrc as string | undefined,
    visible: heroConfig.visible as boolean | undefined,
    titleSize: heroConfig.titleSize as "small" | "medium" | "large" | undefined,
    titleAlign: heroConfig.titleAlign as "left" | "center" | "right" | undefined,
    titleColor: heroConfig.titleColor as string | undefined,
  };

  const rawNav = Array.isArray(config?.nav) ? config.nav : [];
  const baseNav =
    rawNav.length > 0
      ? (rawNav as unknown as SiteJson["nav"])
      : ([...DEFAULT_SITE_NAV] as unknown as SiteJson["nav"]);
  const nav = baseNav.filter(
    (item) => !HIDDEN_PUBLIC_NAV_HREFS.has(item.href)
  );

  return {
    brand: config?.brand || "Proimagem.pt",
    email: config?.email || undefined,
    socials: (config?.socials as SiteJson["socials"]) || {},
    nav,
    hero: extendedHero as Hero,
    homeStack: stackMedia.map(mediaRowToItem),
  };
}

export async function composeGallery(
  client: Client,
  sectionId: string
): Promise<GalleryJson> {
  const { data: section, error: sectionError } = await client
    .from("sections")
    .select("*")
    .eq("id", sectionId)
    .maybeSingle();

  if (sectionError) throw new Error(sectionError.message);
  if (!section) {
    return { title: sectionId, items: [], note: "Secção não encontrada." };
  }

  const { data: media, error: mediaError } = await client
    .from("media_items")
    .select("*")
    .eq("section_id", sectionId)
    .eq("slot", "gallery")
    .order("sort_order", { ascending: true });

  if (mediaError) throw new Error(mediaError.message);

  const items = (media || [])
    .filter((row) => {
      // QuickTime .mov falha em Chrome/Edge — não expor no portfolio
      const path = (row.storage_path || row.legacy_url || "").toLowerCase();
      const mime = (row.mime_type || "").toLowerCase();
      if (path.endsWith(".mov") || mime.includes("quicktime")) return false;
      return true;
    })
    .map(mediaRowToItem);

  return {
    title: section.title,
    layout: (section.layout as GalleryJson["layout"]) || undefined,
    note: section.note || undefined,
    items,
  };
}

export async function composeTeam(client: Client): Promise<TeamJson> {
  const { data: section } = await client
    .from("sections")
    .select("title")
    .eq("id", "team")
    .maybeSingle();

  const { data: members, error } = await client
    .from("team_members")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = members || [];
  return {
    title: section?.title || "Meet the Team",
    featured: rows.filter((m) => m.is_featured).map(teamRowToMember),
    members: rows.filter((m) => !m.is_featured).map(teamRowToMember),
  };
}

export async function composePartners(client: Client): Promise<PartnersJson> {
  const { data: section } = await client
    .from("sections")
    .select("title")
    .eq("id", "partners")
    .maybeSingle();

  const { data: partners, error } = await client
    .from("partners")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = partners || [];
  return {
    title: section?.title || "Parceiros",
    main: rows.filter((p) => p.tier === "main").map(partnerRowToPartner),
    secondary: rows.filter((p) => p.tier === "secondary").map(partnerRowToPartner),
  };
}
