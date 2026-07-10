"use client";

import { useEffect, useRef, useState } from "react";
import MediaItem from "@/components/site/MediaItem";
import PageHeading from "@/components/site/PageHeading";
import { useLightbox } from "@/components/site/Lightbox";
import type { GalleryJson } from "@/lib/types";
import { normalizeGalleryItem } from "@/lib/gallery-utils";
import type { GalleryItem } from "@/lib/admin/sections";

interface MulticamGalleryViewProps {
  data: GalleryJson;
}

function MulticamTile({
  item,
  onOpen
}: {
  item: GalleryItem;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "80px", threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="multicam-gallery__tile"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <MediaItem item={item} autoplay={inView && item.type === "video"} />
    </div>
  );
}

export default function MulticamGalleryView({ data }: MulticamGalleryViewProps) {
  const { open } = useLightbox();
  const items = (data.items || []).map((item) => normalizeGalleryItem(item, "Multicam"));

  return (
    <>
      <PageHeading title={data.title} />

      <div className="multicam-gallery">
        {items.map((item, i) => (
          <MulticamTile key={`multicam-${item.src}-${i}`} item={item} onOpen={() => open(item)} />
        ))}
      </div>

      {data.note && <p className="placeholder-note section">{data.note}</p>}
    </>
  );
}
