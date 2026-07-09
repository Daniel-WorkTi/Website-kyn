"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { MediaItem } from "@/lib/types";

type LightboxMedia = Pick<MediaItem, "type" | "src" | "alt" | "poster">;

interface LightboxContextValue {
  open: (media: LightboxMedia) => void;
}

const LightboxContext = createContext<LightboxContextValue>({
  open: () => {},
});

export function useLightbox() {
  return useContext(LightboxContext);
}

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [media, setMedia] = useState<LightboxMedia | null>(null);

  const open = useCallback((item: LightboxMedia) => {
    setMedia(item);
    document.body.style.overflow = "hidden";
  }, []);

  const close = useCallback(() => {
    setMedia(null);
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    if (!media) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [media, close]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <LightboxContext.Provider value={{ open }}>
      {children}
      <div
        className={`lightbox${media ? " is-open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        role="dialog"
        aria-modal={!!media}
        aria-hidden={!media}
      >
        <button
          type="button"
          className="lightbox__close"
          aria-label="Fechar"
          onClick={close}
        >
          &times;
        </button>
        <div className="lightbox__content">
          {media?.type === "video" ? (
            <video src={media.src} controls autoPlay playsInline />
          ) : media ? (
            <img src={media.src} alt={media.alt || ""} />
          ) : null}
        </div>
      </div>
    </LightboxContext.Provider>
  );
}
