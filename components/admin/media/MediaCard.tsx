"use client";

import { Film, ImageIcon } from "lucide-react";
import type { MediaFile } from "@/lib/admin/sections";

type MediaCardProps = {
  file: MediaFile;
  selected?: boolean;
  onClick?: () => void;
  onSelect?: () => void;
  selectable?: boolean;
};

export function MediaCard({ file, selected, onClick, onSelect, selectable }: MediaCardProps) {
  const handleClick = () => {
    if (selectable && onSelect) onSelect();
    else onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        "group relative overflow-hidden rounded-xl border bg-black/40 text-left transition",
        selected
          ? "border-emerald-500/50 ring-2 ring-emerald-500/30"
          : "border-white/10 hover:border-white/20"
      ].join(" ")}
    >
      <div className="aspect-square w-full bg-zinc-900">
        {file.type === "video" ? (
          <video src={file.url} muted playsInline className="h-full w-full object-cover" />
        ) : (
          <img src={file.url} alt={file.name} loading="lazy" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-8">
        <p className="truncate text-xs font-medium text-white">{file.name}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-zinc-400">
          {file.type === "video" ? (
            <Film className="size-3" strokeWidth={1.75} />
          ) : (
            <ImageIcon className="size-3" strokeWidth={1.75} />
          )}
          {file.type === "video" ? "Vídeo" : "Imagem"}
        </p>
      </div>
    </button>
  );
}
