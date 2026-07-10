"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { DropZone } from "@/components/admin/shared/DropZone";
import {
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

  function addFromLibrary(url: string, type: string) {
    if (type !== "video") return;
    const nextVideos = [...videos];
    const slot = nextVideos.findIndex((v) => !v.src);
    const i = slot >= 0 ? slot : 0;
    nextVideos[i] = { ...nextVideos[i], src: url };
    patchHero({ videos: nextVideos });
  }

  async function handleStackDrop(files: File[]) {
    setUploading(true);
    let nextStack = [...stack];
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      try {
        await processUpload(file, (url, f) => {
          nextStack = [
            ...nextStack,
            { type: "image" as const, src: url, alt: f.name.replace(/\.[^.]+$/, "") }
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
            Cada linha aparece numa linha separada no site.
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
        subtitle="Estes vídeos mudam quando o visitante faz scroll na página."
      >
        <MediaLibrary
          files={mediaLibrary}
          filter="video"
          hint="Clica num vídeo da biblioteca para usar como fundo."
          onSelect={addFromLibrary}
          onRefresh={refreshMediaLibrary}
          loading={mediaLoading}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {videos.map((video, i) => (
            <HeroVideoCard
              key={i}
              index={i}
              video={video}
              onUpload={async (file) => {
                if (!file.type.startsWith("video/")) {
                  showToast("Escolhe um ficheiro de vídeo.", "error");
                  return;
                }
                try {
                  await processUpload(file, (url) => {
                    const next = [...videos];
                    next[i] = { ...next[i], src: url, poster: "" };
                    patchHero({ videos: next });
                  });
                } catch (err) {
                  showToast(err instanceof Error ? err.message : "Erro no envio.", "error");
                }
              }}
              onClear={() => {
                if (!window.confirm("Queres limpar este vídeo?")) return;
                const next = [...videos];
                next[i] = { src: "", poster: "" };
                patchHero({ videos: next });
              }}
            />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="Imagens abaixo do cabeçalho">
        <DropZone accept="image/*" onFiles={handleStackDrop} uploading={uploading} />
        {stack.length === 0 ? (
          <EmptyState
            title="Sem imagens"
            text="Carrega fotos na área acima para as mostrar na página inicial."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {stack.map((item, i) => (
              <StackImageCard
                key={`${item.src}-${i}`}
                item={item}
                onChange={(updated) => {
                  const next = [...stack];
                  next[i] = updated;
                  patch({ homeStack: next });
                }}
                onRemove={() => {
                  patch({ homeStack: stack.filter((_, idx) => idx !== i) });
                }}
                onUpload={async (file) => {
                  try {
                    await processUpload(file, (url, f) => {
                      const next = [...stack];
                      next[i] = {
                        ...next[i],
                        src: url,
                        alt: next[i].alt || f.name.replace(/\.[^.]+$/, "")
                      };
                      patch({ homeStack: next });
                    });
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : "Erro no envio.", "error");
                  }
                }}
              />
            ))}
          </div>
        )}
      </SectionBlock>
    </div>
  );
}

function HeroVideoCard({
  index,
  video,
  onUpload,
  onClear
}: {
  index: number;
  video: { src: string; poster: string };
  onUpload: (file: File) => Promise<void>;
  onClear: () => void;
}) {
  const srcRef = useRef<HTMLInputElement>(null);

  return (
    <article className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#141414]">
      <div className="relative aspect-video bg-black/40">
        {video.src ? (
          <video
            src={video.src}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Sem vídeo
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[0.65rem] text-white">
          Vídeo {index + 1}
          {index === 0 ? " (inicial)" : " (no scroll)"}
        </span>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <FieldLabel>Ficheiro de vídeo</FieldLabel>
          <button
            type="button"
            onClick={() => srcRef.current?.click()}
            className={[
              "w-full rounded-lg border px-3 py-2 text-left text-sm transition",
              video.src
                ? "border-accent/30 bg-accent-dim text-accent"
                : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
            ].join(" ")}
          >
            {video.src ? "Vídeo carregado · Trocar" : "Carregar vídeo"}
          </button>
          <input
            ref={srcRef}
            type="file"
            accept="video/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onUpload(file);
            }}
          />
          <p className="mt-2 text-xs text-zinc-500">Inicia automaticamente no site.</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 text-xs text-zinc-500 transition hover:text-red-400"
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
          Limpar vídeo
        </button>
      </div>
    </article>
  );
}

function StackImageCard({
  item,
  onChange,
  onRemove,
  onUpload
}: {
  item: HomeStackItem;
  onChange: (item: HomeStackItem) => void;
  onRemove: () => void;
  onUpload: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <article className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#141414]">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative block aspect-video w-full overflow-hidden bg-black/40"
      >
        {item.src ? (
          <img src={item.src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Clica para carregar
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white opacity-0 transition group-hover:opacity-100">
          Trocar ficheiro
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onUpload(file);
          }}
        />
      </button>
      <div className="space-y-3 p-4">
        <div>
          <FieldLabel>Descrição</FieldLabel>
          <TextInput
            value={item.alt || ""}
            onChange={(value) => onChange({ ...item, alt: value })}
            placeholder="Descrição da imagem"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400"
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
          Remover
        </button>
      </div>
    </article>
  );
}
