import { createClient } from "@/lib/supabase/server";
import {
  composeGallery,
  composePartners,
  composeSite,
  composeTeam,
} from "@/lib/cms/compose";
import { prepareGalleryForSection } from "@/lib/gallery-utils";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { readContentJson } from "@/lib/content-store";
import type { GalleryData } from "@/lib/admin/sections";
import type { GalleryJson, PartnersJson, SiteJson, TeamJson } from "@/lib/types";

async function withJsonFallback<T>(
  supabaseFn: () => Promise<T>,
  jsonPath: string
): Promise<T> {
  if (!isSupabaseConfigured()) {
    return readContentJson<T>(jsonPath);
  }
  try {
    return await supabaseFn();
  } catch (err) {
    console.warn(`[content] Supabase falhou para ${jsonPath}, fallback JSON:`, err);
    return readContentJson<T>(jsonPath);
  }
}

export async function getSite(): Promise<SiteJson> {
  return withJsonFallback(async () => {
    const supabase = await createClient();
    return composeSite(supabase);
  }, "content/site.json");
}

export async function getGallery(slug: string): Promise<GalleryJson> {
  const raw = await withJsonFallback(async () => {
    const supabase = await createClient();
    return composeGallery(supabase, slug);
  }, `content/galleries/${slug}.json`);

  return prepareGalleryForSection(slug, raw as GalleryData) as GalleryJson;
}

export async function getTeam(): Promise<TeamJson> {
  return withJsonFallback(async () => {
    const supabase = await createClient();
    return composeTeam(supabase);
  }, "content/team.json");
}

export async function getPartners(): Promise<PartnersJson> {
  return withJsonFallback(async () => {
    const supabase = await createClient();
    return composePartners(supabase);
  }, "content/partners.json");
}
