"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { MediaPickerField } from "@/components/admin/editor/fields/MediaPickerField";
import { DropZone } from "@/components/admin/shared/DropZone";
import {
  AddButton,
  EmptyState,
  FieldLabel,
  SectionBlock,
  TextArea,
  TextInput
} from "@/components/admin/shared/MediaLibrary";
import type { HomeData, HomeStackItem, MediaFile } from "@/lib/admin/sections";

type EditorCommonProps = {
  onDirty: () => void;
  processUpload: (file: File, onSuccess: (url: string, file: File) => void) => Promise<void>;
  showToast: (message: string, type?: "ok" | "error" | "pending") => void;
  mediaLibrary: MediaFile[];
  refreshMediaLibrary: () => Promise<void>;
  mediaLoading: boolean;
};

type HomeEditorProps = EditorCommonProps & {
  data: HomeData;
  onChange: (data: HomeData) => void;
};

export function HomeEditor({
  data,
  onChange,
  onDirty,
  processUpload,
  showToast,
  mediaLibrary
}: HomeEditorProps) {
  const [uploading, setUploading] = useState(false);
  const hero = data.hero || { title: "", subtitleLines: [], videos: [{ src: "", poster: "" }, { src: "", poster: "" }] };
  const videos = hero.videos?.length
    ? hero.videos
    : [{ src: "", poster: "" }, { src: "", poster: "" }];
  const stack = data.homeStack || [];

  function patch(partial: Partial<HomeData>) {
    onChange({ ...data, ...partial });
    onDirty();
  }

  function patchHero(partial: Partial<HomeData["hero"]>) {
    onChange({ ...data, hero: { ...hero, ...partial } });
    onDirty();
  }

  async function handleStackDrop(files: File[]) {
    setUploading(true);
    let nextStack = [...stack];
    for (const file of files) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) continue;
      try {
        await processUpload(file, (url, f) => {
          nextStack = [
            ...nextStack,
            {
              type: isVideo ? ("video" as const) : ("image" as const),
              src: url,
              alt: f.name.replace(/\.[^.]+$/, "") || "Proimagem.pt"
            }
          ];
          onChange({ ...data, homeStack: nextStack });
        });
      } catch (err) {
        showToast(`${file.name}: ${err instanceof Error ? err.message : "Erro"}`, "error");
      }
    }
    onDirty();
    setUploading(false);
  }

  async function uploadForPicker(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      processUpload(file, (url) => resolve(url)).catch(reject);
    });
  }

  return (
    <div className="space-y-6">
      <SectionBlock title="Textos">
        <div>
          <FieldLabel htmlFor="hero-title">Título</FieldLabel>
          <TextInput
            id="hero-title"
            value={hero.title || data.brand || ""}
            onChange={(value) => patchHero({ title: value })}
          />
        </div>
        <div>
          <FieldLabel htmlFor="hero-subtitle">Subtítulo</FieldLabel>
          <TextArea
            id="hero-subtitle"
            value={(hero.subtitleLines || []).join("\n")}
            onChange={(value) =>
              patchHero({
                subtitleLines: value
                  .split("\n")
                  .map((l) => l.trim())
                  .filter(Boolean)
              })
            }
            rows={3}
          />
          <p className="mt-1.5 text-[10px] text-zinc-600">Uma linha por frase no site.</p>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Vídeos do cabeçalho"
        subtitle="Vídeo 1 ao abrir · Vídeo 2 no scroll."
      >
        <div className="space-y-5">
          {videos.map((video, i) => (
            <MediaPickerField
              key={i}
              label={i === 0 ? "Vídeo inicial" : "Vídeo no scroll"}
              type="video"
              value={video.src}
              files={mediaLibrary}
              uploading={uploading}
              onChange={(url) => {
                const next = [...videos];
                next[i] = { ...next[i], src: url, poster: "" };
                patchHero({ videos: next });
              }}
              onUpload={uploadForPicker}
              onRemove={() => {
                const next = [...videos];
                next[i] = { src: "", poster: "" };
                patchHero({ videos: next });
              }}
            />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="Mídias da página" subtitle="Ordem = ordem no site.">
        <DropZone accept="image/*,video/*" onFiles={handleStackDrop} uploading={uploading} />

        {stack.length === 0 ? (
          <EmptyState title="Nenhuma mídia" text="Envia ficheiros acima ou adiciona um bloco." />
        ) : (
          <div className="space-y-4">
            {stack.map((item, i) => (
              <StackMediaCard
                key={`${item.src}-${i}`}
                item={item}
                index={i}
                total={stack.length}
                mediaLibrary={mediaLibrary}
                onChange={(updated) => {
                  const next = [...stack];
                  next[i] = updated;
                  patch({ homeStack: next });
                }}
                onRemove={() => patch({ homeStack: stack.filter((_, idx) => idx !== i) })}
                onMove={(direction) => {
                  const j = direction === "up" ? i - 1 : i + 1;
                  if (j < 0 || j >= stack.length) return;
                  const next = [...stack];
                  [next[i], next[j]] = [next[j], next[i]];
                  patch({ homeStack: next });
                }}
                uploadForPicker={uploadForPicker}
              />
            ))}
          </div>
        )}

        <AddButton
          label="Adicionar bloco"
          onClick={() => patch({ homeStack: [...stack, { type: "image", src: "", alt: "" }] })}
        />
      </SectionBlock>
    </div>
  );
}

function StackMediaCard({
  item,
  index,
  total,
  mediaLibrary,
  onChange,
  onRemove,
  onMove,
  uploadForPicker
}: {
  item: HomeStackItem;
  index: number;
  total: number;
  mediaLibrary: MediaFile[];
  onChange: (item: HomeStackItem) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
  uploadForPicker: (file: File) => Promise<string>;
}) {
  return (
    <article className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      <MediaPickerField
        label={`Bloco ${index + 1}`}
        type={item.type}
        value={item.src}
        files={mediaLibrary}
        onChange={(url) => {
          const picked = mediaLibrary.find((f) => f.url === url);
          onChange({
            ...item,
            src: url,
            type:
              picked?.type === "video"
                ? "video"
                : picked?.type === "image"
                  ? "image"
                  : item.type
          });
        }}
        onUpload={uploadForPicker}
        onRemove={() => onChange({ ...item, src: "" })}
      />

      <div className="mt-3">
        <FieldLabel>Descrição</FieldLabel>
        <TextInput
          value={item.alt || ""}
          onChange={(value) => onChange({ ...item, alt: value })}
          placeholder="Opcional"
        />
      </div>

      <div className="mt-3 flex items-center gap-1 border-t border-white/[0.05] pt-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove("up")}
          title="Subir"
          className="inline-flex size-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-300 disabled:opacity-30"
        >
          <ArrowUp className="size-3.5" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={() => onMove("down")}
          title="Descer"
          className="inline-flex size-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-300 disabled:opacity-30"
        >
          <ArrowDown className="size-3.5" strokeWidth={1.75} />
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={onRemove}
          title="Remover bloco"
          className="inline-flex size-7 items-center justify-center rounded-md text-red-400/70 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </article>
  );
}
