"use client";

import { EditorTopbar } from "@/components/admin/editor/EditorTopbar";
import { VisualHomeCanvas } from "@/components/admin/editor/VisualHomeCanvas";
import { EditorStoreProvider } from "@/hooks/useEditorStore";
import { previewUrlForSection } from "@/hooks/useAdmin";
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

      <VisualHomeCanvas
        data={data}
        onChange={onChange}
        onDirty={onDirty}
        mediaLibrary={mediaLibrary}
        onUpload={onUpload}
        uploading={uploading}
      />
    </div>
  );
}

export function EditorShell(props: EditorShellProps) {
  return (
    <EditorStoreProvider>
      <EditorShellInner {...props} />
    </EditorStoreProvider>
  );
}
