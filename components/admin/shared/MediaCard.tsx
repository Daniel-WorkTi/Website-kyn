"use client";

import { useRef } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { previewUrl, type GalleryItem } from "@/lib/admin/sections";

type MediaCardProps = {
  item: GalleryItem;
  index: number;
  total: number;
  onChange: (index: number, item: GalleryItem) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: "up" | "down") => void;
  onUpload: (index: number, file: File, field?: "src" | "poster") => Promise<void>;
};

export function MediaCard({
  item,
  index,
  total,
  onChange,
  onRemove,
  onMove,
  onUpload
}: MediaCardProps) {
  const srcInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const url = previewUrl(item);

  const badge = `${item.type === "video" ? "Vídeo" : "Foto"}${item.featured ? " · Destaque" : ""}`;

  return (
    <article className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#141414]">
      <button
        type="button"
        onClick={() => srcInputRef.current?.click()}
        className="group relative block aspect-video w-full overflow-hidden bg-black/40"
      >
        {!url ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-zinc-500">
            <span>
              Clica para carregar
              <br />
              <small className="text-xs">foto ou vídeo</small>
            </span>
          </div>
        ) : item.type === "video" && !item.poster ? (
          <video src={item.src} muted playsInline className="h-full w-full object-cover" />
        ) : (
          <img src={url} alt={item.alt || ""} loading="lazy" className="h-full w-full object-cover" />
        )}
        <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[0.65rem] font-medium text-white backdrop-blur-sm">
          {badge}
        </span>
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          Trocar ficheiro
        </span>
        <input
          ref={srcInputRef}
          type="file"
          accept="image/*,video/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) await onUpload(index, file, "src");
          }}
        />
      </button>

      <div className="space-y-3 p-4">
        <p className="text-xs font-medium text-zinc-500">Item {index + 1}</p>

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

        {item.type === "video" && (
          <div>
            <label className="mb-1.5 block text-xs text-zinc-400">Capa do vídeo</label>
            <div className="flex flex-wrap items-center gap-2">
              {item.poster && (
                <img
                  src={item.poster}
                  alt=""
                  className="size-12 rounded-lg border border-white/10 object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => posterInputRef.current?.click()}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.08]"
              >
                Carregar capa
              </button>
              {item.poster && (
                <button
                  type="button"
                  onClick={() => onChange(index, { ...item, poster: "" })}
                  className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 transition hover:text-zinc-300"
                >
                  Remover capa
                </button>
              )}
              <input
                ref={posterInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) await onUpload(index, file, "poster");
                }}
              />
            </div>
          </div>
        )}

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
