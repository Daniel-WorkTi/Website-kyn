"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorTopbar } from "@/components/admin/editor/EditorTopbar";
import { RightEditorPanel } from "@/components/admin/editor/RightEditorPanel";
import { SitePreviewCanvas } from "@/components/admin/editor/SitePreviewCanvas";
import { EditorStoreProvider, useEditorStore } from "@/hooks/useEditorStore";
import { previewUrlForSection } from "@/hooks/useAdmin";
import {
  homeDataToPageEditor,
  pageEditorToHomeData
} from "@/lib/admin/editor-types";
import type { HomeData, MediaFile } from "@/lib/admin/sections";

type EditorShellProps = {
  data: HomeData;
  pageLabel: string;
  dirty: boolean;
  saving: boolean;
  uploading?: boolean;
  previewKey: number;
  onChange: (data: HomeData) => void;
  onDirty: () => void;
  onSave: () => Promise<void>;
  onUpload?: (file: File) => Promise<string>;
  mediaLibrary?: MediaFile[];
};

function EditorShellInner({
  data,
  pageLabel,
  dirty,
  saving,
  uploading = false,
  previewKey,
  onChange,
  onDirty,
  onSave,
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

  const handleSave = useCallback(async () => {
    onChange(pageEditorToHomeData(pageData, data));
    await onSave();
  }, [pageData, data, onChange, onSave]);

  const previewUrl = `${previewUrlForSection({
    id: "home",
    label: pageLabel,
    file: "content/site.json",
    type: "home",
    page: "/",
    hint: ""
  })}?preview=1&t=${previewKey}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-black">
      <EditorTopbar
        pageLabel={pageLabel}
        dirty={dirty}
        saving={saving}
        previewOpen={false}
        onSave={handleSave}
        onTogglePreview={() => window.open(previewUrl, "_blank")}
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
          <SitePreviewCanvas />
        </div>

        <div className="hidden shrink-0 lg:block">
          <RightEditorPanel
            onSave={handleSave}
            saving={saving}
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
            onSave={handleSave}
            saving={saving}
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
            onSave={handleSave}
            saving={saving}
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
