/**
 * Capa automática de vídeo = frame congelado aos ~3s.
 * Sem imagem de poster manual — o próprio <video> pausado é a capa.
 */
export const VIDEO_IDLE_FRAME_SEC = 3;

/** Fila serial: no máximo 1 seek/metadata de cada vez (evita stall no first paint). */
let freezeQueue: Promise<void> = Promise.resolve();

export function enqueueVideoIdleFreeze(task: () => Promise<void>): Promise<void> {
  const run = freezeQueue.then(task, task);
  freezeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export function idleFrameTime(duration: number): number {
  const dur = Number.isFinite(duration) && duration > 0 ? duration : VIDEO_IDLE_FRAME_SEC;
  return Math.min(VIDEO_IDLE_FRAME_SEC, Math.max(0, dur - 0.05));
}

/** Seek + pause no frame de capa. Não faz play. */
export async function freezeVideoAtIdleFrame(
  video: HTMLVideoElement,
  opts?: { timeoutMs?: number }
): Promise<void> {
  const timeoutMs = opts?.timeoutMs ?? 2500;

  try {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    if (video.preload === "none") {
      video.preload = "metadata";
    }
    try {
      video.load();
    } catch {
      /* ignore */
    }

    if (video.readyState < 1) {
      await new Promise<void>((resolve) => {
        const done = () => {
          video.removeEventListener("loadedmetadata", done);
          video.removeEventListener("error", done);
          resolve();
        };
        video.addEventListener("loadedmetadata", done);
        video.addEventListener("error", done);
        window.setTimeout(done, timeoutMs);
      });
    }

    const t = idleFrameTime(video.duration);
    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        resolve();
      };
      video.addEventListener("seeked", onSeeked);
      try {
        video.currentTime = t;
      } catch {
        resolve();
        return;
      }
      window.setTimeout(() => {
        video.removeEventListener("seeked", onSeeked);
        resolve();
      }, 1500);
    });

    try {
      video.pause();
    } catch {
      /* ignore */
    }
  } catch {
    /* fica preto até próxima tentativa / hover */
  }
}
