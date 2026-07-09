"use client";

import type { MediaFile } from "@/lib/admin/sections";
import { MediaCard } from "./MediaCard";

type MediaGridProps = {
  files: MediaFile[];
  selectedUrl?: string | null;
  onSelect?: (file: MediaFile) => void;
  onOpen?: (file: MediaFile) => void;
  selectable?: boolean;
  emptyMessage?: string;
};

export function MediaGrid({
  files,
  selectedUrl,
  onSelect,
  onOpen,
  selectable = false,
  emptyMessage = "Nenhuma mídia encontrada."
}: MediaGridProps) {
  if (!files.length) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 px-6 py-16 text-center text-sm text-zinc-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {files.map((file) => (
        <MediaCard
          key={file.url}
          file={file}
          selected={selectedUrl === file.url}
          selectable={selectable}
          onSelect={() => onSelect?.(file)}
          onClick={() => onOpen?.(file)}
        />
      ))}
    </div>
  );
}
