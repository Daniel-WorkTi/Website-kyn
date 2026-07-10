"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { MediaPickerField } from "@/components/admin/editor/fields/MediaPickerField";
import { previewUrl, type GalleryItem, type MediaFile } from "@/lib/admin/sections";

type MediaCardProps = {
  item: GalleryItem;
  index: number;
  total: number;
  files: MediaFile[];
  onChange: (index: number, item: GalleryItem) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: "up" | "down") => void;
  uploadForPicker: (file: File) => Promise<string>;
};

export function MediaCard({
  item,
  index,
  total,
  files,
  onChange,
  onRemove,
  onMove,
  uploadForPicker
}: MediaCardProps) {
  const [uploading, setUploading] = useState(false);
  const url = previewUrl(item);

  const badge = `${item.type === "video" ? "Vídeo" : "Foto"}${item.featured ? " · Destaque" : ""}`;

  return (
    <article className="overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.02]">
      <div className="relative">
        <MediaPickerField
          type={item.type}
          value={item.src}
          files={files}
          uploading={uploading}
          onChange={(pickedUrl) => {
            const picked = files.find((f) => f.url === pickedUrl);
            const type =
              picked?.type === "video"
                ? "video"
                : picked?.type === "image"
                  ? "image"
                  : /\.(mp4|webm|mov|m4v)(\?|$)/i.test(pickedUrl)
                    ? "video"
                    : item.type;
            onChange(index, {
              ...item,
              src: pickedUrl,
              type
            });
          }}
          onUpload={async (file) => {
            setUploading(true);
            try {
              return await uploadForPicker(file);
            } finally {
              setUploading(false);
            }
          }}
          onRemove={url ? () => onChange(index, { ...item, src: "" }) : undefined}
        />
        {url ? (
          <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-md bg-black/70 px-2 py-0.5 text-[0.65rem] font-medium text-white backdrop-blur-sm">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="space-y-3 p-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
          Item {index + 1}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs text-zinc-400">Tipo</label>
            <select
              value={item.type}
              onChange={(e) =>
                onChange(index, {
                  ...item,
                  type: e.target.value as "image" | "video"
                })
              }
              className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:border-accent/40"
            >
              <option value="image">Foto</option>
              <option value="video">Vídeo</option>
            </select>
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={item.featured}
              onChange={(e) => onChange(index, { ...item, featured: e.target.checked })}
              className="size-4 rounded border-white/20 accent-accent"
            />
            Destaque (largura total)
          </label>
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-zinc-400">Descrição (opcional)</label>
          <input
            type="text"
            value={item.alt || ""}
            onChange={(e) => onChange(index, { ...item, alt: e.target.value })}
            placeholder="Ex.: Concerto ao vivo"
            className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:border-accent/40"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, "up")}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.08] disabled:opacity-40"
          >
            <ArrowUp className="size-3.5" strokeWidth={1.75} />
            Subir
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(index, "down")}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.08] disabled:opacity-40"
          >
            <ArrowDown className="size-3.5" strokeWidth={1.75} />
            Descer
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/20"
          >
            <Trash2 className="size-3.5" strokeWidth={1.75} />
            Remover
          </button>
        </div>
      </div>
    </article>
  );
}
