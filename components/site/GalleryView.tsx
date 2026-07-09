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
  const featured = (data.items || []).filter((i) => i.featured);
  const rest = (data.items || []).filter((i) => !i.featured);

  return (
    <>
      <PageHeading title={data.title} />

      {featured.length > 0 && (
        <div className="stack">
          {featured.map((item, i) => (
            <div
              key={`featured-${item.src}-${i}`}
              className="stack__item stack__item--viewport"
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

      {rest.length > 0 && (
        <div className="supd-grid">
          {rest.map((item, i) => (
            <div
              key={`grid-${item.src}-${i}`}
              className="supd-grid__cell"
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
