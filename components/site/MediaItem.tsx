"use client";

import { useCallback, useEffect, useId, useRef, useState, type MouseEvent } from "react";
import type { MediaItem as MediaItemType } from "@/lib/types";
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

interface MediaItemProps {
  item: MediaItemType;
  className?: string;
  videoClassName?: string;
  /**
   * @deprecated Autoplay desactivado — ignorado.
   */
  autoplay?: boolean;
}

export default function MediaItem({
  item,
  className,
  videoClassName,
}: MediaItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const reactId = useId();

  useEffect(() => {
    const video = videoRef.current;
    if (!video || item.type !== "video") return;

    setPlayingListener(video, setPlaying);
    return () => {
      setPlayingListener(video, null);
      pauseHoverPreview(video);
    };
  }, [item.type, item.src]);

  // Capa = freeze ~3s. Ratio = intrínseco do <video> (sem caixa artificial).
  useEffect(() => {
    const video = videoRef.current;
    const root = rootRef.current;
    if (!video || !root || item.type !== "video") return;

    let cancelled = false;
    let started = false;
    setReady(false);

    const runFreeze = () =>
      enqueueVideoIdleFreeze(async () => {
        if (cancelled) return;
        await freezeVideoAtIdleFrame(video);
        if (!cancelled) setReady(true);
      });

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.some((e) => e.isIntersecting);
          if (!visible || started || cancelled) return;
          started = true;
          observer?.disconnect();
          void runFreeze();
        },
        { rootMargin: "200px 0px", threshold: 0.01 }
      );
      observer.observe(root);
    } else {
      void runFreeze();
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [item.type, item.src]);

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

    const onPlayClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startPreview();
    };

    return (
      <div
        ref={rootRef}
        className={[
          "media-video",
          "media-video--freeze-cover",
          playing ? "is-playing" : "",
          ready ? "is-ready" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        onMouseEnter={onEnter}
        onMouseLeave={stopPreview}
        onFocus={onEnter}
        onBlur={stopPreview}
      >
        <video
          ref={videoRef}
          id={`media-video-${reactId}`}
          className={["media-video__el", videoClassName].filter(Boolean).join(" ")}
          muted
          loop
          playsInline
          preload="none"
          controls={false}
          disablePictureInPicture
          aria-label={item.alt || "Vídeo"}
        >
          <source src={item.src} type={mime} />
        </video>
        {!playing ? (
          <button
            type="button"
            className="media-video__play"
            aria-label="Reproduzir vídeo"
            onClick={onPlayClick}
          >
            <img src="/brand/video-play.png" alt="" draggable={false} />
          </button>
        ) : null}
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
