"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Film, ImageIcon, Loader2, Play, Trash2 } from "lucide-react";
import type { MediaFile } from "@/lib/admin/sections";
import {
  formatDimensions,
  formatDuration,
  formatFileSize,
  formatMediaDate,
  mediaPlaybackUrl,
  mediaThumbnailUrl
} from "@/lib/admin/media-utils";

type MediaCardProps = {
  file: MediaFile;
  variant?: "default" | "library";
  selected?: boolean;
  deleting?: boolean;
  onClick?: () => void;
  onSelect?: () => void;
  onCopyUrl?: (url: string) => void;
  onDelete?: () => void;
  selectable?: boolean;
};

function isRasterImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.includes("res.cloudinary.com") && url.includes("/image/")) return true;
  if (url.includes("res.cloudinary.com") && /\/video\/upload\/.*\.(jpe?g|png|webp)/i.test(url)) {
    return true;
  }
  return /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url);
}

export function MediaCard({
  file,
  variant = "default",
  selected,
  deleting,
  onClick,
  onSelect,
  onCopyUrl,
  onDelete,
  selectable
}: MediaCardProps) {
  const isLibrary = variant === "library";
  const thumbUrl = mediaThumbnailUrl(file);
  const videoUrl = file.type === "video" ? mediaPlaybackUrl(file) : null;
  const hasImagePoster = file.type === "video" && isRasterImageUrl(thumbUrl);
  const [imgSrc, setImgSrc] = useState(hasImagePoster ? thumbUrl : "");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const next = mediaThumbnailUrl(file);
    setImgSrc(isRasterImageUrl(next) ? next : "");
  }, [file.url, file.publicId, file.type]);

  const handleClick = () => {
    if (selectable && onSelect) onSelect();
    else onClick?.();
  };

  const previewClass = isLibrary
    ? "aspect-[16/10] min-h-[200px] sm:min-h-[240px]"
    : "aspect-square";

  return (
    <article
      className={[
        "group overflow-hidden rounded-2xl border bg-black/40 text-left transition",
        selected
          ? "border-emerald-500/50 ring-2 ring-emerald-500/30"
          : "border-white/10 hover:border-white/20"
      ].join(" ")}
    >
      <button
        type="button"
        onClick={handleClick}
        className="relative block w-full overflow-hidden"
        disabled={selectable ? false : undefined}
      >
        <div className={["relative w-full bg-zinc-900", previewClass].join(" ")}>
          {file.type === "video" ? (
            <>
              {/* Capa = primeiro frame (metadata). Sem <img> na URL do .webm/.mp4. */}
              {hasImagePoster && imgSrc ? (
                <img
                  src={imgSrc}
                  alt={file.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={() => setImgSrc("")}
                />
              ) : null}
              <video
                ref={videoRef}
                src={videoUrl ?? file.url}
                muted
                playsInline
                preload="metadata"
                className={[
                  "absolute inset-0 h-full w-full object-cover transition",
                  hasImagePoster && imgSrc
                    ? "opacity-0 group-hover:opacity-100"
                    : "opacity-100"
                ].join(" ")}
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  // Força paint do first frame
                  try {
                    if (v.currentTime < 0.05) v.currentTime = 0.1;
                  } catch {
                    /* ignore seek errors */
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.play().catch(() => {});
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.pause();
                  e.currentTarget.currentTime = 0.1;
                }}
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-black/55 text-white shadow-lg transition group-hover:scale-105 group-hover:opacity-0">
                  <Play className="ml-0.5 size-5" fill="currentColor" strokeWidth={0} />
                </span>
              </span>
            </>
          ) : (
            <img
              src={imgSrc || thumbUrl}
              alt={file.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => {
                if (imgSrc !== file.url) setImgSrc(file.url);
              }}
            />
          )}
        </div>
      </button>

      <div className={["border-t border-white/10", isLibrary ? "p-4" : "p-2"].join(" ")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className={[
                "truncate font-medium text-white",
                isLibrary ? "text-sm" : "text-xs"
              ].join(" ")}
            >
              {file.name}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-500">
              <span className="inline-flex items-center gap-1">
                {file.type === "video" ? (
                  <Film className="size-3" strokeWidth={1.75} />
                ) : (
                  <ImageIcon className="size-3" strokeWidth={1.75} />
                )}
                {file.type === "video" ? "Vídeo" : "Imagem"}
              </span>
              {isLibrary && (
                <>
                  <span>·</span>
                  <span>{formatFileSize(file.size)}</span>
                  {file.type === "image" && file.width && file.height && (
                    <>
                      <span>·</span>
                      <span>{formatDimensions(file)}</span>
                    </>
                  )}
                  {file.type === "video" && file.duration != null && file.duration > 0 && (
                    <>
                      <span>·</span>
                      <span>{formatDuration(file.duration)}</span>
                    </>
                  )}
                  {file.createdAt && (
                    <>
                      <span>·</span>
                      <span>{formatMediaDate(file.createdAt)}</span>
                    </>
                  )}
                </>
              )}
            </p>
          </div>

          {isLibrary && (onCopyUrl || onDelete) && (
            <div className="flex shrink-0 items-center gap-1">
              {onCopyUrl && (
                <button
                  type="button"
                  title="Copiar URL"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyUrl(file.url);
                  }}
                  className="flex size-9 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <Copy className="size-4" strokeWidth={1.75} />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  title="Remover"
                  disabled={deleting}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="flex size-9 items-center justify-center rounded-lg border border-red-500/20 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
                  ) : (
                    <Trash2 className="size-4" strokeWidth={1.75} />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
