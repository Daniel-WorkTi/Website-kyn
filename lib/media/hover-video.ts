/**
 * Controlo exclusivo de preview por hover/click (site + admin).
 * Garante que só um <video> toca de cada vez.
 * Idle = frame congelado aos ~3s (capa automática).
 */
import { idleFrameTime, VIDEO_IDLE_FRAME_SEC } from "@/lib/media/video-idle-frame";

let activeVideo: HTMLVideoElement | null = null;
const playingListeners = new WeakMap<HTMLVideoElement, (playing: boolean) => void>();

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function canHoverFine(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function setPlayingListener(
  video: HTMLVideoElement,
  listener: ((playing: boolean) => void) | null
): void {
  if (listener) playingListeners.set(video, listener);
  else playingListeners.delete(video);
}

function notifyPlaying(video: HTMLVideoElement, playing: boolean): void {
  playingListeners.get(video)?.(playing);
}

function seekToIdleFrame(video: HTMLVideoElement): void {
  try {
    const dur = Number.isFinite(video.duration) ? video.duration : VIDEO_IDLE_FRAME_SEC;
    video.currentTime = idleFrameTime(dur);
  } catch {
    /* ignore */
  }
}

function stopVideoImmediate(video: HTMLVideoElement): void {
  try {
    video.pause();
  } catch {
    /* ignore */
  }
  notifyPlaying(video, false);
  seekToIdleFrame(video);
}

export async function playHoverPreview(video: HTMLVideoElement): Promise<void> {
  if (prefersReducedMotion()) return;

  if (activeVideo && activeVideo !== video) {
    stopVideoImmediate(activeVideo);
  }
  activeVideo = video;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;

  try {
    if (video.readyState < 2) {
      video.load();
      await new Promise<void>((resolve) => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          video.removeEventListener("loadeddata", done);
          video.removeEventListener("canplay", done);
          window.clearTimeout(timer);
          resolve();
        };
        const timer = window.setTimeout(done, 2500);
        video.addEventListener("loadeddata", done);
        video.addEventListener("canplay", done);
      });
    }
    if (activeVideo !== video) return;
    try {
      video.currentTime = 0;
    } catch {
      /* */
    }
    await video.play();
    if (activeVideo === video) {
      notifyPlaying(video, true);
    } else {
      stopVideoImmediate(video);
    }
  } catch {
    notifyPlaying(video, false);
  }
}

export function pauseHoverPreview(video: HTMLVideoElement): void {
  notifyPlaying(video, false);
  try {
    video.pause();
  } catch {
    /* ignore */
  }
  seekToIdleFrame(video);
  if (activeVideo === video) activeVideo = null;
}
