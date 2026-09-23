"use client";

import MediaItem from "@/components/site/MediaItem";
import PageHeading from "@/components/site/PageHeading";
import { useLightbox } from "@/components/site/Lightbox";
import type { GalleryJson } from "@/lib/types";
import { normalizeGalleryItem } from "@/lib/gallery-utils";

interface MulticamGalleryViewProps {
  data: GalleryJson;
}

export default function MulticamGalleryView({ data }: MulticamGalleryViewProps) {
  const { open } = useLightbox();
  const items = (data.items || []).map((item) => normalizeGalleryItem(item, "Multicam"));

  return (
    <>
      <PageHeading title={data.title} />

      <div className="multicam-gallery">
        {items.map((item, i) => (
          <div
            key={`multicam-${item.src}-${i}`}
            className="multicam-gallery__tile"
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
