"use client";

import { useMemo, useState } from "react";
import { Search, Upload, X } from "lucide-react";
import type { MediaFile } from "@/lib/admin/sections";
import { filterMediaFiles, type MediaFilter } from "@/lib/admin/media-utils";
import { MediaGrid } from "@/components/admin/media/MediaGrid";
import { MediaUploader } from "@/components/admin/media/MediaUploader";

type Tab = "library" | "upload";

type MediaPickerModalProps = {
  open: boolean;
  onClose: () => void;
  files: MediaFile[];
  filterType?: "image" | "video" | "all";
  onPick: (file: MediaFile) => void;
  /** Upload → deve devolver URL e o caller trata pick automático. */
  onUpload?: (file: File) => Promise<string | void>;
  uploading?: boolean;
  title?: string;
};

export function MediaPickerModal({
  open,
  onClose,
  files,
  filterType = "all",
  onPick,
  onUpload,
  uploading,
  title = "Escolher mídia"
}: MediaPickerModalProps) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("library");
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

  const accept =
    filterType === "video"
      ? "video/*"
      : filterType === "image"
        ? "image/*,.heic,.heif"
        : "image/*,.heic,.heif,video/*";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-base font-medium text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex gap-1 border-b border-white/[0.06] px-5 pt-3">
          {(
            [
              { id: "library" as const, label: "Biblioteca" },
              { id: "upload" as const, label: "Novo upload", hide: !onUpload }
            ] as const
          )
            .filter((t) => !("hide" in t && t.hide))
            .map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={[
                  "rounded-t-lg px-4 py-2.5 text-xs font-medium tracking-wide transition",
                  tab === t.id
                    ? "bg-white/[0.06] text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
        </div>

        <div className="sidebar-scroll flex-1 overflow-y-auto p-5 space-y-4">
          {tab === "library" ? (
            <>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: "all" as const, label: "Todas" },
                    { id: "image" as const, label: "Imagens" },
                    { id: "video" as const, label: "Vídeos" }
                  ] as const
                )
                  .filter((f) => filterType === "all" || f.id === filterType || f.id === "all")
                  .map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilter(f.id)}
                      className={[
                        "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                        filter === f.id
                          ? "border-white/20 bg-white/[0.06] text-zinc-100"
                          : "border-white/10 text-zinc-500 hover:text-zinc-300"
                      ].join(" ")}
                    >
                      {f.label}
                    </button>
                  ))}
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pesquisar por nome…"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-white/25"
                />
              </div>

              <MediaGrid
                files={filtered}
                selectable
                onSelect={(file) => {
                  onPick(file);
                  onClose();
                }}
                emptyMessage="Nenhuma mídia na biblioteca. Usa «Novo upload»."
              />
            </>
          ) : (
            <div className="space-y-4 py-2">
              <p className="text-sm text-zinc-500">
                O ficheiro é enviado, entra na biblioteca e é seleccionado automaticamente.
              </p>
              {onUpload ? (
                <MediaUploader
                  uploading={uploading}
                  onFiles={(picked) => {
                    picked.forEach((file) => {
                      void onUpload(file).then(() => {
                        /* caller fecha / aplica */
                      });
                    });
                  }}
                  accept={accept}
                  label="Escolher ficheiro"
                />
              ) : null}
              {uploading ? (
                <p className="flex items-center gap-2 text-sm text-amber-400/90">
                  <Upload className="size-4 animate-pulse" strokeWidth={1.75} />
                  A enviar…
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
