"use client";

import MediaItem from "@/components/site/MediaItem";
import { useLightbox } from "@/components/site/Lightbox";
import type { MediaItem as MediaItemType } from "@/lib/types";

interface HomeStackProps {
  items: MediaItemType[];
}

export default function HomeStack({ items }: HomeStackProps) {
  const { open } = useLightbox();

  return (
    <div className="stack">
      {items.map((item, i) => (
        <div
          key={`${item.src}-${i}`}
          className="stack__item"
          role="button"
          tabIndex={0}
          onClick={() => open(item)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              open(item);
            }
          }}
        >
          <MediaItem item={item} autoplay />
        </div>
      ))}
    </div>
  );
}
