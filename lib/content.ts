import fs from "fs/promises";
import path from "path";
import { prepareGalleryForSection } from "@/lib/gallery-utils";
import type { GalleryData } from "@/lib/admin/sections";
import type { GalleryJson, PartnersJson, SiteJson, TeamJson } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");

async function readJson<T>(filePath: string): Promise<T> {
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data) as T;
}

export async function getSite(): Promise<SiteJson> {
  return readJson<SiteJson>(path.join(CONTENT_DIR, "site.json"));
}

export async function getGallery(slug: string): Promise<GalleryJson> {
  const data = await readJson<GalleryJson>(path.join(CONTENT_DIR, "galleries", `${slug}.json`));
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
  return readJson<TeamJson>(path.join(CONTENT_DIR, "team.json"));
}

export async function getPartners(): Promise<PartnersJson> {
  return readJson<PartnersJson>(path.join(CONTENT_DIR, "partners.json"));
}
