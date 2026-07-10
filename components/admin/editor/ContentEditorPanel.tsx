"use client";

import type { SidebarSectionId } from "@/components/admin/AdminSidebar";
import { GalleryEditor } from "@/components/admin/editors/GalleryEditor";
import { HomeEditor } from "@/components/admin/editors/HomeEditor";
import { PartnersEditor } from "@/components/admin/editors/PartnersEditor";
import { TeamEditor } from "@/components/admin/editors/TeamEditor";
import type {
  AdminSection,
  GalleryData,
  HomeData,
  MediaFile,
  PartnersData,
  SectionData,
  TeamData
} from "@/lib/admin/sections";

type ContentEditorPanelProps = {
  section: AdminSection;
  data: SectionData;
  onChange: (data: SectionData) => void;
  onDirty: () => void;
  processUpload: (file: File, onSuccess: (url: string, file: File) => void) => Promise<void>;
  showToast: (message: string, type?: "ok" | "error" | "pending") => void;
  mediaLibrary: MediaFile[];
  refreshMediaLibrary: () => Promise<void>;
  mediaLoading: boolean;
};

export function ContentEditorPanel({
  section,
  data,
  onChange,
  onDirty,
  processUpload,
  showToast,
  mediaLibrary,
  refreshMediaLibrary,
  mediaLoading
}: ContentEditorPanelProps) {
  const common = {
    onDirty,
    processUpload,
    showToast,
    mediaLibrary,
    refreshMediaLibrary,
    mediaLoading
  };

  return (
    <aside className="sidebar-scroll flex w-full shrink-0 flex-col border-white/[0.08] bg-[#0a0a0a] md:w-[min(100%,440px)] md:border-l">
      <div className="shrink-0 border-b border-white/[0.06] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Editar
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">{section.hint}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {section.type === "home" && (
          <HomeEditor
            data={data as HomeData}
            onChange={(next) => onChange(next)}
            {...common}
          />
        )}

        {section.type === "gallery" && (
          <GalleryEditor
            sectionId={section.id as SidebarSectionId}
            data={data as GalleryData}
            onChange={(next) => onChange(next)}
            {...common}
          />
        )}

        {section.type === "team" && (
          <TeamEditor
            data={data as TeamData}
            onChange={(next) => onChange(next)}
            {...common}
          />
        )}

        {section.type === "partners" && (
          <PartnersEditor
            data={data as PartnersData}
            onChange={(next) => onChange(next)}
            {...common}
          />
        )}
      </div>
    </aside>
  );
}
