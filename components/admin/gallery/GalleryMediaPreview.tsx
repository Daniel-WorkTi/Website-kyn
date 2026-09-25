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

  // Sem poster: não seek no mount — evita download pesado no first paint do admin.
  // Hover/lightbox cobrem o preview; preload fica none.

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
              preload="none"
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
