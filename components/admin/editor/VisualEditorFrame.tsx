"use client";

import type { ReactNode } from "react";
import Nav from "@/components/site/Nav";
import { SiteChrome } from "@/components/site/SiteChrome";
import { useEditorStore } from "@/hooks/useEditorStore";
import { PREVIEW_NAV } from "./visual-editor-constants";
import "@/app/site.css";

type VisualEditorFrameProps = {
  children: ReactNode;
  onBackgroundClick?: () => void;
};

export function VisualEditorFrame({ children, onBackgroundClick }: VisualEditorFrameProps) {
  const { devicePreview } = useEditorStore();

  return (
    <>
      <div className="sidebar-scroll flex min-h-0 flex-1 justify-center overflow-auto bg-[#050505] p-4 md:p-6">
        <div
          className={[
            "relative overflow-hidden bg-black shadow-[0_24px_80px_rgba(0,0,0,0.45)] transition-[width]",
            devicePreview === "mobile"
              ? "w-[390px] rounded-[24px] border border-white/10"
              : "w-full max-w-none rounded-none border-0"
          ].join(" ")}
          onClick={onBackgroundClick}
        >
          <SiteChrome scoped>
            <Nav items={PREVIEW_NAV} />
            <main className="site-main">{children}</main>
          </SiteChrome>
        </div>
      </div>

      <p className="shrink-0 border-t border-white/[0.06] py-2 text-center text-xs text-zinc-600">
        Passa o rato sobre os elementos · Clica para trocar mídia ou editar texto
      </p>
    </>
  );
}
