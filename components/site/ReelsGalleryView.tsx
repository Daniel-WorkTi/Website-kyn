"use client";

import { useEffect, useRef, useState } from "react";
import MediaItem from "@/components/site/MediaItem";
import PageHeading from "@/components/site/PageHeading";
import { useLightbox } from "@/components/site/Lightbox";
import type { GalleryJson } from "@/lib/types";
import { normalizeGalleryItem } from "@/lib/gallery-utils";
import type { GalleryItem } from "@/lib/admin/sections";

interface ReelsGalleryViewProps {
  data: GalleryJson;
}

function ReelTile({
  item,
  index,
  onOpen
}: {
  item: GalleryItem;
  index: number;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "80px", threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="reels-gallery__tile"
      style={{ animationDelay: `${index * 70}ms` }}
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

export default function ReelsGalleryView({ data }: ReelsGalleryViewProps) {
  const { open } = useLightbox();
  const items = (data.items || []).map((item) => normalizeGalleryItem(item, "Aftermovie"));

  return (
    <>
      <PageHeading title={data.title} />

      <div className="reels-gallery">
        {items.map((item, i) => (
          <ReelTile key={`reel-${item.src}-${i}`} item={item} index={i} onOpen={() => open(item)} />
        ))}
      </div>

      {data.note && <p className="placeholder-note section">{data.note}</p>}
    </>
  );
}
