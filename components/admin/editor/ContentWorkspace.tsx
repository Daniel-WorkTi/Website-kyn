"use client";

import { Loader2 } from "lucide-react";
import { ContentEditorPanel } from "@/components/admin/editor/ContentEditorPanel";
import { EditorTopbar } from "@/components/admin/editor/EditorTopbar";
import { LiveSitePreview } from "@/components/admin/editor/LiveSitePreview";
import { EditorStoreProvider } from "@/hooks/useEditorStore";
import { previewUrlForSection, useAdmin } from "@/hooks/useAdmin";

export function ContentWorkspace() {
  const {
    section,
    data,
    loading,
    saving,
    uploading,
    dirty,
    previewKey,
    loadError,
    setData,
    markDirty,
    processUpload,
    refreshPreview,
    reloadSection,
    showToast,
    mediaLibrary,
    refreshMediaLibrary,
    mediaLoading
  } = useAdmin();

  const previewUrl = previewUrlForSection(section, previewKey);

  if (loading && !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="size-6 animate-spin text-zinc-500" strokeWidth={1.75} />
        <span className="text-sm text-zinc-500">A carregar conteúdo…</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <p className="text-sm text-zinc-400">
          {loadError || "Não foi possível carregar esta secção."}
        </p>
        <button
          type="button"
          onClick={() => reloadSection()}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/[0.06]"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <EditorStoreProvider>
      <div className="flex min-h-0 flex-1 flex-col bg-black">
        <EditorTopbar
          pageLabel={section.label}
          saving={saving}
          uploading={uploading}
          dirty={dirty}
          previewOpen={false}
          onTogglePreview={() => window.open(previewUrl, "_blank")}
          onRefreshPreview={refreshPreview}
        />

        {loading && (
          <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2 text-xs text-zinc-500">
            <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
            A atualizar secção…
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <LiveSitePreview section={section} data={data} />

          <ContentEditorPanel
            section={section}
            data={data}
            onChange={setData}
            onDirty={markDirty}
            processUpload={processUpload}
            showToast={showToast}
            mediaLibrary={mediaLibrary}
            refreshMediaLibrary={refreshMediaLibrary}
            mediaLoading={mediaLoading}
          />
        </div>

        <p className="shrink-0 border-t border-white/[0.06] py-2 text-center text-xs text-zinc-600">
          À esquerda vês o site completo com scroll · À direita editas e guarda automaticamente
        </p>
      </div>
    </EditorStoreProvider>
  );
}
