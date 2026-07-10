"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { MediaPickerField } from "@/components/admin/editor/fields/MediaPickerField";
import { DropZone } from "@/components/admin/shared/DropZone";
import {
  AddButton,
  EmptyState,
  FieldLabel,
  MediaLibrary,
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
  mediaLibrary,
  refreshMediaLibrary,
  mediaLoading
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

  function addStackFromLibrary(url: string, type: string) {
    const mediaType = type === "video" ? "video" : "image";
    const name = url.split("/").pop()?.replace(/\.[^.]+$/, "") || "Proimagem.pt";
    patch({
      homeStack: [
        ...stack,
        { type: mediaType, src: url, alt: name }
      ]
    });
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
    <div className="space-y-8">
      <SectionBlock title="Texto do cabeçalho">
        <div>
          <FieldLabel htmlFor="hero-title">Título principal</FieldLabel>
          <TextInput
            id="hero-title"
            value={hero.title || data.brand || ""}
            onChange={(value) => patchHero({ title: value })}
          />
        </div>
        <div>
          <FieldLabel htmlFor="hero-subtitle">Subtítulo</FieldLabel>
          <p className="mb-2 text-xs text-zinc-500">
            Cada linha aparece no site. Usa | para separar tópicos na mesma linha (ex.: 2 linhas com 3 tópicos).
          </p>
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
        </div>
      </SectionBlock>

      <SectionBlock
        title="Vídeos de fundo"
        subtitle="Vídeo 1 ao abrir a página · Vídeo 2 quando o visitante faz scroll."
      >
        <MediaLibrary
          files={mediaLibrary}
          filter="video"
          hint="Clica num vídeo da biblioteca para preencher o primeiro slot vazio."
          onSelect={(url) => {
            const nextVideos = [...videos];
            const slot = nextVideos.findIndex((v) => !v.src);
            const i = slot >= 0 ? slot : 0;
            nextVideos[i] = { ...nextVideos[i], src: url, poster: "" };
            patchHero({ videos: nextVideos });
          }}
          onRefresh={refreshMediaLibrary}
          loading={mediaLoading}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {videos.map((video, i) => (
            <div key={i} className="space-y-2">
              <p className="text-xs font-medium text-zinc-400">
                Vídeo {i + 1}{i === 0 ? " (inicial)" : " (no scroll)"}
              </p>
              <MediaPickerField
                label=""
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
            </div>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        title="Mídias abaixo do cabeçalho"
        subtitle="Fotos e vídeos em largura total, na ordem em que aparecem aqui."
      >
        <MediaLibrary
          files={mediaLibrary}
          hint="Clica numa foto ou vídeo da biblioteca para adicionar ao stack."
          onSelect={addStackFromLibrary}
          onRefresh={refreshMediaLibrary}
          loading={mediaLoading}
        />

        <DropZone
          accept="image/*,video/*"
          onFiles={handleStackDrop}
          uploading={uploading}
        />

        {stack.length === 0 ? (
          <EmptyState
            title="Sem mídias"
            text="Adiciona fotos ou vídeos com a biblioteca ou a área de envio acima."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
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
                onRemove={() => {
                  patch({ homeStack: stack.filter((_, idx) => idx !== i) });
                }}
                onMove={(direction) => {
                  const j = direction === "up" ? i - 1 : i + 1;
                  if (j < 0 || j >= stack.length) return;
                  const next = [...stack];
                  [next[i], next[j]] = [next[j], next[i]];
                  patch({ homeStack: next });
                }}
                onUpload={async (file) => {
                  try {
                    await processUpload(file, (url, f) => {
                      const next = [...stack];
                      next[i] = {
                        type: f.type.startsWith("video/") ? "video" : "image",
                        src: url,
                        alt: next[i].alt || f.name.replace(/\.[^.]+$/, "")
                      };
                      patch({ homeStack: next });
                    });
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : "Erro no envio.", "error");
                  }
                }}
                uploadForPicker={uploadForPicker}
              />
            ))}
          </div>
        )}

        <AddButton
          label="Adicionar bloco vazio"
          onClick={() =>
            patch({
              homeStack: [...stack, { type: "image", src: "", alt: "" }]
            })
          }
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
  onUpload,
  uploadForPicker
}: {
  item: HomeStackItem;
  index: number;
  total: number;
  mediaLibrary: MediaFile[];
  onChange: (item: HomeStackItem) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
  onUpload: (file: File) => Promise<void>;
  uploadForPicker: (file: File) => Promise<string>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <article className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#141414]">
      <MediaPickerField
        label={`Bloco ${index + 1} (${item.type === "video" ? "vídeo" : "foto"})`}
        type={item.type}
        value={item.src}
        files={mediaLibrary}
        onChange={(url) => {
          const picked = mediaLibrary.find((f) => f.url === url);
          onChange({
            ...item,
            src: url,
            type: picked?.type === "video" ? "video" : item.type === "video" && !picked ? "video" : picked?.type === "image" ? "image" : item.type
          });
        }}
        onUpload={uploadForPicker}
        onRemove={() => onChange({ ...item, src: "" })}
      />

      <div className="space-y-3 px-4 pb-4">
        <div>
          <FieldLabel>Descrição (acessibilidade)</FieldLabel>
          <TextInput
            value={item.alt || ""}
            onChange={(value) => onChange({ ...item, alt: value })}
            placeholder="Descrição da mídia"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove("up")}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.08] disabled:opacity-40"
          >
            <ArrowUp className="size-3.5" strokeWidth={1.75} />
            Subir
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove("down")}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.08] disabled:opacity-40"
          >
            <ArrowDown className="size-3.5" strokeWidth={1.75} />
            Descer
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400"
          >
            <Trash2 className="size-3.5" strokeWidth={1.75} />
            Remover
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void onUpload(file);
          }}
        />
      </div>
    </article>
  );
}
