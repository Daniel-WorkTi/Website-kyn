"use client";

import { useEffect, useRef, useState } from "react";
import { EditorTopbar } from "@/components/admin/editor/EditorTopbar";
import { RightEditorPanel } from "@/components/admin/editor/RightEditorPanel";
import { SitePreviewFrame } from "@/components/admin/editor/SitePreviewFrame";
import { EditorStoreProvider, useEditorStore } from "@/hooks/useEditorStore";
import { previewUrlForSection } from "@/hooks/useAdmin";
import {
  homeDataToPageEditor,
  pageEditorToHomeData
} from "@/lib/admin/editor-types";
import type { AdminSection, HomeData, MediaFile } from "@/lib/admin/sections";

type EditorShellProps = {
  section: AdminSection;
  data: HomeData;
  pageLabel: string;
  saving: boolean;
  uploading?: boolean;
  previewKey: number;
  onChange: (data: HomeData) => void;
  onDirty: () => void;
  onRefreshPreview: () => void;
  onUpload?: (file: File) => Promise<string>;
  mediaLibrary?: MediaFile[];
};

function EditorShellInner({
  section,
  data,
  pageLabel,
  saving,
  uploading = false,
  previewKey,
  onChange,
  onDirty,
  onRefreshPreview,
  onUpload,
  mediaLibrary = []
}: EditorShellProps) {
  const { pageData, resetHistory, selectedElementId, setSelectedElement } = useEditorStore();
  const [mobileTab, setMobileTab] = useState<"preview" | "edit">("preview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const skipDirtyRef = useRef(true);
  const internalSyncRef = useRef(false);

  useEffect(() => {
    if (internalSyncRef.current) {
      internalSyncRef.current = false;
      return;
    }
    skipDirtyRef.current = true;
    resetHistory(homeDataToPageEditor(data));
  }, [data, resetHistory]);

  useEffect(() => {
    if (skipDirtyRef.current) {
      skipDirtyRef.current = false;
      return;
    }
    internalSyncRef.current = true;
    onChange(pageEditorToHomeData(pageData, data));
    onDirty();
  }, [pageData, data, onChange, onDirty]);

  useEffect(() => {
    if (selectedElementId) {
      setDrawerOpen(true);
      setMobileTab("edit");
    }
  }, [selectedElementId]);

  const previewUrl = previewUrlForSection(section, previewKey);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-black">
      <EditorTopbar
        pageLabel={pageLabel}
        saving={saving}
        uploading={uploading}
        previewOpen={false}
        onTogglePreview={() => window.open(previewUrl, "_blank")}
        onRefreshPreview={onRefreshPreview}
      />

      <div className="flex border-b border-white/10 lg:hidden">
        {(["preview", "edit"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={[
              "flex-1 py-3 text-sm font-medium transition",
              mobileTab === tab ? "border-b-2 border-emerald-400 text-white" : "text-zinc-500"
            ].join(" ")}
          >
            {tab === "preview" ? "Preview" : "Editar"}
          </button>
        ))}
      </div>

      <div className="relative flex min-h-0 flex-1">
        <div
          className={[
            "min-h-0 min-w-0 flex-1 flex-col",
            mobileTab === "edit" ? "hidden lg:flex" : "flex"
          ].join(" ")}
        >
          <SitePreviewFrame src={previewUrl} onRefresh={onRefreshPreview} />
        </div>

        <div className="hidden shrink-0 lg:block">
          <RightEditorPanel
            uploading={uploading}
            onUpload={onUpload}
            mediaLibrary={mediaLibrary}
            className="h-[calc(100vh-57px)]"
          />
        </div>

        <div
          className={[
            "fixed inset-y-0 right-0 z-40 hidden w-[380px] max-w-[92vw] shadow-2xl transition-transform duration-300 md:block lg:hidden",
            drawerOpen || mobileTab === "edit" ? "translate-x-0" : "translate-x-full"
          ].join(" ")}
        >
          <RightEditorPanel
            uploading={uploading}
            onUpload={onUpload}
            mediaLibrary={mediaLibrary}
            className="h-full"
            onClose={() => setDrawerOpen(false)}
          />
        </div>

        <div
          className={[
            "fixed inset-x-0 bottom-0 z-40 max-h-[78dvh] rounded-t-2xl border-t border-white/10 bg-[#0a0a0a] shadow-2xl transition-transform duration-300 lg:hidden",
            mobileTab === "edit" ? "translate-y-0" : "translate-y-full"
          ].join(" ")}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-sm font-medium text-white">Editar</span>
            <button
              type="button"
              onClick={() => {
                setMobileTab("preview");
                setSelectedElement(null);
              }}
              className="text-xs text-zinc-500 hover:text-white"
            >
              Fechar
            </button>
          </div>
          <RightEditorPanel
            uploading={uploading}
            onUpload={onUpload}
            mediaLibrary={mediaLibrary}
            className="max-h-[calc(78dvh-48px)] w-full border-l-0"
          />
        </div>
      </div>
    </div>
  );
}

export function EditorShell(props: EditorShellProps) {
  const initial = homeDataToPageEditor(props.data);

  return (
    <EditorStoreProvider initialData={initial}>
      <EditorShellInner {...props} />
    </EditorStoreProvider>
  );
}
