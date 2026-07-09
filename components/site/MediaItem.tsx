import type { MediaItem as MediaItemType } from "@/lib/types";
import { videoMimeType } from "@/lib/utils";

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
  autoplay = false,
}: MediaItemProps) {
  if (item.type === "video") {
    return (
      <video
        className={videoClassName ?? className}
        autoPlay={autoplay}
        muted
        loop={autoplay}
        playsInline
        poster={item.poster || undefined}
      >
        <source src={item.src} type={videoMimeType(item.src)} />
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
