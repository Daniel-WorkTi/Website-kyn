"use client";

import { Copy, Trash2 } from "lucide-react";
import type { MediaFile } from "@/lib/admin/sections";
import {
  formatDimensions,
  formatDuration,
  formatFileSize,
  formatMediaDate,
  mediaPlaybackUrl,
  mediaThumbnailUrl
} from "@/lib/admin/media-utils";

type MediaDetailsPanelProps = {
  file: MediaFile | null;
  onCopyUrl?: (url: string) => void;
  onDelete?: (file: MediaFile) => void;
  onUse?: (file: MediaFile) => void;
  deleting?: boolean;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right text-zinc-200">{value}</span>
    </div>
  );
}

export function MediaDetailsPanel({
  file,
  onCopyUrl,
  onDelete,
  onUse,
  deleting
}: MediaDetailsPanelProps) {
  if (!file) {
    return (
      <aside className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-zinc-500">
        Seleciona uma mídia para ver detalhes
      </aside>
    );
  }

  return (
    <aside className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="overflow-hidden rounded-lg border border-white/10 bg-black">
        <div className="aspect-video">
          {file.type === "video" ? (
            <video
              src={mediaPlaybackUrl(file)}
              poster={mediaThumbnailUrl(file)}
              controls
              playsInline
              className="h-full w-full object-contain"
            />
          ) : (
            <img
              src={mediaThumbnailUrl(file)}
              alt={file.name}
              className="h-full w-full object-contain"
            />
          )}
        </div>
      </div>

      <div className="space-y-2 border-b border-white/10 pb-4">
        <InfoRow label="Nome" value={file.name} />
        <InfoRow label="Tipo" value={file.type === "video" ? "Vídeo" : "Imagem"} />
        <InfoRow label="Tamanho" value={formatFileSize(file.size)} />
        <InfoRow label="Enviado em" value={formatMediaDate(file.createdAt)} />
        {file.type === "image" && <InfoRow label="Dimensão" value={formatDimensions(file)} />}
        {file.type === "video" && <InfoRow label="Duração" value={formatDuration(file.duration)} />}
      </div>

      <div className="flex flex-col gap-2">
        {onUse && (
          <button
            type="button"
            onClick={() => onUse(file)}
            className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400"
          >
            Usar esta mídia
          </button>
        )}
        {onCopyUrl && (
          <button
            type="button"
            onClick={() => onCopyUrl(file.url)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
          >
            <Copy className="size-4" strokeWidth={1.75} />
            Copiar URL
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(file)}
            disabled={deleting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 py-2.5 text-sm text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
          >
            <Trash2 className="size-4" strokeWidth={1.75} />
            {deleting ? "A remover…" : "Remover"}
          </button>
        )}
      </div>
    </aside>
  );
}
