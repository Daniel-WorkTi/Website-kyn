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
  if (item.type === "video") {
    return (
      <video
        className={videoClassName ?? className}
        src={item.src}
        autoPlay={autoplay}
        muted
        loop={autoplay}
        playsInline
        preload="auto"
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
