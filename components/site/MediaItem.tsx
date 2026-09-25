"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { MediaItem as MediaItemType } from "@/lib/types";
import {
  canHoverFine,
  pauseHoverPreview,
  playHoverPreview,
  prefersReducedMotion,
  setPlayingListener,
} from "@/lib/media/hover-video";

interface MediaItemProps {
  item: MediaItemType;
  className?: string;
  videoClassName?: string;
  /**
   * @deprecated Autoplay desactivado — ignorado.
   */
  autoplay?: boolean;
}

/** Vídeos sem thumbnail: frame idle um pouco à frente (início costuma ser preto). */
const POSTER_FALLBACK_TIME = 2.5;

/** No máximo 1 seek/metadata de fallback de cada vez — evita tempestade no first paint. */
let freezeQueue: Promise<void> = Promise.resolve();
function enqueueFreeze(task: () => Promise<void>): Promise<void> {
  const run = freezeQueue.then(task, task);
  freezeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export default function MediaItem({
  item,
  className,
  videoClassName,
}: MediaItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  /** Evita tile colapsado a preto antes do metadata (só sem poster). */
  const [aspectRatio, setAspectRatio] = useState<string | undefined>(
    item.poster ? undefined : "16 / 9"
  );
  const reactId = useId();

  const hasPoster = Boolean(item.poster);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || item.type !== "video") return;

    setPlayingListener(video, setPlaying);
    return () => {
      setPlayingListener(video, null);
      pauseHoverPreview(video);
    };
  }, [item.type, item.src]);

  // Vídeos antigos sem thumbnail: freeze só quando o tile entra no viewport
  // (nunca no mount de todos de uma vez — isso bloqueava a página).
  useEffect(() => {
    const video = videoRef.current;
    const root = rootRef.current;
    if (!video || !root || item.type !== "video" || hasPoster) return;

    let cancelled = false;
    let started = false;
    const timeouts: number[] = [];
    const clearTimers = () => {
      for (const id of timeouts) window.clearTimeout(id);
      timeouts.length = 0;
    };

    const freezeAtPosterTime = () =>
      enqueueFreeze(async () => {
        if (cancelled) return;
        try {
          // Força o browser a ir buscar metadata só agora
          if (video.preload !== "metadata") {
            video.preload = "metadata";
          }
          try {
            video.load();
          } catch {
            /* ignore */
          }

          if (video.readyState < 1) {
            await new Promise<void>((resolve) => {
              const ok = () => {
                cleanup();
                resolve();
              };
              const fail = () => {
                cleanup();
                resolve();
              };
              const cleanup = () => {
                video.removeEventListener("loadedmetadata", ok);
                video.removeEventListener("error", fail);
              };
              video.addEventListener("loadedmetadata", ok);
              video.addEventListener("error", fail);
              timeouts.push(
                window.setTimeout(() => {
                  cleanup();
                  resolve();
                }, 2000)
              );
            });
          }
          if (cancelled) return;

          const dur = Number.isFinite(video.duration)
            ? video.duration
            : POSTER_FALLBACK_TIME;
          const t = Math.min(POSTER_FALLBACK_TIME, Math.max(0, dur - 0.05));
          await new Promise<void>((resolve) => {
            const onSeeked = () => {
              video.removeEventListener("seeked", onSeeked);
              resolve();
            };
            video.addEventListener("seeked", onSeeked);
            try {
              video.currentTime = t;
            } catch {
              resolve();
              return;
            }
            timeouts.push(
              window.setTimeout(() => {
                video.removeEventListener("seeked", onSeeked);
                resolve();
              }, 1200)
            );
          });
          if (!cancelled) {
            video.pause();
            // Volta a none para não continuar a bufferizar em background
            video.preload = "none";
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              setAspectRatio(`${video.videoWidth} / ${video.videoHeight}`);
            }
          }
        } catch {
          /* sem freeze — fica preto até hover/lightbox */
        }
      });

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.some((e) => e.isIntersecting);
          if (!visible || started || cancelled) return;
          started = true;
          observer?.disconnect();
          void freezeAtPosterTime();
        },
        { rootMargin: "120px 0px", threshold: 0.01 }
      );
      observer.observe(root);
    } else {
      void freezeAtPosterTime();
    }

    return () => {
      cancelled = true;
      clearTimers();
      observer?.disconnect();
    };
  }, [item.type, item.src, hasPoster]);

  const startPreview = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (prefersReducedMotion()) return;
    void playHoverPreview(video);
  }, []);

  const stopPreview = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    pauseHoverPreview(video);
  }, []);

  if (item.type === "video") {
    const mime = (() => {
      const path = item.src.split("?")[0].split("#")[0];
      const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
      if (ext === ".webm") return "video/webm";
      if (ext === ".mov") return "video/quicktime";
      return "video/mp4";
    })();

    const onEnter = () => {
      if (!canHoverFine()) return;
      startPreview();
    };

    return (
      <div
        ref={rootRef}
        className={["media-video", playing ? "is-playing" : "", className]
          .filter(Boolean)
          .join(" ")}
        style={
          !hasPoster && aspectRatio
            ? { aspectRatio }
            : undefined
        }
        onMouseEnter={onEnter}
        onMouseLeave={stopPreview}
        onFocus={onEnter}
        onBlur={stopPreview}
      >
        {hasPoster ? (
          <img
            className="media-video__poster"
            src={item.poster}
            alt={item.alt || ""}
            loading="lazy"
            draggable={false}
          />
        ) : null}
        <video
          ref={videoRef}
          id={`media-video-${reactId}`}
          className={["media-video__el", videoClassName].filter(Boolean).join(" ")}
          muted
          loop
          playsInline
          preload="none"
          // Sem atributo poster nativo — usamos <img> overlay para evitar flash preto
          aria-label={item.alt || "Vídeo"}
        >
          <source src={item.src} type={mime} />
        </video>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={item.src}
      alt={item.alt || ""}
      loading="lazy"
    />
  );
}
