"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import type { GalleryItem, MediaFile } from "@/lib/admin/sections";
import { galleryItemKey } from "@/lib/gallery-utils";
import { GalleryMediaCard } from "./GalleryMediaCard";

type GallerySortableSectionProps = {
  items: GalleryItem[];
  allItems: GalleryItem[];
  mediaLibrary: MediaFile[];
  showFeatured?: boolean;
  layout?: "stack" | "main-row";
  onReorder: (nextAll: GalleryItem[]) => void;
  onItemChange: (indexInAll: number, item: GalleryItem) => void;
  onRemove: (indexInAll: number) => void;
  onReplace: (indexInAll: number) => void;
  onPosterUpload: (indexInAll: number, file: File) => Promise<void>;
  posterUploadingIndex?: number | null;
  /** Badge por índice local (ex.: primeiros 2 = "Topo"). */
  badgeForIndex?: (localIndex: number) => string | undefined;
};

export function GallerySortableSection({
  items,
  allItems,
  mediaLibrary,
  showFeatured,
  layout = "stack",
  onReorder,
  onItemChange,
  onRemove,
  onReplace,
  onPosterUpload,
  posterUploadingIndex,
  badgeForIndex
}: GallerySortableSectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = items.map((item) => {
    const idx = allItems.indexOf(item);
    return galleryItemKey(item, idx >= 0 ? idx : 0);
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldLocal = ids.indexOf(String(active.id));
    const newLocal = ids.indexOf(String(over.id));
    if (oldLocal < 0 || newLocal < 0) return;

    const reorderedLocal = arrayMove(items, oldLocal, newLocal);

    // Aplicar a reordenação local ao array global preservando itens fora desta secção
    const localSet = new Set(items);
    const next: GalleryItem[] = [];
    let localCursor = 0;
    for (const item of allItems) {
      if (localSet.has(item)) {
        next.push(reorderedLocal[localCursor++]);
      } else {
        next.push(item);
      }
    }
    onReorder(next);
  }

  if (!items.length) return null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div
          className={
            layout === "main-row"
              ? "grid gap-4 sm:grid-cols-2"
              : "space-y-4"
          }
        >
          {items.map((item, localIndex) => {
            const index = allItems.indexOf(item);
            const id = galleryItemKey(item, index);
            return (
              <GalleryMediaCard
                key={id}
                id={id}
                item={item}
                mediaLibrary={mediaLibrary}
                showFeatured={showFeatured}
                badge={badgeForIndex?.(localIndex)}
                onChange={(updated) => onItemChange(index, updated)}
                onRemove={() => onRemove(index)}
                onReplace={() => onReplace(index)}
                onPosterUpload={(file) => onPosterUpload(index, file)}
                posterUploading={posterUploadingIndex === index}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
