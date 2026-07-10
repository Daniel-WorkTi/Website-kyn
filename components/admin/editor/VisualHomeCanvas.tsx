"use client";

import { useState } from "react";
import Hero from "@/components/site/Hero";
import MediaItem from "@/components/site/MediaItem";
import { EditableZone } from "@/components/admin/editor/EditableZone";
import { AddMediaButton, FloatingEditPanel } from "@/components/admin/editor/FloatingEditPanel";
import { VisualEditorFrame } from "@/components/admin/editor/VisualEditorFrame";
import { VisualMediaControls } from "@/components/admin/editor/VisualMediaControls";
import type { HomeData, HomeStackItem, MediaFile } from "@/lib/admin/sections";
import { guessMediaType } from "@/lib/admin/sections";

type Selection =
  | { kind: "hero-video"; index: 0 | 1 }
  | { kind: "hero-title" }
  | { kind: "hero-subtitle"; line: number }
  | { kind: "stack"; index: number }
  | { kind: "add-stack" }
  | null;

type VisualHomeCanvasProps = {
  data: HomeData;
  onChange: (data: HomeData) => void;
  onDirty: () => void;
  mediaLibrary: MediaFile[];
  onUpload?: (file: File) => Promise<string>;
  uploading?: boolean;
};

export function VisualHomeCanvas({
  data,
  onChange,
  onDirty,
  mediaLibrary,
  onUpload,
  uploading = false
}: VisualHomeCanvasProps) {
  const [selection, setSelection] = useState<Selection>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const hero = data.hero || { title: "", subtitleLines: [], videos: [] };
  const stack = data.homeStack || [];
  const brand = data.brand || "Proimagem.pt";

  function patch(partial: Partial<HomeData>) {
    onChange({ ...data, ...partial });
    onDirty();
  }

  function patchHero(partial: Partial<HomeData["hero"]>) {
    patch({ hero: { ...hero, ...partial } });
  }

  function patchStack(next: HomeStackItem[]) {
    patch({ homeStack: next });
  }

  function openPickerFor(sel: Selection) {
    setSelection(sel);
    setPickerOpen(true);
  }

  async function handleUpload(file: File) {
    if (!onUpload || !selection) return;
    const url = await onUpload(file);
    if (!url) return;
    applyMediaUrl(url, file);
    setPickerOpen(false);
  }

  function applyMediaFile(file: MediaFile) {
    const pseudo = { name: file.name, type: file.type === "video" ? "video/mp4" : "image/jpeg" } as File;
    applyMediaUrl(file.url, pseudo);
    setPickerOpen(false);
  }

  function applyMediaUrl(url: string, file?: File) {
    const type = file?.type.startsWith("video/") ? "video" : guessMediaType(url);

    if (selection?.kind === "hero-video") {
      const videos = [...(hero.videos || [])];
      while (videos.length <= selection.index) {
        videos.push({ src: "", poster: "" });
      }
      videos[selection.index] = { src: url, poster: videos[selection.index]?.poster ?? "" };
      patchHero({ videos });
      return;
    }

    if (selection?.kind === "stack" || selection?.kind === "add-stack") {
      const name = file?.name || url.split("/").pop()?.replace(/\.[^.]+$/, "") || "Proimagem.pt";
      const item: HomeStackItem = {
        type: type === "video" ? "video" : "image",
        src: url,
        alt: name
      };

      if (selection.kind === "add-stack") {
        patchStack([...stack, item]);
      } else {
        const next = [...stack];
        next[selection.index] = { ...next[selection.index], ...item };
        patchStack(next);
      }
    }
  }

  function removeStackItem(index: number) {
    patchStack(stack.filter((_, i) => i !== index));
    setSelection(null);
  }

  const pickerFilter =
    selection?.kind === "hero-video"
      ? "video"
      : selection?.kind === "stack" || selection?.kind === "add-stack"
        ? "all"
        : "all";

  const panelTitle =
    selection?.kind === "hero-video"
      ? selection.index === 0
        ? "Vídeo principal do hero"
        : "Vídeo secundário do hero"
      : selection?.kind === "stack"
        ? "Trocar mídia"
        : selection?.kind === "add-stack"
          ? "Adicionar mídia"
          : "";

  const mediaPanelOpen =
    selection?.kind === "hero-video" ||
    selection?.kind === "stack" ||
    selection?.kind === "add-stack";

  return (
    <>
      <VisualEditorFrame onBackgroundClick={() => setSelection(null)}>
        <div className="relative">
          <EditableZone
            label="Vídeo do hero"
            hint="Clica para trocar o vídeo"
            selected={selection?.kind === "hero-video" && selection.index === 0}
            onSelect={() => openPickerFor({ kind: "hero-video", index: 0 })}
            overlayClassName="rounded-none"
          >
            <Hero hero={hero} brand={brand} interactive={false} showContent={false} />
          </EditableZone>

          <div className="pointer-events-none absolute inset-0 z-[25] flex flex-col items-center justify-center px-6">
            <EditableZone
              label="Título"
              hint="Clica para editar"
              selected={selection?.kind === "hero-title"}
              onSelect={() => setSelection({ kind: "hero-title" })}
              className="pointer-events-auto mb-4"
              overlayClassName="rounded-md"
            >
              <h1
                className="hero__title text-center text-white outline-none"
                contentEditable
                suppressContentEditableWarning
                onClick={(e) => e.stopPropagation()}
                onBlur={(e) => {
                  const value = e.currentTarget.textContent?.trim().toUpperCase() || "";
                  if (value && value !== hero.title?.toUpperCase()) {
                    patchHero({ title: value });
                  }
                }}
              >
                {(hero.title || brand).toUpperCase()}
              </h1>
            </EditableZone>

            <div className="pointer-events-auto w-full max-w-[920px] space-y-2">
              {(hero.subtitleLines || []).map((line, i) => (
                <EditableZone
                  key={i}
                  label={`Linha ${i + 1}`}
                  hint="Clica para editar"
                  selected={selection?.kind === "hero-subtitle" && selection.line === i}
                  onSelect={() => setSelection({ kind: "hero-subtitle", line: i })}
                  overlayClassName="rounded-md"
                >
                  <p
                    className="hero__line text-center text-white outline-none"
                    contentEditable
                    suppressContentEditableWarning
                    onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => {
                      const value = e.currentTarget.textContent?.trim().toUpperCase() || "";
                      const lines = [...(hero.subtitleLines || [])];
                      if (value === lines[i]) return;
                      lines[i] = value;
                      patchHero({ subtitleLines: lines });
                    }}
                  >
                    {line}
                  </p>
                </EditableZone>
              ))}
            </div>
          </div>
        </div>

        <div className="stack">
          {stack.map((item, i) => (
            <EditableZone
              key={`${item.src}-${i}`}
              label={item.type === "video" ? "Vídeo" : "Imagem"}
              hint="Clica para trocar"
              selected={selection?.kind === "stack" && selection.index === i}
              onSelect={() => openPickerFor({ kind: "stack", index: i })}
              className="stack__item"
              overlayClassName="rounded-none"
            >
              <MediaItem item={item} autoplay />
            </EditableZone>
          ))}

          <AddMediaButton onClick={() => openPickerFor({ kind: "add-stack" })} />
        </div>
      </VisualEditorFrame>

      <VisualMediaControls
        open={mediaPanelOpen}
        title={panelTitle}
        onClose={() => setSelection(null)}
        pickerOpen={pickerOpen}
        onPickerOpenChange={setPickerOpen}
        files={mediaLibrary}
        filterType={pickerFilter}
        onPick={applyMediaFile}
        onUpload={onUpload ? handleUpload : undefined}
        uploading={uploading}
        onRemove={
          selection?.kind === "stack" ? () => removeStackItem(selection.index) : undefined
        }
        extra={
          selection?.kind === "hero-video" && selection.index === 0 ? (
            <button
              type="button"
              onClick={() => setSelection({ kind: "hero-video", index: 1 })}
              className="mb-3 w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 text-xs text-zinc-400 transition hover:text-white"
            >
              Editar também o vídeo 2 (scroll)
            </button>
          ) : undefined
        }
      />

      {selection?.kind === "hero-subtitle" && (
        <FloatingEditPanel
          title={`Editar linha ${selection.line + 1}`}
          onClose={() => setSelection(null)}
        >
          <p className="text-xs text-zinc-500">
            Clica diretamente no texto no site e escreve para editar.
          </p>
        </FloatingEditPanel>
      )}

      {selection?.kind === "hero-title" && (
        <FloatingEditPanel title="Editar título" onClose={() => setSelection(null)}>
          <p className="text-xs text-zinc-500">
            Clica no título no site e edita o texto diretamente.
          </p>
        </FloatingEditPanel>
      )}
    </>
  );
}
