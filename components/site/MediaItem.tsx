"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MediaItem as MediaItemType } from "@/lib/types";

interface MediaItemProps {
  item: MediaItemType;
  className?: string;
  videoClassName?: string;
  autoplay?: boolean;
}

export default function MediaItem({
  item,
  className,
  videoClassName,
  autoplay = item.type === "video",
}: MediaItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const syncPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || item.type !== "video") return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    if (autoplay) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [autoplay, item.type]);

  useEffect(() => {
    syncPlayback();
  }, [syncPlayback, item.src]);

  if (item.type === "video") {
    return (
      <video
        ref={videoRef}
        className={videoClassName ?? className}
        src={item.src}
        autoPlay={autoplay}
        muted
        loop
        playsInline
        preload="auto"
        onLoadedData={syncPlayback}
        onCanPlay={syncPlayback}
      />
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
