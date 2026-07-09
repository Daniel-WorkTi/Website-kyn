"use client";

import { useState } from "react";
import { DropZone } from "@/components/admin/shared/DropZone";
import { MediaCard } from "@/components/admin/shared/MediaCard";
import {
  EmptyState,
  MediaLibrary,
  SectionBlock
} from "@/components/admin/shared/MediaLibrary";
import type { GalleryData, GalleryItem, MediaFile } from "@/lib/admin/sections";

type EditorCommonProps = {
  onDirty: () => void;
  processUpload: (file: File, onSuccess: (url: string, file: File) => void) => Promise<void>;
  showToast: (message: string, type?: "ok" | "error" | "pending") => void;
  mediaLibrary: MediaFile[];
  refreshMediaLibrary: () => Promise<void>;
  mediaLoading: boolean;
};

type GalleryEditorProps = EditorCommonProps & {
  data: GalleryData;
  onChange: (data: GalleryData) => void;
};

export function GalleryEditor({
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
  const items = data.items || [];

  function updateItems(next: GalleryItem[]) {
    onChange({ ...data, items: next });
    onDirty();
  }

  function addFromLibrary(url: string, type: string) {
    const next: GalleryItem = {
      type: type === "video" ? "video" : "image",
      featured: false,
      src: url,
      alt: url.split("/").pop()?.replace(/\.[^.]+$/, "") || ""
    };
    updateItems([...items, next]);
  }

  async function handleDropFiles(files: File[]) {
    setUploading(true);
    let next = [...items];
    for (const file of files) {
      try {
        await processUpload(file, (url, f) => {
          next = [
            ...next,
            {
              type: f.type.startsWith("video/") ? "video" : "image",
              featured: false,
              src: url,
              alt: f.name.replace(/\.[^.]+$/, "")
            }
          ];
          onChange({ ...data, items: next });
        });
      } catch (err) {
        showToast(`${file.name}: ${err instanceof Error ? err.message : "Erro"}`, "error");
      }
    }
    onDirty();
    setUploading(false);
  }

  return (
    <div className="space-y-8">
      <MediaLibrary
        files={mediaLibrary}
        hint="Clica num ficheiro para adicionar à galeria, ou envia novos abaixo."
        onSelect={addFromLibrary}
        onRefresh={refreshMediaLibrary}
        loading={mediaLoading}
      />

      <DropZone onFiles={handleDropFiles} uploading={uploading} />

      <SectionBlock title={`Galeria (${items.length === 1 ? "1 item" : `${items.length} itens`})`}>
        {items.length === 0 ? (
          <EmptyState
            title="Ainda não há conteúdo"
            text="Usa a biblioteca ou a área de envio para adicionar fotos e vídeos."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item, index) => (
              <MediaCard
                key={`${item.src}-${index}`}
                item={item}
                index={index}
                total={items.length}
                onChange={(i, updated) => {
                  const next = [...items];
                  next[i] = updated;
                  updateItems(next);
                }}
                onRemove={(i) => {
                  if (!window.confirm("Queres remover este item?")) return;
                  updateItems(items.filter((_, idx) => idx !== i));
                }}
                onMove={(i, direction) => {
                  const j = direction === "up" ? i - 1 : i + 1;
                  if (j < 0 || j >= items.length) return;
                  const next = [...items];
                  [next[i], next[j]] = [next[j], next[i]];
                  updateItems(next);
                }}
                onUpload={async (i, file, field = "src") => {
                  try {
                    await processUpload(file, (url, f) => {
                      const next = [...items];
                      if (field === "poster") {
                        next[i] = { ...next[i], poster: url };
                      } else {
                        next[i] = {
                          ...next[i],
                          src: url,
                          type: f.type.startsWith("video/") ? "video" : "image"
                        };
                      }
                      onChange({ ...data, items: next });
                      onDirty();
                    });
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : "Erro no envio.", "error");
                  }
                }}
              />
            ))}
          </div>
        )}
      </SectionBlock>
    </div>
  );
}
