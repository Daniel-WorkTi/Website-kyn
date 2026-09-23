"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

type GalleryMediaPosterProps = {
  posterUrl?: string;
  uploading?: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
};

export function GalleryMediaPoster({
  posterUrl,
  uploading,
  onUpload,
  onRemove
}: GalleryMediaPosterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const loading = uploading || busy;

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
        Capa
      </p>
      <div className="flex items-center gap-3">
        <div className="size-14 shrink-0 overflow-hidden rounded-md border border-white/[0.08] bg-zinc-950">
          {posterUrl ? (
            <img src={posterUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-700">
              <ImagePlus className="size-4" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.heic,.heif"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setBusy(true);
              void onUpload(file).finally(() => setBusy(false));
            }}
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-zinc-300 transition hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40 disabled:opacity-50"
          >
            {loading ? "A enviar…" : posterUrl ? "Alterar capa" : "Definir capa"}
          </button>
          {posterUrl ? (
            <button
              type="button"
              onClick={onRemove}
              aria-label="Remover poster"
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-500 transition hover:border-red-500/20 hover:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
            >
              <Trash2 className="size-3" strokeWidth={1.75} />
              Remover
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
