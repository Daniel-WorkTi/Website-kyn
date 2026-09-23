"use client";

import { useState } from "react";
import { FolderOpen } from "lucide-react";
import type { SidebarSectionId } from "@/components/admin/AdminSidebar";
import { GallerySortableSection } from "@/components/admin/gallery/GallerySortableSection";
import { MediaPickerModal } from "@/components/admin/media/MediaPickerModal";
import { DropZone } from "@/components/admin/shared/DropZone";
import {
  EmptyState,
  FieldLabel,
  SectionBlock,
  TextArea,
  TextInput
} from "@/components/admin/shared/MediaLibrary";
import { prepareFileForUpload } from "@/lib/admin/prepare-upload";
import type { GalleryData, GalleryItem, MediaFile } from "@/lib/admin/sections";
import { uploadPosterFile } from "@/lib/cms/upload";
import {
  createGalleryItemFromLibrary,
  createGalleryItemFromUpload,
  formatHumanTitle,
  normalizeGalleryItem,
  prepareGalleryForSection,
  sortStudioGalleryItems
} from "@/lib/gallery-utils";

type EditorCommonProps = {
  onDirty: () => void;
  processUpload: (
    file: File,
    onSuccess: (url: string, file: File) => void,
    options?: {
      markDirty?: boolean;
      refreshLibrary?: boolean;
      updateLibrary?: boolean;
      showSuccessToast?: boolean;
      successToast?: string;
    }
  ) => Promise<void>;
  showToast: (message: string, type?: "ok" | "error" | "pending") => void;
  mediaLibrary: MediaFile[];
  refreshMediaLibrary: () => Promise<void>;
  mediaLoading: boolean;
};

type GalleryEditorProps = EditorCommonProps & {
  sectionId: SidebarSectionId;
  data: GalleryData;
  onChange: (data: GalleryData) => void;
};

const LAYOUT_HINTS: Partial<Record<SidebarSectionId, string>> = {
  multicam:
    "Vídeos verticais (9:16) em 5 colunas. A ordem aqui é a ordem no site.",
  aftermovie: "Vídeos tipo Reels em 5 colunas. Arrasta para reordenar.",
  photography:
    "Fotos em grelha. Marca «Destaque» para ocupar largura total no site.",
  "fpv-drone": "Fotos e vídeos em grelha. Arrasta para reordenar.",
  "social-media": "Fotos e vídeos em grelha. Arrasta para reordenar."
};

const VIDEO_ONLY_SECTIONS = new Set<SidebarSectionId>(["multicam", "aftermovie"]);
const FEATURED_SECTIONS = new Set<SidebarSectionId>(["photography", "fpv-drone", "social-media"]);

type PickerMode =
  | { kind: "add" }
  | { kind: "replace"; index: number }
  | null;

export function GalleryEditor({
  sectionId,
  data,
  onChange,
  onDirty,
  processUpload,
  showToast,
  mediaLibrary,
  refreshMediaLibrary
}: GalleryEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [posterUploadingIndex, setPosterUploadingIndex] = useState<number | null>(null);
  const [picker, setPicker] = useState<PickerMode>(null);

  const isStudio = sectionId === "studio-space";
  const videoOnly = VIDEO_ONLY_SECTIONS.has(sectionId);
  const showFeatured = FEATURED_SECTIONS.has(sectionId);
  const items = data.items || [];
  const videos = items.filter((i) => i.type === "video");
  const images = items.filter((i) => i.type === "image");

  function commit(next: GalleryItem[]) {
    onChange(prepareGalleryForSection(sectionId, { ...data, items: next }));
    onDirty();
  }

  function commitStudioVideos(nextVideos: GalleryItem[]) {
    commit(sortStudioGalleryItems([...nextVideos, ...images]));
  }

  function commitStudioImages(nextImages: GalleryItem[]) {
    commit(sortStudioGalleryItems([...videos, ...nextImages]));
  }

  function applyPicked(file: MediaFile, replaceIndex?: number) {
    if (videoOnly && file.type !== "video") {
      showToast("Esta secção aceita apenas vídeos.", "error");
      return;
    }

    const created = createGalleryItemFromLibrary(
      file.url,
      file.type,
      sectionId,
      file.name,
      {
        size: file.size,
        width: file.width,
        height: file.height
      }
    );

    if (typeof replaceIndex === "number") {
      const prev = items[replaceIndex];
      const next = [...items];
      next[replaceIndex] = normalizeGalleryItem({
        ...created,
        alt: prev?.alt || "",
        featured: showFeatured ? prev?.featured ?? false : false,
        poster: created.type === "video" ? prev?.poster : undefined
      });
      commit(next);
    } else {
      commit([...items, created]);
    }
  }

  async function uploadAndApply(file: File, replaceIndex?: number): Promise<string | void> {
    if (
      videoOnly &&
      !file.type.startsWith("video/") &&
      !/\.(mp4|webm|mov|m4v)$/i.test(file.name)
    ) {
      showToast(`${file.name}: esta secção aceita apenas vídeos.`, "error");
      return;
    }

    setUploading(true);
    try {
      let uploadedUrl = "";
      await processUpload(
        file,
        (url, f) => {
          uploadedUrl = url;
          const created = createGalleryItemFromUpload(url, f, sectionId);
          if (typeof replaceIndex === "number") {
            const prev = items[replaceIndex];
            const next = [...items];
            next[replaceIndex] = normalizeGalleryItem({
              ...created,
              alt: prev?.alt || "",
              featured: showFeatured ? prev?.featured ?? false : false,
              poster: created.type === "video" ? prev?.poster : undefined
            });
            commit(next);
          } else {
            commit([...items, created]);
          }
        },
        { showSuccessToast: false, markDirty: false }
      );
      setPicker(null);
      await refreshMediaLibrary();
      return uploadedUrl;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro no envio.", "error");
      throw err;
    } finally {
      setUploading(false);
    }
  }

  async function handleDropFiles(files: File[]) {
    setUploading(true);
    let next = [...items];
    for (const file of files) {
      if (videoOnly && !file.type.startsWith("video/")) {
        showToast(`${file.name}: esta secção aceita apenas vídeos.`, "error");
        continue;
      }
      try {
        await processUpload(
          file,
          (url, f) => {
            next = [...next, createGalleryItemFromUpload(url, f, sectionId)];
            onChange(prepareGalleryForSection(sectionId, { ...data, items: next }));
          },
          { showSuccessToast: false }
        );
      } catch (err) {
        showToast(`${file.name}: ${err instanceof Error ? err.message : "Erro"}`, "error");
      }
    }
    onChange(prepareGalleryForSection(sectionId, { ...data, items: next }));
    onDirty();
    setUploading(false);
  }

  async function handlePosterUpload(index: number, file: File) {
    setPosterUploadingIndex(index);
    try {
      const prepared = await prepareFileForUpload(file, 2 * 1024 * 1024);
      const { url } = await uploadPosterFile(prepared, sectionId);
      const next = [...items];
      next[index] = { ...next[index], poster: url };
      commit(next);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao enviar poster.", "error");
    } finally {
      setPosterUploadingIndex(null);
    }
  }

  function handleRemove(index: number) {
    const label =
      items[index]?.title ||
      (items[index]?.type === "video" ? "este vídeo" : "esta imagem");
    if (
      !window.confirm(
        `Remover «${formatHumanTitle(label) || label}» desta galeria?\n\nO ficheiro permanece na biblioteca.`
      )
    ) {
      return;
    }
    commit(items.filter((_, i) => i !== index));
  }

  function scopeHandlers(
    scopeItems: GalleryItem[],
    onScopeReorder: (next: GalleryItem[]) => void
  ) {
    return {
      items: scopeItems,
      allItems: scopeItems,
      mediaLibrary,
      onReorder: onScopeReorder,
      onItemChange: (localIndex: number, item: GalleryItem) => {
        const globalIndex = items.indexOf(scopeItems[localIndex]);
        if (globalIndex < 0) return;
        const next = [...items];
        next[globalIndex] = normalizeGalleryItem(item);
        commit(next);
      },
      onRemove: (localIndex: number) => {
        const globalIndex = items.indexOf(scopeItems[localIndex]);
        if (globalIndex >= 0) handleRemove(globalIndex);
      },
      onReplace: (localIndex: number) => {
        const globalIndex = items.indexOf(scopeItems[localIndex]);
        if (globalIndex >= 0) setPicker({ kind: "replace", index: globalIndex });
      },
      onPosterUpload: async (localIndex: number, file: File) => {
        const globalIndex = items.indexOf(scopeItems[localIndex]);
        if (globalIndex >= 0) await handlePosterUpload(globalIndex, file);
      },
      posterUploadingIndex:
        posterUploadingIndex != null
          ? scopeItems.findIndex((_, i) => items.indexOf(scopeItems[i]) === posterUploadingIndex)
          : null
    };
  }

  const pickerFilter: "image" | "video" | "all" = videoOnly
    ? "video"
    : picker?.kind === "replace" && items[picker.index]
      ? items[picker.index].type
      : "all";

  const layoutHint = LAYOUT_HINTS[sectionId];

  return (
    <div className="space-y-8">
      <SectionBlock title="Informação da página">
        <div>
          <FieldLabel htmlFor="gallery-title">Título da página</FieldLabel>
          <TextInput
            id="gallery-title"
            value={data.title || ""}
            onChange={(value) => {
              onChange({ ...data, title: value });
              onDirty();
            }}
          />
        </div>
        <div>
          <FieldLabel htmlFor="gallery-note">Nota (opcional)</FieldLabel>
          <TextArea
            id="gallery-note"
            value={data.note || ""}
            onChange={(value) => {
              onChange({ ...data, note: value });
              onDirty();
            }}
            rows={2}
          />
        </div>
      </SectionBlock>

      {layoutHint ? (
        <p className="text-[13px] leading-relaxed text-zinc-500">{layoutHint}</p>
      ) : null}

      <SectionBlock
        title="Adicionar"
        subtitle={
          isStudio
            ? "Os dois primeiros vídeos na ordem são os do topo da página."
            : videoOnly
              ? "Envia ou escolhe vídeos."
              : "Envia ficheiros ou escolhe da biblioteca."
        }
      >
        <DropZone
          accept={videoOnly ? "video/*" : "image/*,.heic,.heif,video/*"}
          onFiles={handleDropFiles}
          uploading={uploading}
        />
        <button
          type="button"
          onClick={() => setPicker({ kind: "add" })}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[12px] text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
        >
          <FolderOpen className="size-3.5" strokeWidth={1.75} />
          Escolher da biblioteca
        </button>
      </SectionBlock>

      <MediaPickerModal
        open={picker !== null}
        onClose={() => setPicker(null)}
        files={mediaLibrary}
        filterType={pickerFilter}
        title={picker?.kind === "replace" ? "Substituir mídia" : "Adicionar à galeria"}
        uploading={uploading}
        onPick={(file) => {
          applyPicked(file, picker?.kind === "replace" ? picker.index : undefined);
          setPicker(null);
        }}
        onUpload={(file) =>
          uploadAndApply(file, picker?.kind === "replace" ? picker.index : undefined)
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="Ainda não há conteúdo"
          text="Envia ficheiros acima ou escolhe da biblioteca."
        />
      ) : isStudio ? (
        <div className="space-y-10">
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-white">Vídeos principais</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
                Os dois primeiros (marcados «Topo») aparecem no topo do site. Arrasta para
                escolher quais — os restantes ficam na galeria.
              </p>
            </div>
            {videos.length === 0 ? (
              <p className="text-sm text-zinc-600">Ainda sem vídeos.</p>
            ) : (
              <GallerySortableSection
                {...scopeHandlers(videos, commitStudioVideos)}
                layout={videos.length <= 2 ? "main-row" : "stack"}
                badgeForIndex={(i) => (i < 2 ? "Topo" : undefined)}
              />
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-white">Galeria</h2>
              <p className="mt-1 text-[12px] text-zinc-500">
                Fotos na grelha abaixo dos vídeos principais.
              </p>
            </div>
            {images.length === 0 ? (
              <p className="text-sm text-zinc-600">Ainda sem fotos.</p>
            ) : (
              <GallerySortableSection {...scopeHandlers(images, commitStudioImages)} />
            )}
          </section>
        </div>
      ) : (
        <SectionBlock
          title={`Galeria (${items.length === 1 ? "1 item" : `${items.length} itens`})`}
        >
          <GallerySortableSection
            items={items}
            allItems={items}
            mediaLibrary={mediaLibrary}
            showFeatured={showFeatured}
            onReorder={commit}
            onItemChange={(index, item) => {
              const next = [...items];
              next[index] = normalizeGalleryItem(item);
              commit(next);
            }}
            onRemove={handleRemove}
            onReplace={(index) => setPicker({ kind: "replace", index })}
            onPosterUpload={handlePosterUpload}
            posterUploadingIndex={posterUploadingIndex}
          />
        </SectionBlock>
      )}
    </div>
  );
}
