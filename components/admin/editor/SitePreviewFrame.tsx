"use client";

import { ExternalLink, RefreshCw } from "lucide-react";
import { useEditorStore } from "@/hooks/useEditorStore";

type SitePreviewFrameProps = {
  src: string;
  previewKey?: number;
  onRefresh?: () => void;
};

export function SitePreviewFrame({ src, previewKey = 0, onRefresh }: SitePreviewFrameProps) {
  const { devicePreview } = useEditorStore();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-black">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2 md:px-6">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Site original
        </span>
        <div className="flex items-center gap-1">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title="Atualizar site"
              className="flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
            >
              <RefreshCw className="size-3.5" strokeWidth={1.75} />
            </button>
          )}
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir site em nova janela"
            className="flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
          >
            <ExternalLink className="size-3.5" strokeWidth={1.75} />
          </a>
        </div>
      </div>

      <div className="sidebar-scroll flex min-h-0 flex-1 justify-center overflow-auto p-4 md:p-6">
        {devicePreview === "mobile" ? (
          <div className="h-full min-h-[640px] w-[390px] shrink-0 overflow-hidden rounded-[24px] border border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
            <iframe
              key={`${src}-${previewKey}-mobile`}
              src={src}
              title="Site original — mobile"
              className="h-full w-full border-0 bg-black"
            />
          </div>
        ) : (
          <div className="flex h-full min-h-0 w-full max-w-6xl flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
            <iframe
              key={`${src}-${previewKey}-desktop`}
              src={src}
              title="Site original — desktop"
              className="h-full w-full min-h-[640px] border-0 bg-black"
            />
          </div>
        )}
      </div>

      <p className="shrink-0 pb-3 text-center text-xs text-zinc-600">
        Pré-visualização do site público. Atualiza após guardar ou quando alterares o código do site.
      </p>
    </div>
  );
}
