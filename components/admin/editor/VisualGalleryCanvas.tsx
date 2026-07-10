"use client";

import { useMemo, useState } from "react";
import type { SidebarSectionId } from "@/components/admin/AdminSidebar";
import MediaItem from "@/components/site/MediaItem";
import { EditableZone } from "@/components/admin/editor/EditableZone";
import { AddMediaButton } from "@/components/admin/editor/FloatingEditPanel";
import { VisualEditorFrame } from "@/components/admin/editor/VisualEditorFrame";
import { VisualMediaControls } from "@/components/admin/editor/VisualMediaControls";
import {
  createGalleryItemFromLibrary,
  createGalleryItemFromUpload,
  normalizeGalleryItem
} from "@/lib/gallery-utils";
import type { GalleryData, GalleryItem, MediaFile } from "@/lib/admin/sections";

type Selection =
  | { kind: "title" }
  | { kind: "item"; index: number }
  | { kind: "add" }
  | null;

const VIDEO_ONLY = new Set<SidebarSectionId>(["multicam", "aftermovie"]);

type VisualGalleryCanvasProps = {
  sectionId: SidebarSectionId;
  data: GalleryData;
  onChange: (data: GalleryData) => void;
  onDirty: () => void;
  mediaLibrary: MediaFile[];
  onUpload?: (file: File) => Promise<string>;
  uploading?: boolean;
};

export function VisualGalleryCanvas({
  sectionId,
  data,
  onChange,
  onDirty,
  mediaLibrary,
  onUpload,
  uploading = false
}: VisualGalleryCanvasProps) {
  const [selection, setSelection] = useState<Selection>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const layout = data.layout || "default";
  const items = useMemo(
    () => (data.items || []).map((item) => normalizeGalleryItem(item, data.title || "Gallery")),
    [data.items, data.title]
  );

  const videos = items.filter((i) => i.type === "video");
  const images = items.filter((i) => i.type === "image");
  const topVideos = layout === "studio" ? videos.slice(0, 2) : [];
  const masonryItems = layout === "studio" ? [...videos.slice(2), ...images] : items;

  function patch(partial: Partial<GalleryData>) {
    onChange({ ...data, ...partial });
    onDirty();
  }

  function patchItems(next: GalleryItem[]) {
    patch({ items: next });
  }

  function openItem(index: number) {
    setSelection({ kind: "item", index });
    setPickerOpen(true);
  }

  function applyMedia(url: string, file?: File) {
    if (!selection) return;

    if (selection.kind === "add") {
      const entry = file
        ? createGalleryItemFromUpload(url, file, sectionId)
        : createGalleryItemFromLibrary(url, guessFromUrl(url), sectionId);
      patchItems([...items, entry]);
      setPickerOpen(false);
      setSelection(null);
      return;
    }

    if (selection.kind === "item") {
      const next = [...items];
      const current = next[selection.index];
      if (!current) return;

      if (file) {
        const entry = createGalleryItemFromUpload(url, file, sectionId);
        next[selection.index] = { ...current, ...entry };
      } else {
        next[selection.index] = normalizeGalleryItem(
          {
            ...current,
            type: guessFromUrl(url) === "video" ? "video" : "image",
            src: url
          },
          data.title || "Gallery"
        );
      }
      patchItems(next);
      setPickerOpen(false);
    }
  }

  function guessFromUrl(url: string): string {
    return url.includes("/video/upload/") ? "video" : "image";
  }

  async function handleUpload(file: File) {
    if (!onUpload) return;
    const url = await onUpload(file);
    if (url) applyMedia(url, file);
  }

  function removeItem(index: number) {
    patchItems(items.filter((_, i) => i !== index));
    setSelection(null);
  }

  const pickerFilter = VIDEO_ONLY.has(sectionId) ? "video" : "all";

  const panelTitle =
    selection?.kind === "add"
      ? "Adicionar mídia"
      : selection?.kind === "item"
        ? "Trocar mídia"
        : "";

  function renderTile(item: GalleryItem, index: number, className: string) {
    return (
      <EditableZone
        key={`${item.src}-${index}`}
        label={item.type === "video" ? "Vídeo" : "Imagem"}
        hint="Clica para trocar"
        selected={selection?.kind === "item" && selection.index === index}
        onSelect={() => openItem(index)}
        className={className}
        overlayClassName="rounded-none"
      >
        <MediaItem item={item} autoplay={item.type === "video"} />
      </EditableZone>
    );
  }

  return (
    <>
      <VisualEditorFrame onBackgroundClick={() => setSelection(null)}>
        <EditableZone
          label="Título"
          hint="Clica para editar"
          selected={selection?.kind === "title"}
          onSelect={() => setSelection({ kind: "title" })}
          className="page-heading"
          overlayClassName="rounded-none"
        >
          <h1
            className="page-heading__title outline-none"
            contentEditable
            suppressContentEditableWarning
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => {
              const value = e.currentTarget.textContent?.trim() || "";
              if (value && value.toUpperCase() !== (data.title || "").toUpperCase()) {
                patch({ title: value });
              }
            }}
          >
            {(data.title || "Galeria").toUpperCase()}
          </h1>
        </EditableZone>

        {layout === "studio" && topVideos.length > 0 && (
          <div className={`studio-gallery__videos studio-gallery__videos--${Math.min(topVideos.length, 2)}`}>
            {topVideos.map((item) => renderTile(item, items.indexOf(item), "studio-gallery__tile studio-gallery__tile--video"))}
          </div>
        )}

        {layout === "studio" && masonryItems.length > 0 && (
          <div className="studio-gallery__masonry">
            {masonryItems.map((item, i) =>
              renderTile(item, items.indexOf(item), `studio-gallery__tile studio-gallery__tile--${(i % 6) + 1}`)
            )}
          </div>
        )}

        {layout === "multicam" && (
          <div className="multicam-gallery">
            {items.map((item, i) => renderTile(item, i, "multicam-gallery__tile"))}
          </div>
        )}

        {layout === "reels" && (
          <div className="reels-gallery">
            {items.map((item, i) => renderTile(item, i, "reels-gallery__tile"))}
          </div>
        )}

        {layout !== "studio" && layout !== "multicam" && layout !== "reels" && (
          <div className="supd-grid">
            {items.map((item, i) =>
              renderTile(
                item,
                i,
                `supd-grid__cell${item.featured ? " supd-grid__cell--wide" : ""}`
              )
            )}
          </div>
        )}

        <AddMediaButton
          onClick={() => {
            setSelection({ kind: "add" });
            setPickerOpen(true);
          }}
        />

        {data.note && <p className="placeholder-note section">{data.note}</p>}
      </VisualEditorFrame>

      {selection?.kind === "title" && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#0a0a0a]/95 p-4 text-xs text-zinc-500 shadow-xl">
          Clica no título e edita o texto diretamente no site.
        </div>
      )}

      <VisualMediaControls
        open={selection?.kind === "item" || selection?.kind === "add"}
        title={panelTitle}
        onClose={() => setSelection(null)}
        pickerOpen={pickerOpen}
        onPickerOpenChange={setPickerOpen}
        files={mediaLibrary}
        filterType={pickerFilter}
        onPick={(file) => applyMedia(file.url)}
        onUpload={onUpload ? handleUpload : undefined}
        uploading={uploading}
        onRemove={selection?.kind === "item" ? () => removeItem(selection.index) : undefined}
      />
    </>
  );
}
