"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { MediaFile } from "@/lib/admin/sections";
import { filterMediaFiles, type MediaFilter } from "@/lib/admin/media-utils";
import { MediaGrid } from "./MediaGrid";
import { MediaUploader } from "./MediaUploader";

type MediaPickerModalProps = {
  open: boolean;
  onClose: () => void;
  files: MediaFile[];
  filterType?: "image" | "video" | "all";
  onPick: (file: MediaFile) => void;
  onUpload?: (file: File) => Promise<string | void>;
  uploading?: boolean;
  title?: string;
};

const FILTERS: { id: MediaFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "image", label: "Imagens" },
  { id: "video", label: "Vídeos" },
  { id: "cover", label: "Capas" }
];

export function MediaPickerModal({
  open,
  onClose,
  files,
  filterType = "all",
  onPick,
  onUpload,
  uploading,
  title = "Escolher da biblioteca"
}: MediaPickerModalProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MediaFilter>(
    filterType === "image" ? "image" : filterType === "video" ? "video" : "all"
  );

  const filtered = useMemo(() => {
    let list = filterMediaFiles(files, filter, query);
    if (filterType === "image") list = list.filter((f) => f.type === "image");
    if (filterType === "video") list = list.filter((f) => f.type === "video");
    return list;
  }, [files, filter, query, filterType]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div className="relative flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-base font-medium text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="sidebar-scroll flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.filter((f) => filterType === "all" || f.id === filterType || f.id === "all").map(
              (f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={[
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                    filter === f.id
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 text-zinc-400 hover:text-white"
                  ].join(" ")}
                >
                  {f.label}
                </button>
              )
            )}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar por nome…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-emerald-500/40"
            />
          </div>

          {onUpload && (
            <MediaUploader
              uploading={uploading}
              onFiles={(picked) => picked.forEach((file) => void onUpload(file))}
              accept={filterType === "video" ? "video/*" : filterType === "image" ? "image/*" : "image/*,video/*"}
              label="Fazer upload"
            />
          )}

          <MediaGrid
            files={filtered}
            selectable
            onSelect={(file) => {
              onPick(file);
              onClose();
            }}
            emptyMessage="Nenhuma mídia na biblioteca. Envia ficheiros acima."
          />
        </div>
      </div>
    </div>
  );
}
