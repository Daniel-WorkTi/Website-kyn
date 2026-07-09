"use client";

import { useEditorStore } from "@/hooks/useEditorStore";
import { EditableElement } from "@/components/admin/editor/EditableElement";
import type { DevicePreview } from "@/lib/admin/editor-types";

const DEVICE_WIDTH: Record<DevicePreview, string> = {
  desktop: "100%",
  mobile: "390px"
};

export function SitePreviewCanvas() {
  const { pageData, devicePreview, setSelectedElement } = useEditorStore();
  const { hero, featured, stats } = pageData;

  const titleSizeClass = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-5xl md:text-6xl"
  }[hero.titleSize];

  const titleAlignClass = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end"
  }[hero.titleAlign];

  return (
    <div
      className="flex min-h-0 flex-1 flex-col bg-[#050505] p-4 md:p-6"
      onClick={() => setSelectedElement(null)}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <div
          className="sidebar-scroll mx-auto flex min-h-0 w-full flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-2xl border border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
          style={{ maxWidth: DEVICE_WIDTH[devicePreview] }}
        >
          {/* Navbar */}
          <div className="flex h-12 items-center justify-end border-b border-white/10 px-4">
            <div className="flex gap-4 text-[10px] uppercase tracking-wider text-zinc-500">
              <span>Menu</span>
              <span>≡</span>
            </div>
          </div>

          {/* Hero */}
          {hero.visible && (
            <EditableElement id="hero" label="Editar Hero" className="m-0 rounded-none">
              <section className="relative min-h-[420px] overflow-hidden">
                <EditableElement id="hero.video" label="Editar vídeo" className="absolute inset-0 rounded-none">
                  <div className="absolute inset-0 bg-zinc-900">
                    {hero.mediaType === "video" && hero.videoSrc ? (
                      <video
                        src={hero.videoSrc}
                        className="h-full w-full object-cover opacity-80"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : hero.imageSrc ? (
                      <img src={hero.imageSrc} alt="" className="h-full w-full object-cover opacity-80" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
                  </div>
                </EditableElement>

                <div
                  className={`relative z-10 flex min-h-[420px] flex-col justify-center px-6 py-16 ${titleAlignClass}`}
                >
                  <EditableElement id="hero.title" label="Editar título">
                    <h1
                      className={`font-bold uppercase tracking-tight ${titleSizeClass}`}
                      style={{ color: hero.titleColor }}
                    >
                      {hero.title}
                    </h1>
                  </EditableElement>

                  <EditableElement id="hero.subtitle" label="Editar subtítulo" className="mt-4">
                    <p className="max-w-xl text-xs uppercase tracking-[0.2em] text-zinc-400 md:text-sm">
                      {hero.subtitle}
                    </p>
                  </EditableElement>

                  {hero.buttonVisible && (
                    <EditableElement id="hero.button" label="Editar botão" className="mt-8">
                      <span
                        className={[
                          "inline-block rounded-full px-6 py-2.5 text-xs font-semibold uppercase tracking-wider",
                          hero.buttonStyle === "primary"
                            ? "bg-white text-black"
                            : "border border-white/30 bg-transparent text-white"
                        ].join(" ")}
                      >
                        {hero.buttonText}
                      </span>
                    </EditableElement>
                  )}
                </div>
              </section>
            </EditableElement>
          )}

          {/* Featured */}
          {featured.visible && (
            <section className="border-t border-white/10 px-4 py-10 md:px-8">
              <EditableElement id="featured.sectionTitle" label="Editar secção" className="mb-6">
                <h2 className="text-center text-sm font-semibold uppercase tracking-[0.25em] text-zinc-400">
                  {featured.sectionTitle}
                </h2>
              </EditableElement>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                {featured.cards
                  .filter((c) => c.visible)
                  .map((card) => (
                    <EditableElement
                      key={card.id}
                      id={`featured.cards.${card.id}`}
                      label="Editar card"
                    >
                      <article className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50">
                        <div className="aspect-[4/3] overflow-hidden bg-zinc-800">
                          {card.image ? (
                            <img src={card.image} alt={card.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-zinc-600">
                              <span className="text-xs">Sem imagem</span>
                            </div>
                          )}
                        </div>
                        <p className="px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-white">
                          {card.title}
                        </p>
                      </article>
                    </EditableElement>
                  ))}
              </div>
            </section>
          )}

          {/* Stats */}
          <EditableElement id="stats" label="Editar estatísticas" className="m-0 rounded-none">
            <div className="mt-auto border-t border-white/10 bg-zinc-950/80 px-4 py-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.id} className="text-center">
                    <p className="text-lg font-semibold text-white md:text-xl">{stat.value}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </EditableElement>
        </div>

        <p className="mt-3 text-center text-xs text-zinc-600">
          Dica: clique em qualquer elemento do site para editar.
        </p>
      </div>
    </div>
  );
}
