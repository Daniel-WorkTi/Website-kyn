"use client";

import { useEffect, useRef, useState } from "react";
import {
  canHoverFine,
  pauseHoverPreview,
  playHoverPreview,
  prefersReducedMotion,
  setPlayingListener,
} from "@/lib/media/hover-video";
import {
  enqueueVideoIdleFreeze,
  freezeVideoAtIdleFrame,
} from "@/lib/media/video-idle-frame";

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
  title,
  onReplace,
}: GalleryMediaPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || type !== "video") return;
    setPlayingListener(video, setPlaying);
    return () => {
      setPlayingListener(video, null);
      pauseHoverPreview(video);
    };
  }, [type, src]);

  // Capa automática = freeze aos ~3s (mesmo regra do site).
  useEffect(() => {
    const video = videoRef.current;
    const root = rootRef.current;
    if (!video || !root || type !== "video") return;

    let cancelled = false;
    let started = false;
    setReady(false);

    const run = () =>
      enqueueVideoIdleFreeze(async () => {
        if (cancelled) return;
        await freezeVideoAtIdleFrame(video);
        if (!cancelled) setReady(true);
      });

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting) || started || cancelled) return;
          started = true;
          observer?.disconnect();
          void run();
        },
        { rootMargin: "120px 0px", threshold: 0.01 }
      );
      observer.observe(root);
    } else {
      void run();
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [type, src]);

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
      <div
        ref={rootRef}
        className={`media-video media-video--freeze-cover aspect-video w-full${playing ? " is-playing" : ""}${ready ? " is-ready" : ""}`}
      >
        {type === "video" ? (
          <video
            ref={videoRef}
            src={src}
            className="media-video__el"
            muted
            loop
            playsInline
            preload="none"
          />
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
