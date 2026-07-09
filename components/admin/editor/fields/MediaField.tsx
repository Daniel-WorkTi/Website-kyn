"use client";

import { ImageIcon, Video } from "lucide-react";

type MediaFieldProps = {
  label: string;
  src: string;
  type?: "image" | "video";
  onReplace?: () => void;
  onRemove?: () => void;
};

export function MediaField({ label, src, type = "image", onReplace, onRemove }: MediaFieldProps) {
  const isVideo = type === "video";

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
        <div className="relative aspect-video w-full bg-zinc-900">
          {src ? (
            isVideo ? (
              <video src={src} className="h-full w-full object-cover" muted playsInline />
            ) : (
              <img src={src} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-600">
              {isVideo ? <Video className="size-8" strokeWidth={1.5} /> : <ImageIcon className="size-8" strokeWidth={1.5} />}
              <span className="text-xs">Sem ficheiro</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {onReplace && (
          <button
            type="button"
            onClick={onReplace}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
          >
            Substituir {isVideo ? "vídeo" : "imagem"}
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300 transition hover:bg-red-500/15"
          >
            Remover
          </button>
        )}
      </div>
    </div>
  );
}
