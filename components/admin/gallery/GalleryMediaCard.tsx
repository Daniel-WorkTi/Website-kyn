"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type { GalleryItem, MediaFile } from "@/lib/admin/sections";
import {
  findLibraryFile,
  formatGalleryMetaLine,
  galleryDisplayTitle
} from "@/lib/gallery-utils";
import { GalleryMediaPreview } from "./GalleryMediaPreview";
import { GalleryMediaPoster } from "./GalleryMediaPoster";

export type GalleryMediaCardProps = {
  id: string;
  item: GalleryItem;
  mediaLibrary: MediaFile[];
  showFeatured?: boolean;
  /** Etiqueta discreta no preview (ex.: "Topo"). */
  badge?: string;
  onChange: (item: GalleryItem) => void;
  onRemove: () => void;
  onReplace: () => void;
  onPosterUpload: (file: File) => Promise<void>;
  posterUploading?: boolean;
};

export function GalleryMediaCard({
  id,
  item,
  mediaLibrary,
  showFeatured = false,
  badge,
  onChange,
  onRemove,
  onReplace,
  onPosterUpload,
  posterUploading
}: GalleryMediaCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1
  };

  const lib = findLibraryFile(mediaLibrary, item.src);
  const title = galleryDisplayTitle(item, lib);
  const meta = formatGalleryMetaLine({
    ...item,
    width: item.width || lib?.width,
    height: item.height || lib?.height,
    size: item.size || lib?.size,
    duration: item.duration
  });

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0a0a0a]"
    >
      <div className="relative">
        <GalleryMediaPreview
          src={item.src}
          type={item.type}
          poster={item.poster}
          title={title}
          onReplace={onReplace}
        />
        {badge ? (
          <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-md bg-black/70 px-2 py-0.5 text-[0.65rem] font-medium tracking-wide text-white backdrop-blur-sm">
            {badge}
          </span>
        ) : null}
        <button
          type="button"
          className="absolute right-2 top-2 z-10 flex size-8 cursor-grab items-center justify-center rounded-md border border-white/10 bg-black/60 text-zinc-400 backdrop-blur-sm transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40 active:cursor-grabbing"
          aria-label="Arrastar para reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-1">
          <h3 className="text-[15px] font-medium leading-snug tracking-tight text-zinc-100">
            {title}
          </h3>
          <p className="text-[12px] text-zinc-500">{meta}</p>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
            Descrição
          </label>
          <input
            type="text"
            value={item.alt || ""}
            onChange={(e) => onChange({ ...item, alt: e.target.value })}
            placeholder="Adicionar descrição opcional..."
            className="w-full rounded-lg border border-white/[0.08] bg-transparent px-3 py-2.5 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-white/20"
          />
        </div>

        {item.type === "video" ? (
          <GalleryMediaPoster
            posterUrl={item.poster}
            uploading={posterUploading}
            onUpload={onPosterUpload}
            onRemove={() => onChange({ ...item, poster: "" })}
          />
        ) : null}

        {showFeatured ? (
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={item.featured}
              onChange={(e) => onChange({ ...item, featured: e.target.checked })}
              className="size-4 rounded border-white/20 accent-white"
            />
            Destaque (largura total)
          </label>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
          <button
            type="button"
            onClick={onReplace}
            className="text-[12px] font-medium text-zinc-300 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          >
            Substituir
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remover ${title} desta galeria`}
            className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 transition hover:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          >
            <Trash2 className="size-3.5" strokeWidth={1.75} />
            Remover
          </button>
        </div>
      </div>
    </article>
  );
}
