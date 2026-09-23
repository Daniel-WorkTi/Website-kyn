"use client";

import { useRef } from "react";
import type { MediaItem as MediaItemType } from "@/lib/types";
import {
  canHoverFine,
  pauseHoverPreview,
  playHoverPreview,
  prefersReducedMotion,
} from "@/lib/media/hover-video";

interface MediaItemProps {
  item: MediaItemType;
  className?: string;
  videoClassName?: string;
  /**
   * @deprecated Autoplay desactivado por política CMS.
   * Mantido só para compatibilidade de props — ignorado.
   */
  autoplay?: boolean;
}

export default function MediaItem({
  item,
  className,
  videoClassName,
}: MediaItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  if (item.type === "video") {
    const mime = (() => {
      const path = item.src.split("?")[0].split("#")[0];
      const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
      if (ext === ".webm") return "video/webm";
      if (ext === ".mov") return "video/quicktime";
      return "video/mp4";
    })();

    const onEnter = () => {
      const video = videoRef.current;
      if (!video) return;
      if (prefersReducedMotion() || !canHoverFine()) return;
      void playHoverPreview(video);
    };

    const onLeave = () => {
      const video = videoRef.current;
      if (!video) return;
      pauseHoverPreview(video);
    };

    return (
      <video
        ref={videoRef}
        className={videoClassName ?? className}
        poster={item.poster || undefined}
        muted
        loop
        playsInline
        preload="none"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={onEnter}
        onBlur={onLeave}
      >
        <source src={item.src} type={mime} />
      </video>
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
