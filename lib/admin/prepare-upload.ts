import { IMAGE_MAX_EDGE_PX } from "@/lib/admin/sections";

/** Duração máxima do ficheiro persistido (segundos). */
export const VIDEO_PREVIEW_MAX_SECONDS = 10;
/** Tolerância de encoding na validação. */
export const VIDEO_PREVIEW_DURATION_TOLERANCE = 0.15;
/** Aresta máxima (portrait ou landscape). */
export const VIDEO_PREVIEW_MAX_EDGE = 1080;

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function limitLabel(maxBytes: number): string {
  return `${(maxBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isVideoFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true;
  return /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(file.name);
}

function isHeicFile(file: File): boolean {
  if (/heic|heif/i.test(file.type)) return true;
  return /\.(heic|heif)$/i.test(file.name);
}

function isImageFile(file: File): boolean {
  if (isHeicFile(file)) return true;
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name);
}

async function heicViaServer(file: File): Promise<ImageBitmap> {
  const form = new FormData();
  form.append("file", file, file.name || "photo.heic");

  const res = await fetch("/api/admin/convert-heic", {
    method: "POST",
    body: form,
    credentials: "same-origin",
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const json = (await res.json()) as { error?: string };
      if (json.error) detail = json.error;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  const blob = await res.blob();
  return createImageBitmap(blob);
}

async function heicFileToBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    /* fall through */
  }

  try {
    const { heicTo } = await import("heic-to");
    const converted = await heicTo({
      blob: file,
      type: "image/jpeg",
      quality: 0.92,
    });
    return await createImageBitmap(converted as Blob);
  } catch {
    /* fall through to server */
  }

  try {
    return await heicViaServer(file);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "erro desconhecido";
    throw new Error(
      `"${file.name}": não foi possível ler HEIC/HEIF (${detail}). Tenta Chrome/Edge ou exporta JPEG no iPhone.`
    );
  }
}

async function decodeImageToBitmap(file: File): Promise<ImageBitmap> {
  if (isHeicFile(file)) {
    return heicFileToBitmap(file);
  }

  try {
    return await createImageBitmap(file);
  } catch {
    if (/\.(heic|heif)$/i.test(file.name) || /heic|heif/i.test(file.type)) {
      return heicFileToBitmap(file);
    }
    throw new Error(
      `"${file.name}" (${formatMb(file.size)}) — formato não suportado para optimização automática.`
    );
  }
}

function fitWithinMaxEdge(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return {
      width: Math.max(2, width & ~1),
      height: Math.max(2, height & ~1),
    };
  }
  const scale = maxEdge / longest;
  return {
    width: Math.max(2, Math.floor(width * scale) & ~1),
    height: Math.max(2, Math.floor(height * scale) & ~1),
  };
}

/**
 * MediaRecorder: H.264 MP4 NÃO é fiável cross-browser.
 * Preferimos WebM VP9/VP8 (Chrome/Edge). Safari pode oferecer mp4.
 * H.264 normalização fica para o backfill FFmpeg.
 */
function pickVideoMimeType(): { mimeType: string; container: "webm" | "mp4" } {
  const candidates: Array<{ mimeType: string; container: "webm" | "mp4" }> = [
    { mimeType: "video/mp4;codecs=avc1.42E01E", container: "mp4" },
    { mimeType: "video/mp4", container: "mp4" },
    { mimeType: "video/webm;codecs=vp9", container: "webm" },
    { mimeType: "video/webm;codecs=vp8", container: "webm" },
    { mimeType: "video/webm", container: "webm" },
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c.mimeType)) {
      return c;
    }
  }
  return { mimeType: "video/webm", container: "webm" };
}

function blobToVideoFile(blob: Blob, original: File, container: "webm" | "mp4"): File {
  const base = original.name.replace(/\.[^.]+$/, "") || "video";
  const ext = container === "mp4" ? "mp4" : "webm";
  const type = blob.type || (container === "mp4" ? "video/mp4" : "video/webm");
  return new File([blob], `${base}-preview.${ext}`, { type });
}

async function loadVideoMetadata(file: File): Promise<{
  video: HTMLVideoElement;
  objectUrl: string;
  duration: number;
  width: number;
  height: number;
}> {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = objectUrl;
  video.playsInline = true;
  video.muted = true;
  video.defaultMuted = true;
  video.volume = 0;
  video.preload = "auto";

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () =>
        reject(
          new Error(
            "Não foi possível preparar este vídeo. Tenta novamente ou usa outro ficheiro."
          )
        );
    });
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    throw err;
  }

  const duration = video.duration;
  const width = video.videoWidth;
  const height = video.videoHeight;

  if (!duration || !Number.isFinite(duration) || duration <= 0 || !width || !height) {
    URL.revokeObjectURL(objectUrl);
    throw new Error(
      "Não foi possível preparar este vídeo. Tenta novamente ou usa outro ficheiro."
    );
  }

  return { video, objectUrl, duration, width, height };
}

function startCanvasDraw(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  let raf = 0;
  const draw = () => {
    if (!video.paused && !video.ended) {
      ctx.drawImage(video, 0, 0, width, height);
      raf = requestAnimationFrame(draw);
    }
  };
  draw();
  return () => cancelAnimationFrame(raf);
}

async function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  const target = Math.min(Math.max(0, time), Math.max(0, video.duration - 0.05));
  if (Math.abs(video.currentTime - target) < 0.01) return;
  await new Promise<void>((resolve, reject) => {
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("seek failed"));
    };
    const cleanup = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    try {
      video.currentTime = target;
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}

/** Tempo preferido para captura da capa (segundos). */
export const VIDEO_POSTER_TIME_SEC = 0.5;

async function waitRaf(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function sampleBrightness(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): number {
  // Amostra grelha 5×5 para detectar frame quase preto
  let sum = 0;
  let n = 0;
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      const px = Math.min(width - 1, Math.floor(((x + 0.5) / 5) * width));
      const py = Math.min(height - 1, Math.floor(((y + 0.5) / 5) * height));
      const d = ctx.getImageData(px, py, 1, 1).data;
      sum += (d[0] + d[1] + d[2]) / 3;
      n++;
    }
  }
  return n ? sum / n : 0;
}

function posterSeekTimes(duration: number): number[] {
  const safeMax = Math.max(0, (Number.isFinite(duration) ? duration : 10) - 0.05);
  const primary = Math.min(VIDEO_POSTER_TIME_SEC, safeMax);
  const candidates = [primary, 0.75, 1.0]
    .map((t) => Math.min(t, safeMax))
    .filter((t) => t >= 0);
  // únicos, ordenados
  return [...new Set(candidates.map((t) => Math.round(t * 1000) / 1000))];
}

/**
 * Capa automática = frame em ~0.5s (com seeked + fallback se preto).
 */
async function extractPosterFrame(
  video: HTMLVideoElement,
  width: number,
  height: number,
  originalName: string
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error(
      "Não foi possível preparar este vídeo. Tenta novamente ou usa outro ficheiro."
    );
  }

  // Garante metadata pronta
  if (video.readyState < 1) {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("metadata"));
    });
  }

  const times = posterSeekTimes(video.duration);
  let accepted = false;

  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    try {
      await seekVideo(video, t);
    } catch {
      continue;
    }
    // Espera frame decodificado após seeked
    if (video.readyState < 2) {
      await new Promise<void>((resolve) => {
        const onData = () => {
          video.removeEventListener("loadeddata", onData);
          resolve();
        };
        video.addEventListener("loadeddata", onData);
        window.setTimeout(resolve, 400);
      });
    }
    await waitRaf();
    ctx.drawImage(video, 0, 0, width, height);
    const brightness = sampleBrightness(ctx, width, height);
    const isLast = i === times.length - 1;
    if (brightness > 12 || isLast) {
      accepted = true;
      break;
    }
  }

  if (!accepted) {
    ctx.drawImage(video, 0, 0, width, height);
  }

  const blob =
    (await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", 0.92);
    })) ||
    (await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    }));

  if (!blob || blob.size <= 0 || width <= 0 || height <= 0) {
    throw new Error(
      "Não foi possível preparar este vídeo. Tenta novamente ou usa outro ficheiro."
    );
  }

  const base = originalName.replace(/\.[^.]+$/, "") || "poster";
  const ext = blob.type.includes("jpeg") ? "jpg" : "webp";
  return new File([blob], `${base}-poster.${ext}`, {
    type: blob.type || "image/webp",
  });
}

/**
 * Grava preview: 0→clipSeconds, sem áudio, escala exacta, via canvas.
 */
async function recordPreviewPass(
  video: HTMLVideoElement,
  file: File,
  targetWidth: number,
  targetHeight: number,
  clipSeconds: number,
  maxBytes: number,
  bitrateScale: number
): Promise<{ blob: Blob; container: "webm" | "mp4" }> {
  const { mimeType, container } = pickVideoMimeType();
  const targetBytes = maxBytes * 0.94;
  const totalBps = Math.floor((targetBytes * 8) / Math.max(clipSeconds, 0.5));
  const videoBps = Math.max(
    800_000,
    Math.min(12_000_000, Math.floor(totalBps * 0.95 * bitrateScale))
  );

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const canvasStream = canvas.captureStream(30);
  // Sem áudio — só tracks de vídeo do canvas
  const stream = new MediaStream(canvasStream.getVideoTracks());

  const chunks: BlobPart[] = [];
  let stopDraw: (() => void) | undefined;

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: videoBps,
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onerror = () => {
      stopDraw?.();
      stream.getTracks().forEach((t) => t.stop());
      finish(() =>
        reject(
          new Error(
            "Não foi possível preparar este vídeo. Tenta novamente ou usa outro ficheiro."
          )
        )
      );
    };

    recorder.onstop = () => {
      stopDraw?.();
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: mimeType.split(";")[0] });
      finish(() => resolve({ blob, container }));
    };

    const stopRecording = () => {
      try {
        video.pause();
      } catch {
        /* */
      }
      if (recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          /* */
        }
      }
    };

    const hardStopMs = Math.ceil(clipSeconds * 1000) + 200;
    const timer = window.setTimeout(stopRecording, hardStopMs);

    video.onended = () => {
      window.clearTimeout(timer);
      stopRecording();
    };

    video.ontimeupdate = () => {
      if (video.currentTime >= clipSeconds - 0.05) {
        window.clearTimeout(timer);
        stopRecording();
      }
    };

    recorder.start(250);
    video.currentTime = 0;
    stopDraw = startCanvasDraw(video, canvas, targetWidth, targetHeight);

    video.play().catch(() => {
      window.clearTimeout(timer);
      stopDraw?.();
      stream.getTracks().forEach((t) => t.stop());
      finish(() =>
        reject(
          new Error(
            "Não foi possível preparar este vídeo. Tenta novamente ou usa outro ficheiro."
          )
        )
      );
    });

    // Evita referência unused
    void file;
  });
}

async function validatePreparedVideo(
  blob: Blob,
  expectedMaxSeconds: number
): Promise<{
  duration: number;
  width: number;
  height: number;
}> {
  if (!blob || blob.size <= 0) {
    throw new Error(
      "Não foi possível preparar este vídeo. Tenta novamente ou usa outro ficheiro."
    );
  }

  const objectUrl = URL.createObjectURL(blob);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = objectUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () =>
        reject(
          new Error(
            "Não foi possível preparar este vídeo. Tenta novamente ou usa outro ficheiro."
          )
        );
    });

    const width = video.videoWidth;
    const height = video.videoHeight;

    let duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      // WebM do MediaRecorder muitas vezes sem duração no container —
      // confirma que decodifica e usa o teto esperado do clip.
      try {
        await video.play();
        await new Promise((r) => setTimeout(r, 120));
        video.pause();
        video.currentTime = 0;
      } catch {
        /* ignore */
      }
      duration = expectedMaxSeconds;
    }

    if (
      !duration ||
      duration <= 0 ||
      duration > VIDEO_PREVIEW_MAX_SECONDS + VIDEO_PREVIEW_DURATION_TOLERANCE ||
      !width ||
      !height
    ) {
      throw new Error(
        "Não foi possível preparar este vídeo. Tenta novamente ou usa outro ficheiro."
      );
    }

    return { duration, width, height };
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Pipeline definitivo: trim ≤10s, ≤1080p, sem áudio, poster first-frame.
 * O original longo NÃO é devolvido — só o preview final.
 */
async function prepareVideoPreview(
  file: File,
  maxBytes: number,
  onProgress?: (message: string) => void
): Promise<PreparedUpload> {
  onProgress?.(`A analisar vídeo…`);
  const { video, objectUrl, duration, width, height } = await loadVideoMetadata(file);

  try {
    const clipSeconds = Math.min(duration, VIDEO_PREVIEW_MAX_SECONDS);
    const { width: tw, height: th } = fitWithinMaxEdge(width, height, VIDEO_PREVIEW_MAX_EDGE);

    onProgress?.(
      `A gerar preview ${clipSeconds.toFixed(1)}s (${tw}×${th})…`
    );

    let best: { blob: Blob; container: "webm" | "mp4" } | null = null;
    let bitrateScale = 1;

    for (let pass = 0; pass < 8; pass++) {
      // Reinicia no início de cada passe
      try {
        video.pause();
        await seekVideo(video, 0);
      } catch {
        video.currentTime = 0;
      }

      onProgress?.(
        `A gerar preview (passe ${pass + 1}/8, ${tw}×${th})…`
      );

      const result = await recordPreviewPass(
        video,
        file,
        tw,
        th,
        clipSeconds,
        maxBytes,
        bitrateScale
      );

      if (!best || result.blob.size < best.blob.size) best = result;
      if (result.blob.size <= maxBytes && result.blob.size > 0) {
        best = result;
        break;
      }
      bitrateScale *= 0.72;
    }

    if (!best || best.blob.size <= 0) {
      throw new Error(
        "Não foi possível preparar este vídeo. Tenta novamente ou usa outro ficheiro."
      );
    }

    if (best.blob.size > maxBytes) {
      throw new Error(
        `"${file.name}" — preview ainda acima de ${limitLabel(maxBytes)} (${formatMb(best.blob.size)}). Tenta Chrome/Edge ou um excerto mais leve.`
      );
    }

    onProgress?.("A validar preview…");
    const validated = await validatePreparedVideo(best.blob, clipSeconds);
    const outFile = blobToVideoFile(best.blob, file, best.container);

    onProgress?.("A gerar capa (frame 0.5s)…");
    let posterFile: File;
    try {
      posterFile = await extractPosterFrame(video, tw, th, file.name);
    } catch {
      const tmpUrl = URL.createObjectURL(best.blob);
      const tmpVideo = document.createElement("video");
      tmpVideo.src = tmpUrl;
      tmpVideo.muted = true;
      tmpVideo.playsInline = true;
      await new Promise<void>((resolve, reject) => {
        tmpVideo.onloadedmetadata = () => resolve();
        tmpVideo.onerror = () => reject(new Error("poster"));
      });
      try {
        posterFile = await extractPosterFrame(
          tmpVideo,
          validated.width,
          validated.height,
          file.name
        );
      } finally {
        tmpVideo.removeAttribute("src");
        tmpVideo.load();
        URL.revokeObjectURL(tmpUrl);
      }
    }

    onProgress?.(
      `Preview pronto: ${validated.duration.toFixed(1)}s · ${validated.width}×${validated.height} · ${formatMb(outFile.size)}`
    );

    return {
      file: outFile,
      posterFile,
      duration: validated.duration,
      width: validated.width,
      height: validated.height,
    };
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}

async function compressImage(file: File, maxBytes: number): Promise<File> {
  const bitmap = await decodeImageToBitmap(file);

  let { width, height } = fitWithinMaxEdge(bitmap.width, bitmap.height, IMAGE_MAX_EDGE_PX);
  let quality = 0.86;

  if (file.size > maxBytes * 3) {
    const fitted = fitWithinMaxEdge(width, height, Math.floor(IMAGE_MAX_EDGE_PX * 0.75));
    width = fitted.width;
    height = fitted.height;
    quality = 0.8;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error(`"${file.name}": não foi possível optimizar a imagem neste browser.`);
  }

  const base = file.name.replace(/\.[^.]+$/, "") || "image";

  try {
    for (let attempt = 0; attempt < 12; attempt++) {
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(bitmap, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", quality);
      });

      const finalBlob =
        blob ||
        (await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, "image/jpeg", quality);
        }));

      if (!finalBlob) break;

      const mime = finalBlob.type || "image/webp";
      const ext = mime.includes("jpeg") ? "jpg" : "webp";

      if (finalBlob.size <= maxBytes) {
        return new File([finalBlob], `${base}.${ext}`, { type: mime });
      }

      if (quality > 0.5) {
        quality -= 0.07;
      } else {
        width = Math.max(640, Math.floor(width * 0.82));
        height = Math.max(480, Math.floor(height * 0.82));
        quality = Math.min(0.78, quality + 0.05);
      }
    }

    throw new Error(
      `"${file.name}" (${formatMb(file.size)}) — não foi possível reduzir abaixo de ${limitLabel(maxBytes)}.`
    );
  } finally {
    bitmap.close();
  }
}

export type PreparedUpload = {
  file: File;
  posterFile?: File;
  duration?: number;
  width?: number;
  height?: number;
};

/** Prepara ficheiro para envio. Vídeos → sempre preview ≤10s + poster. */
export async function prepareFileForUpload(
  file: File,
  maxBytes: number,
  options?: { onProgress?: (message: string) => void }
): Promise<PreparedUpload> {
  const { onProgress } = options ?? {};
  const label = `"${file.name}" (${formatMb(file.size)})`;

  if (isVideoFile(file)) {
    try {
      return await prepareVideoPreview(file, maxBytes, onProgress);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes("Não foi possível preparar este vídeo")
      ) {
        throw err;
      }
      throw new Error(
        "Não foi possível preparar este vídeo. Tenta novamente ou usa outro ficheiro."
      );
    }
  }

  if (isImageFile(file)) {
    onProgress?.(
      isHeicFile(file)
        ? `A converter HEIC → WebP ${label}…`
        : `A converter para WebP ${label}…`
    );
    const compressed = await compressImage(file, maxBytes);
    if (compressed.size > maxBytes) {
      throw new Error(
        `${label} continua acima de ${limitLabel(maxBytes)} após optimização (${formatMb(compressed.size)}).`
      );
    }
    onProgress?.(`Imagem WebP pronta: ${formatMb(compressed.size)}. A enviar…`);
    return { file: compressed };
  }

  throw new Error(
    `${label} — tipo de ficheiro não suportado. Usa JPG, PNG, WebP, HEIC ou vídeo MP4/MOV.`
  );
}
