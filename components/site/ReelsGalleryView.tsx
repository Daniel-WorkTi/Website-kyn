"use client";

import MediaItem from "@/components/site/MediaItem";
import PageHeading from "@/components/site/PageHeading";
import { useLightbox } from "@/components/site/Lightbox";
import type { GalleryJson } from "@/lib/types";
import { normalizeGalleryItem } from "@/lib/gallery-utils";

interface ReelsGalleryViewProps {
  data: GalleryJson;
}

export default function ReelsGalleryView({ data }: ReelsGalleryViewProps) {
  const { open } = useLightbox();
  const items = (data.items || []).map((item) => normalizeGalleryItem(item, "Aftermovie"));

  return (
    <>
      <PageHeading title={data.title} />

      <div className="reels-gallery">
        {items.map((item, i) => (
          <div
            key={`reel-${item.src}-${i}`}
            className="reels-gallery__tile"
            style={{ animationDelay: `${i * 70}ms` }}
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
            <MediaItem item={item} />
          </div>
        ))}
      </div>

      {data.note && <p className="placeholder-note section">{data.note}</p>}
    </>
  );
}
