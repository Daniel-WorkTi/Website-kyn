import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { Json } from "@/lib/supabase/database.types";
import type { GalleryData, HomeData, PartnersData, TeamData } from "@/lib/admin/sections";
import { DEFAULT_SITE_NAV } from "@/lib/supabase/constants";

type Client = SupabaseClient<Database>;

function resolveNavForPersist(data: HomeData): Json {
  if (Array.isArray(data.nav) && data.nav.length > 0) {
    return data.nav as Json;
  }
  return [...DEFAULT_SITE_NAV] as unknown as Json;
}

function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com");
}

function isSupabaseStorageUrl(url: string): boolean {
  return url.includes("/storage/v1/object/public/media/");
}

function storagePathFromPublicUrl(url: string): string | null {
  const marker = "/storage/v1/object/public/media/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
}

function splitMediaSource(url: string): {
  storage_path: string | null;
  legacy_url: string | null;
} {
  if (!url) return { storage_path: null, legacy_url: null };
  if (isSupabaseStorageUrl(url)) {
    return { storage_path: storagePathFromPublicUrl(url), legacy_url: null };
  }
  if (isCloudinaryUrl(url) || url.startsWith("http")) {
    return { storage_path: null, legacy_url: url };
  }
  // relative or path-like
  return { storage_path: url.replace(/^\/+/, ""), legacy_url: null };
}

export async function persistHome(client: Client, data: HomeData): Promise<void> {
  const hero = data.hero || { title: "", subtitleLines: [], videos: [] };
  const { videos = [], ...heroMeta } = hero;

  const { error: configError } = await client.from("site_config").upsert({
    id: 1,
    brand: data.brand || "Proimagem.pt",
    email: typeof data.email === "string" ? data.email : null,
    socials: (data.socials || {}) as Json,
    nav: resolveNavForPersist(data),
    hero: heroMeta as Json,
  });

  if (configError) throw new Error(configError.message);

  const { error: delError } = await client
    .from("media_items")
    .delete()
    .eq("section_id", "home")
    .in("slot", ["hero", "home_stack"]);

  if (delError) throw new Error(delError.message);

  const rows: Database["public"]["Tables"]["media_items"]["Insert"][] = [];

  videos.forEach((video, i) => {
    if (!video.src) return;
    const src = splitMediaSource(video.src);
    const poster = video.poster ? splitMediaSource(video.poster) : null;
    rows.push({
      section_id: "home",
      slot: "hero",
      type: "video",
      storage_path: src.storage_path,
      legacy_url: src.legacy_url,
      thumbnail_path: poster?.storage_path ?? null,
      thumbnail_legacy_url: poster?.legacy_url ?? null,
      sort_order: i,
      alt_text: `Hero vídeo ${i + 1}`,
    });
  });

  (data.homeStack || []).forEach((item, i) => {
    if (!item.src) return;
    const src = splitMediaSource(item.src);
    rows.push({
      section_id: "home",
      slot: "home_stack",
      type: item.type,
      storage_path: src.storage_path,
      legacy_url: src.legacy_url,
      alt_text: item.alt || null,
      sort_order: i,
    });
  });

  if (rows.length > 0) {
    const { error: insertError } = await client.from("media_items").insert(rows);
    if (insertError) throw new Error(insertError.message);
  }

  await client
    .from("sections")
    .update({ title: data.brand || "Página Inicial" })
    .eq("id", "home");
}

export async function persistGallery(
  client: Client,
  sectionId: string,
  data: GalleryData
): Promise<void> {
  const { error: sectionError } = await client
    .from("sections")
    .update({
      title: data.title || sectionId,
      layout: data.layout || null,
      note: data.note || null,
    })
    .eq("id", sectionId);

  if (sectionError) throw new Error(sectionError.message);

  const { error: delError } = await client
    .from("media_items")
    .delete()
    .eq("section_id", sectionId)
    .eq("slot", "gallery");

  if (delError) throw new Error(delError.message);

  const rows = (data.items || [])
    .filter((item) => item.src)
    .map((item, i) => {
      const src = splitMediaSource(item.src);
      const poster = item.poster ? splitMediaSource(item.poster) : null;
      return {
        section_id: sectionId,
        slot: "gallery" as const,
        type: item.type,
        storage_path: src.storage_path,
        legacy_url: src.legacy_url,
        thumbnail_path: poster?.storage_path ?? null,
        thumbnail_legacy_url: poster?.legacy_url ?? null,
        alt_text: item.alt || null,
        featured: item.featured ?? false,
        sort_order: i,
      };
    });

  if (rows.length > 0) {
    const { error: insertError } = await client.from("media_items").insert(rows);
    if (insertError) throw new Error(insertError.message);
  }
}

export async function persistTeam(client: Client, data: TeamData): Promise<void> {
  if (data.title) {
    await client.from("sections").update({ title: data.title }).eq("id", "team");
  }

  const { error: delError } = await client.from("team_members").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delError) throw new Error(delError.message);

  const featured = (data.featured || []).map((m, i) => ({ member: m, featured: true, order: i }));
  const members = (data.members || []).map((m, i) => ({
    member: m,
    featured: false,
    order: 1000 + i,
  }));

  const rows = [...featured, ...members].map(({ member, featured, order }) => {
    const photo = member.photo ? splitMediaSource(member.photo) : null;
    return {
      name: member.name || "Sem nome",
      roles: member.roles || "",
      photo_path: photo?.storage_path ?? null,
      photo_legacy_url: photo?.legacy_url ?? null,
      photo_position: member.photoPosition || null,
      skills: member.skills || [],
      is_featured: featured,
      sort_order: order,
    };
  });

  if (rows.length > 0) {
    const { error: insertError } = await client.from("team_members").insert(rows);
    if (insertError) throw new Error(insertError.message);
  }
}

export async function persistPartners(client: Client, data: PartnersData): Promise<void> {
  if (data.title) {
    await client.from("sections").update({ title: data.title }).eq("id", "partners");
  }

  const { error: delError } = await client.from("partners").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delError) throw new Error(delError.message);

  const main = (data.main || []).map((p, i) => ({ partner: p, tier: "main" as const, order: i }));
  const secondary = (data.secondary || []).map((p, i) => ({
    partner: p,
    tier: "secondary" as const,
    order: 1000 + i,
  }));

  const rows = [...main, ...secondary].map(({ partner, tier, order }) => {
    const logo = partner.logo ? splitMediaSource(partner.logo) : null;
    return {
      name: partner.name || "Parceiro",
      logo_path: logo?.storage_path ?? null,
      logo_legacy_url: logo?.legacy_url ?? null,
      tier,
      sort_order: order,
    };
  });

  if (rows.length > 0) {
    const { error: insertError } = await client.from("partners").insert(rows);
    if (insertError) throw new Error(insertError.message);
  }
}
