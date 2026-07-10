"use client";

import MediaItem from "@/components/site/MediaItem";
import PageHeading from "@/components/site/PageHeading";
import { useLightbox } from "@/components/site/Lightbox";
import type { GalleryJson, MediaItem as MediaItemType } from "@/lib/types";
import { normalizeGalleryItem } from "@/lib/gallery-utils";

interface StudioGalleryViewProps {
  data: GalleryJson;
}

function MediaTile({
  item,
  className,
  onOpen
}: {
  item: MediaItemType;
  className?: string;
  onOpen: (item: MediaItemType) => void;
}) {
  return (
    <div
      className={["studio-gallery__tile", className].filter(Boolean).join(" ")}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(item);
        }
      }}
    >
      <MediaItem item={item} autoplay={item.type === "video"} />
    </div>
  );
}

export default function StudioGalleryView({ data }: StudioGalleryViewProps) {
  const { open } = useLightbox();
  const items = (data.items || []).map((item) => normalizeGalleryItem(item));
  const videos = items.filter((i) => i.type === "video");
  const images = items.filter((i) => i.type === "image");
  const topVideos = videos.slice(0, 2);
  const masonryItems = [...videos.slice(2), ...images];

  return (
    <>
      <PageHeading title={data.title} />

      {topVideos.length > 0 && (
        <div className={`studio-gallery__videos studio-gallery__videos--${Math.min(topVideos.length, 2)}`}>
          {topVideos.map((item, i) => (
            <MediaTile
              key={`video-${item.src}-${i}`}
              item={item}
              className="studio-gallery__tile--video"
              onOpen={open}
            />
          ))}
        </div>
      )}

      {masonryItems.length > 0 && (
        <div className="studio-gallery__masonry">
          {masonryItems.map((item, i) => (
            <MediaTile
              key={`tile-${item.src}-${i}`}
              item={item}
              className={`studio-gallery__tile--${(i % 6) + 1}`}
              onOpen={open}
            />
          ))}
        </div>
      )}

      {data.note && <p className="placeholder-note section">{data.note}</p>}
    </>
  );
}
