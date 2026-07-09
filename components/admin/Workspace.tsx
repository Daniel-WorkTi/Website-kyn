"use client";

import { ExternalLink, Loader2, Monitor, RefreshCw, Smartphone } from "lucide-react";
import { SaveIcon } from "@/components/admin/icons/ProimagemIcons";
import { MediaLibraryPage } from "@/components/admin/media/MediaLibrary";
import { EditorShell } from "@/components/admin/editor/EditorShell";
import { GalleryEditor } from "@/components/admin/editors/GalleryEditor";
import { PartnersEditor } from "@/components/admin/editors/PartnersEditor";
import { TeamEditor } from "@/components/admin/editors/TeamEditor";
import { previewUrlForSection, useAdmin } from "@/hooks/useAdmin";
import type { GalleryData, HomeData, PartnersData, TeamData } from "@/lib/admin/sections";

const DESKTOP_PREVIEW_W = 1280;
const DESKTOP_PREVIEW_H = 820;
const PREVIEW_FRAME_W = 248;

function LegacyEditorContent() {
  const {
    section,
    data,
    loading,
    setData,
    markDirty,
    processUpload,
    showToast,
    mediaLibrary,
    refreshMediaLibrary,
    mediaLoading
  } = useAdmin();

  if (loading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-zinc-500" strokeWidth={1.75} />
        <span className="ml-3 text-sm text-zinc-500">A carregar conteúdo…</span>
      </div>
    );
  }

  const common = {
    onDirty: markDirty,
    processUpload,
    showToast,
    mediaLibrary,
    refreshMediaLibrary,
    mediaLoading
  };

  switch (section.type) {
    case "gallery":
      return (
        <GalleryEditor
          data={data as GalleryData}
          onChange={(next) => setData(next)}
          {...common}
        />
      );
    case "team":
      return (
        <TeamEditor
          data={data as TeamData}
          onChange={(next) => setData(next)}
          {...common}
        />
      );
    case "partners":
      return (
        <PartnersEditor
          data={data as PartnersData}
          onChange={(next) => setData(next)}
          {...common}
        />
      );
    default:
      return null;
  }
}

function PreviewPanel({
  src,
  previewKey,
  viewport,
  onViewportChange,
  onRefresh
}: {
  src: string;
  previewKey: number;
  viewport: "desktop" | "mobile";
  onViewportChange: (viewport: "desktop" | "mobile") => void;
  onRefresh: () => void;
}) {
  const desktopScale = PREVIEW_FRAME_W / DESKTOP_PREVIEW_W;
  const desktopFrameH = Math.round(DESKTOP_PREVIEW_H * desktopScale);

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col border-l border-white/[0.06] bg-[#0a0a0a] lg:flex">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Pré-visualização
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onViewportChange("desktop")}
            title="Versão desktop"
            className={[
              "flex size-7 items-center justify-center rounded-md transition",
              viewport === "desktop"
                ? "bg-white/[0.1] text-white"
                : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"
            ].join(" ")}
          >
            <Monitor className="size-3.5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => onViewportChange("mobile")}
            title="Versão mobile"
            className={[
              "flex size-7 items-center justify-center rounded-md transition",
              viewport === "mobile"
                ? "bg-white/[0.1] text-white"
                : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"
            ].join(" ")}
          >
            <Smartphone className="size-3.5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={onRefresh}
            title="Atualizar"
            className="flex size-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
          >
            <RefreshCw className="size-3.5" strokeWidth={1.75} />
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir em nova janela"
            className="flex size-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
          >
            <ExternalLink className="size-3.5" strokeWidth={1.75} />
          </a>
        </div>
      </div>

      <div className="sidebar-scroll flex flex-1 items-start justify-center overflow-y-auto overflow-x-hidden p-3">
        {viewport === "mobile" ? (
          <div className="w-[248px] overflow-hidden rounded-[18px] border border-white/10 bg-black shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
            <iframe
              key={previewKey}
              src={src}
              title="Pré-visualização mobile"
              className="h-[460px] w-full border-0 bg-white"
            />
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-lg border border-white/10 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
            style={{ width: PREVIEW_FRAME_W, height: desktopFrameH }}
          >
            <iframe
              key={previewKey}
              src={src}
              title="Pré-visualização desktop"
              className="origin-top-left border-0"
              style={{
                width: DESKTOP_PREVIEW_W,
                height: DESKTOP_PREVIEW_H,
                transform: `scale(${desktopScale})`
              }}
            />
          </div>
        )}
      </div>
    </aside>
  );
}

export function Workspace() {
  const {
    section,
    data,
    loading,
    dirty,
    saving,
    uploading,
    previewOpen,
    previewViewport,
    previewKey,
    setData,
    markDirty,
    save,
    processUpload,
    togglePreview,
    setPreviewViewport,
    refreshPreview,
    mediaLibrary,
    mediaLoading,
    refreshMediaLibrary,
    deleteMedia,
    showToast
  } = useAdmin();

  if (section.type === "media") {
    async function uploadMany(files: File[]) {
      for (const file of files) {
        await processUpload(file, () => {});
      }
    }

    return (
      <MediaLibraryPage
        files={mediaLibrary}
        loading={mediaLoading}
        uploading={uploading}
        onRefresh={() => void refreshMediaLibrary()}
        onUpload={uploadMany}
        onDelete={deleteMedia}
        onCopyUrl={(url) => {
          void navigator.clipboard.writeText(url);
          showToast("URL copiada!", "ok");
        }}
      />
    );
  }

  if (section.type === "home") {
    if (loading || !data) {
      return (
        <div className="flex min-w-0 flex-1 items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-zinc-500" strokeWidth={1.75} />
          <span className="ml-3 text-sm text-zinc-500">A carregar conteúdo…</span>
        </div>
      );
    }

    async function uploadForEditor(file: File): Promise<string> {
      return new Promise((resolve, reject) => {
        processUpload(file, (url) => resolve(url)).catch(reject);
      });
    }

    return (
      <EditorShell
        data={data as HomeData}
        pageLabel={section.label}
        dirty={dirty}
        saving={saving}
        uploading={uploading}
        previewKey={previewKey}
        mediaLibrary={mediaLibrary}
        onChange={(next) => setData(next)}
        onDirty={markDirty}
        onSave={save}
        onUpload={uploadForEditor}
      />
    );
  }

  const previewSrc = `${previewUrlForSection(section)}?preview=1&t=${previewKey}`;

  return (
    <div className="flex min-w-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-5 lg:px-8">
          <div className="min-w-0">
            <h1 className="text-xl font-normal tracking-tight text-white lg:text-2xl">
              {section.label}
            </h1>
            <p className="mt-1 max-w-lg text-sm text-zinc-500">{section.hint}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={[
                "rounded-full px-3 py-1 text-xs font-medium",
                dirty
                  ? "border border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : "border border-accent/30 bg-accent-dim text-accent"
              ].join(" ")}
            >
              {dirty ? "Alterações por guardar" : "Tudo guardado"}
            </span>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.08]">
              <input
                type="checkbox"
                checked={previewOpen}
                onChange={(e) => togglePreview(e.target.checked)}
                className="size-3.5 rounded border-white/20 bg-transparent accent-emerald-400"
              />
              Ver pré-visualização
            </label>

            <button
              type="button"
              onClick={() => save()}
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 rounded-lg border border-white bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
              ) : (
                <SaveIcon className="size-4" />
              )}
              {saving ? "A guardar…" : "Guardar alterações"}
            </button>
          </div>
        </header>

        <div className="sidebar-scroll flex-1 overflow-y-auto px-6 py-6 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-8">
            <LegacyEditorContent />
          </div>
        </div>
      </div>

      {previewOpen && (
        <PreviewPanel
          src={previewSrc}
          previewKey={previewKey}
          viewport={previewViewport}
          onViewportChange={setPreviewViewport}
          onRefresh={refreshPreview}
        />
      )}
    </div>
  );
}
