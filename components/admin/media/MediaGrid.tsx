"use client";

import type { MediaFile } from "@/lib/admin/sections";
import { MediaCard } from "./MediaCard";

type MediaGridProps = {
  files: MediaFile[];
  selectedUrl?: string | null;
  onSelect?: (file: MediaFile) => void;
  onOpen?: (file: MediaFile) => void;
  onCopyUrl?: (url: string) => void;
  onDelete?: (file: MediaFile) => void;
  deletingUrl?: string | null;
  selectable?: boolean;
  variant?: "default" | "library";
  emptyMessage?: string;
};

export function MediaGrid({
  files,
  selectedUrl,
  onSelect,
  onOpen,
  onCopyUrl,
  onDelete,
  deletingUrl,
  selectable = false,
  variant = "default",
  emptyMessage = "Nenhuma mídia encontrada."
}: MediaGridProps) {
  if (!files.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-6 py-20 text-center text-sm text-zinc-500">
        {emptyMessage}
      </div>
    );
  }

  const gridClass =
    variant === "library"
      ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
      : "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

  return (
    <div className={gridClass}>
      {files.map((file) => (
        <MediaCard
          key={file.url}
          file={file}
          variant={variant}
          selected={selectedUrl === file.url}
          selectable={selectable}
          deleting={deletingUrl === file.url}
          onSelect={() => onSelect?.(file)}
          onClick={() => onOpen?.(file)}
          onCopyUrl={onCopyUrl}
          onDelete={onDelete ? () => onDelete(file) : undefined}
        />
      ))}
    </div>
  );
}
