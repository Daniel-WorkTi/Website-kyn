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

/** Conteúdo ainda não migrado → usar JSON do repositório. */
function assertSiteHydrated(site: SiteJson): SiteJson {
  if (!Array.isArray(site.nav) || site.nav.length === 0) {
    throw new Error("site_config.nav vazio — migração de conteúdo pendente");
  }
  return site;
}

function assertGalleryHydrated(gallery: GalleryJson, slug: string): GalleryJson {
  if (!Array.isArray(gallery.items) || gallery.items.length === 0) {
    throw new Error(`Galeria ${slug} vazia no Supabase — fallback JSON`);
  }
  return gallery;
}

function assertTeamHydrated(team: TeamJson): TeamJson {
  const count = (team.featured?.length || 0) + (team.members?.length || 0);
  if (count === 0) {
    throw new Error("Equipa vazia no Supabase — fallback JSON");
  }
  return team;
}

function assertPartnersHydrated(partners: PartnersJson): PartnersJson {
  const count = (partners.main?.length || 0) + (partners.secondary?.length || 0);
  if (count === 0) {
    throw new Error("Parceiros vazios no Supabase — fallback JSON");
  }
  return partners;
}

export async function getSite(): Promise<SiteJson> {
  return withJsonFallback(async () => {
    const supabase = await createClient();
    return assertSiteHydrated(await composeSite(supabase));
  }, "content/site.json");
}

export async function getGallery(slug: string): Promise<GalleryJson> {
  const raw = await withJsonFallback(async () => {
    const supabase = await createClient();
    return assertGalleryHydrated(await composeGallery(supabase, slug), slug);
  }, `content/galleries/${slug}.json`);

  return prepareGalleryForSection(slug, raw as GalleryData) as GalleryJson;
}

export async function getTeam(): Promise<TeamJson> {
  return withJsonFallback(async () => {
    const supabase = await createClient();
    return assertTeamHydrated(await composeTeam(supabase));
  }, "content/team.json");
}

export async function getPartners(): Promise<PartnersJson> {
  return withJsonFallback(async () => {
    const supabase = await createClient();
    return assertPartnersHydrated(await composePartners(supabase));
  }, "content/partners.json");
}
