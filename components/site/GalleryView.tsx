"use client";

import MediaItem from "@/components/site/MediaItem";
import PageHeading from "@/components/site/PageHeading";
import { useLightbox } from "@/components/site/Lightbox";
import type { GalleryJson } from "@/lib/types";

interface GalleryViewProps {
  data: GalleryJson;
}

export default function GalleryView({ data }: GalleryViewProps) {
  const { open } = useLightbox();
  const items = data.items || [];

  return (
    <>
      <PageHeading title={data.title} />

      {items.length > 0 && (
        <div className="supd-grid">
          {items.map((item, i) => (
            <div
              key={`grid-${item.src}-${i}`}
              className={`supd-grid__cell${item.featured ? " supd-grid__cell--wide" : ""}`}
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
              <MediaItem item={item} autoplay={item.type === "video"} />
            </div>
          ))}
        </div>
      )}

      {data.note && <p className="placeholder-note section">{data.note}</p>}
    </>
  );
}
