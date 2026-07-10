"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import type { MediaFile } from "@/lib/admin/sections";
import { filterMediaFiles, type MediaFilter } from "@/lib/admin/media-utils";
import { MediaGrid } from "./MediaGrid";
import { MediaUploader } from "./MediaUploader";

type MediaLibraryPageProps = {
  files: MediaFile[];
  loading?: boolean;
  uploading?: boolean;
  onRefresh: () => void;
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (file: MediaFile) => Promise<void>;
  onCopyUrl: (url: string) => void;
};

const FILTERS: { id: MediaFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "image", label: "Imagens" },
  { id: "video", label: "Vídeos" },
  { id: "cover", label: "Capas" }
];

export function MediaLibraryPage({
  files,
  loading,
  uploading,
  onRefresh,
  onUpload,
  onDelete,
  onCopyUrl
}: MediaLibraryPageProps) {
  const [filter, setFilter] = useState<MediaFilter>("all");
  const [query, setQuery] = useState("");
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);

  const filtered = useMemo(() => filterMediaFiles(files, filter, query), [files, filter, query]);

  async function handleDelete(file: MediaFile) {
    if (!window.confirm(`Remover "${file.name}" da biblioteca?`)) return;
    setDeletingUrl(file.url);
    try {
      await onDelete(file);
    } finally {
      setDeletingUrl(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-black">
      <header className="shrink-0 border-b border-white/[0.08] px-6 py-5 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-medium text-white lg:text-2xl">Biblioteca de Mídia</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Envia, organiza e gere todas as fotos e vídeos do site.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            <RefreshCw className={["size-4", loading ? "animate-spin" : ""].join(" ")} strokeWidth={1.75} />
            Atualizar
          </button>
        </div>
      </header>

      <div className="sidebar-scroll flex-1 overflow-y-auto px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-[1400px] space-y-6">
          <MediaUploader uploading={uploading} onFiles={onUpload} />

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={[
                  "rounded-lg border px-4 py-2.5 text-xs font-medium transition",
                  filter === f.id
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-white/10 text-zinc-400 hover:text-white"
                ].join(" ")}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar mídia por nome…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-white outline-none focus:border-emerald-500/40"
            />
          </div>

          <p className="text-xs text-zinc-600">
            {filtered.length} {filtered.length === 1 ? "ficheiro" : "ficheiros"}
          </p>

          <MediaGrid
            files={filtered}
            variant="library"
            onCopyUrl={onCopyUrl}
            onDelete={handleDelete}
            deletingUrl={deletingUrl}
            emptyMessage="Nenhuma mídia na biblioteca. Usa o botão acima para enviar ficheiros."
          />
        </div>
      </div>
    </div>
  );
}
