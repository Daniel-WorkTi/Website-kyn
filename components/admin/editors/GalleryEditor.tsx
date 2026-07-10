"use client";

import { useState } from "react";
import type { SidebarSectionId } from "@/components/admin/AdminSidebar";
import { DropZone } from "@/components/admin/shared/DropZone";
import { MediaCard } from "@/components/admin/shared/MediaCard";
import {
  EmptyState,
  MediaLibrary,
  SectionBlock
} from "@/components/admin/shared/MediaLibrary";
import type { GalleryData, GalleryItem, MediaFile } from "@/lib/admin/sections";
import {
  createGalleryItemFromLibrary,
  createGalleryItemFromUpload,
  normalizeGalleryItem,
  prepareGalleryForSection
} from "@/lib/gallery-utils";

type EditorCommonProps = {
  onDirty: () => void;
  processUpload: (file: File, onSuccess: (url: string, file: File) => void) => Promise<void>;
  showToast: (message: string, type?: "ok" | "error" | "pending") => void;
  mediaLibrary: MediaFile[];
  refreshMediaLibrary: () => Promise<void>;
  mediaLoading: boolean;
};

type GalleryEditorProps = EditorCommonProps & {
  sectionId: SidebarSectionId;
  data: GalleryData;
  onChange: (data: GalleryData) => void;
};

function renderItemList(
  items: GalleryItem[],
  allItems: GalleryItem[],
  updateItems: (next: GalleryItem[]) => void,
  processUpload: GalleryEditorProps["processUpload"],
  showToast: GalleryEditorProps["showToast"],
  data: GalleryData,
  onChange: GalleryEditorProps["onChange"],
  onDirty: () => void,
  sectionId: SidebarSectionId
) {
  return items.map((item) => {
    const index = allItems.indexOf(item);
    return (
      <MediaCard
        key={`${item.src}-${index}`}
        item={item}
        index={index}
        total={allItems.length}
        onChange={(i, updated) => {
          const next = [...allItems];
          next[i] =
            sectionId === "studio-space" ? normalizeGalleryItem(updated) : updated;
          updateItems(next);
        }}
        onRemove={(i) => {
          if (!window.confirm("Queres remover este item?")) return;
          updateItems(allItems.filter((_, idx) => idx !== i));
        }}
        onMove={(i, direction) => {
          const j = direction === "up" ? i - 1 : i + 1;
          if (j < 0 || j >= allItems.length) return;
          const next = [...allItems];
          [next[i], next[j]] = [next[j], next[i]];
          updateItems(next);
        }}
        onUpload={async (i, file, field = "src") => {
          try {
            await processUpload(file, (url, f) => {
              const next = [...allItems];
              if (field === "poster") {
                next[i] = { ...next[i], poster: url };
              } else {
                const entry =
                  sectionId === "studio-space"
                    ? createGalleryItemFromUpload(url, f, sectionId)
                    : {
                        ...next[i],
                        src: url,
                        type: f.type.startsWith("video/") ? ("video" as const) : ("image" as const)
                      };
                next[i] = { ...next[i], ...entry };
              }
              onChange(prepareGalleryForSection(sectionId, { ...data, items: next }));
              onDirty();
            });
          } catch (err) {
            showToast(err instanceof Error ? err.message : "Erro no envio.", "error");
          }
        }}
      />
    );
  });
}

export function GalleryEditor({
  sectionId,
  data,
  onChange,
  onDirty,
  processUpload,
  showToast,
  mediaLibrary,
  refreshMediaLibrary,
  mediaLoading
}: GalleryEditorProps) {
  const [uploading, setUploading] = useState(false);
  const isStudio = sectionId === "studio-space";
  const items = data.items || [];
  const videos = items.filter((i) => i.type === "video");
  const images = items.filter((i) => i.type === "image");

  function updateItems(next: GalleryItem[]) {
    onChange(prepareGalleryForSection(sectionId, { ...data, items: next }));
    onDirty();
  }

  function addFromLibrary(url: string, type: string) {
    updateItems([...items, createGalleryItemFromLibrary(url, type, sectionId)]);
  }

  async function handleDropFiles(files: File[]) {
    setUploading(true);
    let next = [...items];

    for (const file of files) {
      try {
        await processUpload(file, (url, f) => {
          next = [...next, createGalleryItemFromUpload(url, f, sectionId)];
          onChange(prepareGalleryForSection(sectionId, { ...data, items: next }));
        });
      } catch (err) {
        showToast(`${file.name}: ${err instanceof Error ? err.message : "Erro"}`, "error");
      }
    }

    onChange(prepareGalleryForSection(sectionId, { ...data, items: next }));
    onDirty();
    setUploading(false);
  }

  const libraryHint = isStudio
    ? "Envia ou escolhe da biblioteca — vídeos vão para o topo da página, fotos entram no grid automaticamente."
    : "Clica num ficheiro para adicionar à galeria, ou envia novos abaixo.";

  return (
    <div className="space-y-8">
      {isStudio && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100/90">
          No site: <strong>vídeos</strong> aparecem lado a lado no topo; <strong>fotos</strong> preenchem o
          grid em baixo. Basta enviar — a ordem é ajustada ao guardar.
        </div>
      )}

      <MediaLibrary
        files={mediaLibrary}
        hint={libraryHint}
        onSelect={addFromLibrary}
        onRefresh={refreshMediaLibrary}
        loading={mediaLoading}
      />

      <DropZone onFiles={handleDropFiles} uploading={uploading} />

      {items.length === 0 ? (
        <SectionBlock title="Galeria">
          <EmptyState
            title="Ainda não há conteúdo"
            text="Usa a biblioteca ou a área de envio para adicionar fotos e vídeos."
          />
        </SectionBlock>
      ) : isStudio ? (
        <div className="space-y-8">
          <SectionBlock title={`Vídeos no topo (${videos.length})`}>
            {videos.length === 0 ? (
              <p className="text-sm text-zinc-500">Ainda não há vídeos. Envia um ficheiro de vídeo.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">{renderItemList(videos, items, updateItems, processUpload, showToast, data, onChange, onDirty, sectionId)}</div>
            )}
          </SectionBlock>

          <SectionBlock title={`Fotos no grid (${images.length})`}>
            {images.length === 0 ? (
              <p className="text-sm text-zinc-500">Ainda não há fotos. Envia imagens para o grid.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">{renderItemList(images, items, updateItems, processUpload, showToast, data, onChange, onDirty, sectionId)}</div>
            )}
          </SectionBlock>
        </div>
      ) : (
        <SectionBlock title={`Galeria (${items.length === 1 ? "1 item" : `${items.length} itens`})`}>
          <div className="grid gap-4 sm:grid-cols-2">
            {renderItemList(items, items, updateItems, processUpload, showToast, data, onChange, onDirty, sectionId)}
          </div>
        </SectionBlock>
      )}
    </div>
  );
}
