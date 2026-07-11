import { prepareGalleryForSection } from "@/lib/gallery-utils";
import { readContentJson } from "@/lib/content-store";
import type { GalleryData } from "@/lib/admin/sections";
import type { GalleryJson, PartnersJson, SiteJson, TeamJson } from "./types";

export async function getSite(): Promise<SiteJson> {
  return readContentJson<SiteJson>("content/site.json");
}

export async function getGallery(slug: string): Promise<GalleryJson> {
  const data = await readContentJson<GalleryJson>(`content/galleries/${slug}.json`);
  if (
    data.layout === "studio" ||
    data.layout === "multicam" ||
    data.layout === "reels" ||
    slug === "photography"
  ) {
    return prepareGalleryForSection(slug, data as GalleryData) as GalleryJson;
  }
  return data;
}

export async function getTeam(): Promise<TeamJson> {
  return readContentJson<TeamJson>("content/team.json");
}

export async function getPartners(): Promise<PartnersJson> {
  return readContentJson<PartnersJson>("content/partners.json");
}
