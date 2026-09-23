"use client";

import { useEffect, useRef, useState } from "react";
import {
  canHoverFine,
  pauseHoverPreview,
  playHoverPreview,
  prefersReducedMotion,
  setPlayingListener,
} from "@/lib/media/hover-video";

type GalleryMediaPreviewProps = {
  src: string;
  type: "image" | "video";
  poster?: string;
  title: string;
  onReplace: () => void;
};

export function GalleryMediaPreview({
  src,
  type,
  poster,
  title,
  onReplace,
}: GalleryMediaPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const hasPoster = Boolean(poster);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || type !== "video") return;
    setPlayingListener(video, setPlaying);
    return () => {
      setPlayingListener(video, null);
      pauseHoverPreview(video);
    };
  }, [type, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || type !== "video" || hasPoster) return;
    let cancelled = false;
    const timeouts: number[] = [];

    const freeze = async () => {
      try {
        video.preload = "metadata";
        await new Promise<void>((resolve) => {
          if (video.readyState >= 1) {
            resolve();
            return;
          }
          const onMeta = () => resolve();
          video.addEventListener("loadedmetadata", onMeta, { once: true });
          timeouts.push(
            window.setTimeout(() => {
              video.removeEventListener("loadedmetadata", onMeta);
              resolve();
            }, 1500)
          );
        });
        if (cancelled) return;
        const dur = Number.isFinite(video.duration) ? video.duration : 0.5;
        const t = Math.min(0.5, Math.max(0, dur - 0.05));
        await new Promise<void>((resolve) => {
          const onSeeked = () => resolve();
          video.addEventListener("seeked", onSeeked, { once: true });
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
        if (!cancelled) video.pause();
      } catch {
        /* */
      }
    };
    void freeze();
    return () => {
      cancelled = true;
      for (const id of timeouts) window.clearTimeout(id);
    };
  }, [type, src, hasPoster]);

  const onEnter = () => {
    const video = videoRef.current;
    if (!video || type !== "video") return;
    if (prefersReducedMotion() || !canHoverFine()) return;
    void playHoverPreview(video);
  };

  const onLeave = () => {
    const video = videoRef.current;
    if (!video) return;
    pauseHoverPreview(video);
  };

  return (
    <button
      type="button"
      onClick={onReplace}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onReplace();
        }
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      aria-label={`Substituir ${title}`}
      className="group relative block w-full overflow-hidden bg-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
    >
      <div className={`media-video aspect-video w-full${playing ? " is-playing" : ""}`}>
        {type === "video" ? (
          <>
            {hasPoster ? (
              <img
                className="media-video__poster"
                src={poster}
                alt=""
                draggable={false}
              />
            ) : null}
            <video
              ref={videoRef}
              src={src}
              className="media-video__el"
              muted
              loop
              playsInline
              preload={hasPoster ? "none" : "metadata"}
            />
          </>
        ) : (
          <img src={src} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <span className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 text-xs font-medium tracking-wide text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
        Substituir
      </span>
    </button>
  );
}
