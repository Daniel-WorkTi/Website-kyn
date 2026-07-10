"use client";

import { useMemo, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Lightbulb,
  MousePointerClick,
  X
} from "lucide-react";
import { useEditorStore } from "@/hooks/useEditorStore";
import {
  getElementType,
  type ButtonStyle,
  type EditableElementId,
  type TextAlign,
  type TitleSize
} from "@/lib/admin/editor-types";
import { ColorField } from "./fields/ColorField";
import { ImageField } from "./fields/ImageField";
import { VideoField } from "./fields/VideoField";
import { TextField } from "./fields/TextField";
import { VisibilitySwitch } from "./fields/VisibilitySwitch";
import type { MediaFile } from "@/lib/admin/sections";

type RightEditorPanelProps = {
  onUpload?: (file: File) => Promise<string>;
  uploading?: boolean;
  mediaLibrary?: MediaFile[];
  className?: string;
  onClose?: () => void;
};

type Tab = "content" | "style";

function SegmentedControl<T extends string>({
  value,
  options,
  onChange
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            "rounded-lg border px-3 py-2 text-xs font-medium transition",
            value === opt.value
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white"
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function AlignControl({ value, onChange }: { value: TextAlign; onChange: (v: TextAlign) => void }) {
  const items: { value: TextAlign; icon: typeof AlignLeft }[] = [
    { value: "left", icon: AlignLeft },
    { value: "center", icon: AlignCenter },
    { value: "right", icon: AlignRight }
  ];

  return (
    <div className="flex gap-2">
      {items.map(({ value: v, icon: Icon }) => (
        <button
          key={v}
          type="button"
          title={v}
          onClick={() => onChange(v)}
          className={[
            "flex flex-1 items-center justify-center rounded-xl border py-3 transition",
            value === v
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : "border-white/10 bg-white/[0.03] text-zinc-500 hover:text-white"
          ].join(" ")}
        >
          <Icon className="size-4" strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}

function EmptyState() {
  const { pageData, setSelectedElement } = useEditorStore();

  const items: { id: EditableElementId; label: string }[] = [
    { id: "hero", label: "Hero" },
    { id: "hero.video", label: "Vídeo de fundo" },
    { id: "hero.title", label: "Título principal" },
    { id: "hero.subtitle", label: "Subtítulo" },
    { id: "hero.button", label: "Botão" },
    { id: "featured.sectionTitle", label: "Título da secção" },
    ...pageData.featured.cards.map((card) => ({
      id: `featured.cards.${card.id}` as EditableElementId,
      label: `Card — ${card.title}`
    })),
    { id: "stats", label: "Estatísticas" }
  ];

  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <div className="mb-4 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
          <MousePointerClick className="size-5 text-zinc-500" strokeWidth={1.5} />
        </div>
        <h3 className="text-base font-medium text-white">O que queres editar?</h3>
        <p className="mt-1 text-sm text-zinc-500">Escolhe um elemento do site</p>
      </div>

      <div className="sidebar-scroll flex-1 space-y-1.5 overflow-y-auto">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedElement(item.id)}
            className="flex w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-sm text-zinc-300 transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-white"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TipsBox() {
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
      <div className="mb-2 flex items-center gap-2 text-emerald-400">
        <Lightbulb className="size-4" strokeWidth={1.75} />
        <span className="text-sm font-medium">Dicas rápidas</span>
      </div>
      <ul className="space-y-1.5 text-xs leading-relaxed text-zinc-400">
        <li>• Escolhe o elemento na lista à esquerda do painel</li>
        <li>• Guarda as alterações para veres no site real</li>
        <li>• O vídeo de fundo muda ao fazer scroll no site real</li>
      </ul>
    </div>
  );
}

function panelTitle(id: EditableElementId | null): string {
  if (!id) return "Editor";
  if (id === "hero" || id === "hero.video") return "Editar Hero";
  if (id === "hero.title") return "Título principal";
  if (id === "hero.subtitle") return "Subtítulo";
  if (id === "hero.button") return "Botão";
  if (id === "featured.sectionTitle") return "Título da secção";
  if (id === "stats") return "Estatísticas";
  if (id.startsWith("featured.cards.")) return "Editar card";
  return "Editor";
}

function cardIdFromElement(id: EditableElementId): string | null {
  if (!id.startsWith("featured.cards.")) return null;
  return id.replace("featured.cards.", "");
}

export function RightEditorPanel({
  onUpload,
  uploading = false,
  mediaLibrary = [],
  className = "",
  onClose
}: RightEditorPanelProps) {
  const { selectedElementId, pageData, updateElement, setSelectedElement } = useEditorStore();
  const [tab, setTab] = useState<Tab>("content");

  const elementType = getElementType(selectedElementId);
  const cardId = selectedElementId ? cardIdFromElement(selectedElementId) : null;

  const card = useMemo(
    () => (cardId ? pageData.featured.cards.find((c) => c.id === cardId) : null),
    [pageData.featured.cards, cardId]
  );

  const cardIndex = useMemo(
    () => (cardId ? pageData.featured.cards.findIndex((c) => c.id === cardId) : -1),
    [pageData.featured.cards, cardId]
  );

  const isUploading = uploading;

  const showHeroFull =
    selectedElementId === "hero" || selectedElementId === "hero.video";

  return (
    <aside
      className={[
        "flex h-full w-[380px] max-w-full flex-col border-l border-white/10",
        "bg-gradient-to-b from-[#0c0c0c] via-[#080808] to-black",
        className
      ].join(" ")}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <h2 className="text-base font-medium text-white">{panelTitle(selectedElementId)}</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {!selectedElementId ? (
        <EmptyState />
      ) : (
        <div className="sidebar-scroll flex-1 overflow-y-auto px-6 py-5">
          {showHeroFull && (
            <div className="space-y-6">
              <div className="flex gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                {(["content", "style"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={[
                      "flex-1 rounded-lg py-2 text-sm font-medium transition",
                      tab === t ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                    ].join(" ")}
                  >
                    {t === "content" ? "Conteúdo" : "Estilo"}
                  </button>
                ))}
              </div>

              {tab === "content" && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-zinc-300">Tipo de Hero</span>
                    <select
                      value={pageData.hero.mediaType}
                      onChange={(e) =>
                        updateElement((d) => ({
                          ...d,
                          hero: { ...d.hero, mediaType: e.target.value as "video" | "image" }
                        }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none focus:border-emerald-500/50"
                    >
                      <option value="video">Vídeo de fundo</option>
                      <option value="image">Imagem de fundo</option>
                    </select>
                  </div>

                  {pageData.hero.mediaType === "video" ? (
                    <VideoField
                      videoSrc={pageData.hero.videoSrc}
                      files={mediaLibrary}
                      onVideoChange={(url) =>
                        updateElement((d) => ({
                          ...d,
                          hero: { ...d.hero, videoSrc: url }
                        }))
                      }
                      onUploadVideo={onUpload}
                      uploading={isUploading}
                      onRemoveVideo={() =>
                        updateElement((d) => ({
                          ...d,
                          hero: { ...d.hero, videoSrc: "", videoPoster: "" }
                        }))
                      }
                    />
                  ) : (
                    <ImageField
                      label="Imagem de fundo"
                      value={pageData.hero.imageSrc}
                      files={mediaLibrary}
                      onChange={(url) =>
                        updateElement((d) => ({
                          ...d,
                          hero: { ...d.hero, imageSrc: url }
                        }))
                      }
                      onUpload={onUpload}
                      uploading={isUploading}
                      onRemove={() =>
                        updateElement((d) => ({
                          ...d,
                          hero: { ...d.hero, imageSrc: "" }
                        }))
                      }
                    />
                  )}

                  <TextField
                    label="Título"
                    value={pageData.hero.title}
                    onChange={(v) =>
                      updateElement((d) => ({ ...d, hero: { ...d.hero, title: v } }))
                    }
                  />
                  <TextField
                    label="Subtítulo"
                    value={pageData.hero.subtitle}
                    onChange={(v) =>
                      updateElement((d) => ({ ...d, hero: { ...d.hero, subtitle: v } }))
                    }
                    hint="Separa com | para várias partes"
                    multiline
                    rows={2}
                  />
                  <TextField
                    label="Texto do botão"
                    value={pageData.hero.buttonText}
                    onChange={(v) =>
                      updateElement((d) => ({ ...d, hero: { ...d.hero, buttonText: v } }))
                    }
                  />
                  <TextField
                    label="Link do botão"
                    value={pageData.hero.buttonLink}
                    onChange={(v) =>
                      updateElement((d) => ({ ...d, hero: { ...d.hero, buttonLink: v } }))
                    }
                    placeholder="/studio-space ou #trabalhos"
                  />
                  <VisibilitySwitch
                    label="Mostrar esta seção"
                    description="Esconde o Hero do site"
                    checked={pageData.hero.visible}
                    onChange={(v) =>
                      updateElement((d) => ({ ...d, hero: { ...d.hero, visible: v } }))
                    }
                  />
                </div>
              )}

              {tab === "style" && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-zinc-300">Tamanho do título</span>
                    <SegmentedControl<TitleSize>
                      value={pageData.hero.titleSize}
                      options={[
                        { value: "sm", label: "Pequeno" },
                        { value: "md", label: "Médio" },
                        { value: "lg", label: "Grande" }
                      ]}
                      onChange={(v) =>
                        updateElement((d) => ({ ...d, hero: { ...d.hero, titleSize: v } }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-zinc-300">Alinhamento</span>
                    <AlignControl
                      value={pageData.hero.titleAlign}
                      onChange={(v) =>
                        updateElement((d) => ({ ...d, hero: { ...d.hero, titleAlign: v } }))
                      }
                    />
                  </div>
                  <ColorField
                    label="Cor do texto"
                    value={pageData.hero.titleColor}
                    onChange={(v) =>
                      updateElement((d) => ({ ...d, hero: { ...d.hero, titleColor: v } }))
                    }
                  />
                </div>
              )}

              <TipsBox />
            </div>
          )}

          {selectedElementId === "hero.title" && (
            <div className="space-y-5">
              <TextField
                label="Texto do título"
                value={pageData.hero.title}
                onChange={(v) =>
                  updateElement((d) => ({ ...d, hero: { ...d.hero, title: v } }))
                }
              />
              <div className="space-y-2">
                <span className="text-sm font-medium text-zinc-300">Tamanho</span>
                <SegmentedControl<TitleSize>
                  value={pageData.hero.titleSize}
                  options={[
                    { value: "sm", label: "Pequeno" },
                    { value: "md", label: "Médio" },
                    { value: "lg", label: "Grande" }
                  ]}
                  onChange={(v) =>
                    updateElement((d) => ({ ...d, hero: { ...d.hero, titleSize: v } }))
                  }
                />
              </div>
              <AlignControl
                value={pageData.hero.titleAlign}
                onChange={(v) =>
                  updateElement((d) => ({ ...d, hero: { ...d.hero, titleAlign: v } }))
                }
              />
              <ColorField
                label="Cor do texto"
                value={pageData.hero.titleColor}
                onChange={(v) =>
                  updateElement((d) => ({ ...d, hero: { ...d.hero, titleColor: v } }))
                }
              />
              <VisibilitySwitch
                label="Mostrar título"
                checked={pageData.hero.visible}
                onChange={(v) =>
                  updateElement((d) => ({ ...d, hero: { ...d.hero, visible: v } }))
                }
              />
            </div>
          )}

          {selectedElementId === "hero.subtitle" && (
            <div className="space-y-5">
              <TextField
                label="Subtítulo"
                value={pageData.hero.subtitle}
                onChange={(v) =>
                  updateElement((d) => ({ ...d, hero: { ...d.hero, subtitle: v } }))
                }
                multiline
                rows={3}
              />
            </div>
          )}

          {selectedElementId === "hero.button" && (
            <div className="space-y-5">
              <TextField
                label="Texto do botão"
                value={pageData.hero.buttonText}
                onChange={(v) =>
                  updateElement((d) => ({ ...d, hero: { ...d.hero, buttonText: v } }))
                }
              />
              <TextField
                label="Link do botão"
                value={pageData.hero.buttonLink}
                onChange={(v) =>
                  updateElement((d) => ({ ...d, hero: { ...d.hero, buttonLink: v } }))
                }
              />
              <div className="space-y-2">
                <span className="text-sm font-medium text-zinc-300">Estilo</span>
                <SegmentedControl<ButtonStyle>
                  value={pageData.hero.buttonStyle}
                  options={[
                    { value: "primary", label: "Primário" },
                    { value: "secondary", label: "Secundário" }
                  ]}
                  onChange={(v) =>
                    updateElement((d) => ({ ...d, hero: { ...d.hero, buttonStyle: v } }))
                  }
                />
              </div>
              <VisibilitySwitch
                label="Mostrar botão"
                checked={pageData.hero.buttonVisible}
                onChange={(v) =>
                  updateElement((d) => ({ ...d, hero: { ...d.hero, buttonVisible: v } }))
                }
              />
            </div>
          )}

          {selectedElementId === "featured.sectionTitle" && (
            <div className="space-y-5">
              <TextField
                label="Título da secção"
                value={pageData.featured.sectionTitle}
                onChange={(v) =>
                  updateElement((d) => ({
                    ...d,
                    featured: { ...d.featured, sectionTitle: v }
                  }))
                }
              />
              <VisibilitySwitch
                label="Mostrar secção"
                checked={pageData.featured.visible}
                onChange={(v) =>
                  updateElement((d) => ({
                    ...d,
                    featured: { ...d.featured, visible: v }
                  }))
                }
              />
            </div>
          )}

          {elementType === "card" && card && cardIndex >= 0 && (
            <div className="space-y-5">
              <ImageField
                label="Imagem do card"
                value={card.image}
                files={mediaLibrary}
                uploading={isUploading}
                onChange={(url) =>
                  updateElement((d) => {
                    const cards = [...d.featured.cards];
                    cards[cardIndex] = { ...cards[cardIndex], image: url };
                    return { ...d, featured: { ...d.featured, cards } };
                  })
                }
                onUpload={onUpload}
                onRemove={() =>
                  updateElement((d) => {
                    const cards = [...d.featured.cards];
                    cards[cardIndex] = { ...cards[cardIndex], image: "" };
                    return { ...d, featured: { ...d.featured, cards } };
                  })
                }
              />
              <TextField
                label="Título"
                value={card.title}
                onChange={(v) =>
                  updateElement((d) => {
                    const cards = [...d.featured.cards];
                    cards[cardIndex] = { ...cards[cardIndex], title: v };
                    return { ...d, featured: { ...d.featured, cards } };
                  })
                }
              />
              <TextField
                label="Link"
                value={card.link}
                onChange={(v) =>
                  updateElement((d) => {
                    const cards = [...d.featured.cards];
                    cards[cardIndex] = { ...cards[cardIndex], link: v };
                    return { ...d, featured: { ...d.featured, cards } };
                  })
                }
                placeholder="/studio-space"
              />
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm("Queres remover este card?")) return;
                  updateElement((d) => ({
                    ...d,
                    featured: {
                      ...d.featured,
                      cards: d.featured.cards.filter((c) => c.id !== card.id)
                    }
                  }));
                  setSelectedElement(null);
                }}
                className="w-full rounded-xl border border-red-500/20 bg-red-500/10 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/15"
              >
                Remover card
              </button>
            </div>
          )}

          {selectedElementId === "stats" && (
            <div className="space-y-4">
              {pageData.stats.map((stat, i) => (
                <div
                  key={stat.id}
                  className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <TextField
                    label="Número"
                    value={stat.value}
                    onChange={(v) =>
                      updateElement((d) => {
                        const stats = [...d.stats];
                        stats[i] = { ...stats[i], value: v };
                        return { ...d, stats };
                      })
                    }
                  />
                  <TextField
                    label="Descrição"
                    value={stat.label}
                    onChange={(v) =>
                      updateElement((d) => {
                        const stats = [...d.stats];
                        stats[i] = { ...stats[i], label: v };
                        return { ...d, stats };
                      })
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </aside>
  );
}
