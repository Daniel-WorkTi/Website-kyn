import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  composeGallery,
  composePartners,
  composeSite,
  composeTeam,
} from "@/lib/cms/compose";
import {
  persistGallery,
  persistHome,
  persistPartners,
  persistTeam,
} from "@/lib/cms/persist";
import { prepareGalleryForSection } from "@/lib/gallery-utils";
import type {
  GalleryData,
  HomeData,
  PartnersData,
  SectionData,
  TeamData,
} from "@/lib/admin/sections";
import { getSectionById } from "@/lib/admin/sections";
import type { SidebarSectionId } from "@/components/admin/AdminSidebar";

type Client = SupabaseClient<Database>;

export async function loadSectionDocument(
  client: Client,
  sectionId: SidebarSectionId
): Promise<SectionData> {
  const section = getSectionById(sectionId);
  if (!section) throw new Error("Secção desconhecida.");

  if (section.type === "home") {
    return (await composeSite(client)) as HomeData;
  }
  if (section.type === "gallery") {
    const gallery = await composeGallery(client, sectionId);
    return prepareGalleryForSection(sectionId, gallery as GalleryData);
  }
  if (section.type === "team") {
    return (await composeTeam(client)) as TeamData;
  }
  if (section.type === "partners") {
    return (await composePartners(client)) as PartnersData;
  }
  throw new Error("Tipo de secção sem documento.");
}

export async function saveSectionDocument(
  client: Client,
  sectionId: SidebarSectionId,
  data: SectionData
): Promise<void> {
  const section = getSectionById(sectionId);
  if (!section) throw new Error("Secção desconhecida.");

  // Confirmar admin
  const { data: isAdmin, error: adminError } = await client.rpc("is_admin");
  if (adminError) throw new Error(adminError.message);
  if (!isAdmin) throw new Error("Sem permissão de administrador.");

  if (section.type === "home") {
    await persistHome(client, data as HomeData);
    return;
  }
  if (section.type === "gallery") {
    const prepared = prepareGalleryForSection(sectionId, data as GalleryData);
    await persistGallery(client, sectionId, prepared);
    return;
  }
  if (section.type === "team") {
    await persistTeam(client, data as TeamData);
    return;
  }
  if (section.type === "partners") {
    await persistPartners(client, data as PartnersData);
    return;
  }
  throw new Error("Tipo de secção sem persistência.");
}
