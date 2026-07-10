"use client";

import { Loader2 } from "lucide-react";
import { EditorTopbar } from "@/components/admin/editor/EditorTopbar";
import { EditorStoreProvider } from "@/hooks/useEditorStore";
import { previewUrlForSection } from "@/hooks/useAdmin";
import type { AdminSection } from "@/lib/admin/sections";

type SectionVisualShellProps = {
  section: AdminSection;
  pageLabel: string;
  saving: boolean;
  uploading?: boolean;
  previewKey: number;
  onRefresh: () => void;
  loading?: boolean;
  children: React.ReactNode;
};

export function SectionVisualShell({
  section,
  pageLabel,
  saving,
  uploading = false,
  previewKey,
  onRefresh,
  loading,
  children
}: SectionVisualShellProps) {
  const previewUrl = previewUrlForSection(section, previewKey);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-zinc-500" strokeWidth={1.75} />
        <span className="ml-3 text-sm text-zinc-500">A carregar conteúdo…</span>
      </div>
    );
  }

  return (
    <EditorStoreProvider>
      <div className="flex min-h-0 flex-1 flex-col bg-black">
        <EditorTopbar
          pageLabel={pageLabel}
          saving={saving}
          uploading={uploading}
          previewOpen={false}
          onTogglePreview={() => window.open(previewUrl, "_blank")}
          onRefreshPreview={onRefresh}
        />
        {children}
      </div>
    </EditorStoreProvider>
  );
}
