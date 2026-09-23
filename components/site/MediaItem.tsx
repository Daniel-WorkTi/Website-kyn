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

const POSTER_FALLBACK_TIME = 0.5;

export default function MediaItem({
  item,
  className,
  videoClassName,
}: MediaItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
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

  // Vídeos antigos sem thumbnail: freeze no frame 0.5s (sem play)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || item.type !== "video" || hasPoster) return;

    let cancelled = false;
    const timeouts: number[] = [];
    const clearTimers = () => {
      for (const id of timeouts) window.clearTimeout(id);
      timeouts.length = 0;
    };

    const freezeAtPosterTime = async () => {
      try {
        video.preload = "metadata";
        if (video.readyState < 1) {
          await new Promise<void>((resolve, reject) => {
            const ok = () => {
              cleanup();
              resolve();
            };
            const fail = () => {
              cleanup();
              reject(new Error("meta"));
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
              }, 1500)
            );
          });
        }
        if (cancelled) return;
        const dur = Number.isFinite(video.duration) ? video.duration : POSTER_FALLBACK_TIME;
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
            }, 800)
          );
        });
        if (!cancelled) {
          video.pause();
        }
      } catch {
        /* sem poster e sem freeze — fica preto até hover/lightbox */
      }
    };

    void freezeAtPosterTime();
    return () => {
      cancelled = true;
      clearTimers();
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
        className={["media-video", playing ? "is-playing" : "", className]
          .filter(Boolean)
          .join(" ")}
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
          preload={hasPoster ? "none" : "metadata"}
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
