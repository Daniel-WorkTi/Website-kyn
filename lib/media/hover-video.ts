/**
 * Controlo exclusivo de preview por hover (site + admin).
 * Garante que só um <video> toca de cada vez.
 */
let activeVideo: HTMLVideoElement | null = null;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function canHoverFine(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export async function playHoverPreview(video: HTMLVideoElement): Promise<void> {
  if (prefersReducedMotion()) return;
  if (!canHoverFine()) return;

  if (activeVideo && activeVideo !== video) {
    try {
      activeVideo.pause();
      activeVideo.currentTime = 0;
    } catch {
      /* ignore */
    }
  }
  activeVideo = video;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  try {
    await video.play();
  } catch {
    /* AbortError / NotAllowed — mouse saiu rápido */
  }
}

export function pauseHoverPreview(video: HTMLVideoElement): void {
  try {
    video.pause();
    video.currentTime = 0;
  } catch {
    /* ignore */
  }
  if (activeVideo === video) activeVideo = null;
}
