import { IMAGE_MAX_EDGE_PX } from "@/lib/admin/sections";

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
  // 1) Safari / browsers com suporte nativo a HEIC
  try {
    return await createImageBitmap(file);
  } catch {
    /* fall through */
  }

  // 2) heic-to no browser (libheif actualizado — iOS 18+)
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

  // 3) Fallback no servidor (heic-convert)
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
    // Alguns browsers reportam type vazio mas o ficheiro é HEIC
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
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale))
  };
}

function pickVideoMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm"
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "video/webm";
}

function captureStreamFromVideo(video: HTMLVideoElement): MediaStream {
  const el = video as HTMLVideoElement & {
    captureStream?: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
  };
  if (el.captureStream) return el.captureStream();
  if (el.mozCaptureStream) return el.mozCaptureStream();
  throw new Error(
    "O browser não suporta optimização automática de vídeo. Tenta Chrome ou Edge."
  );
}

function blobToVideoFile(blob: Blob, original: File): File {
  const ext = blob.type.includes("webm") ? "webm" : "mp4";
  const base = original.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${base}-optim.${ext}`, { type: blob.type || "video/webm" });
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
  video.volume = 0;
  video.preload = "auto";

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () =>
      reject(new Error(`"${file.name}": não foi possível ler o vídeo para optimização.`));
  });

  const duration = video.duration;
  const width = video.videoWidth;
  const height = video.videoHeight;

  if (!duration || !Number.isFinite(duration) || duration <= 0) {
    URL.revokeObjectURL(objectUrl);
    throw new Error(`"${file.name}": duração do vídeo inválida.`);
  }
  if (!width || !height) {
    URL.revokeObjectURL(objectUrl);
    throw new Error(`"${file.name}": não foi possível ler as dimensões do vídeo.`);
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
    if (!video.ended) {
      ctx.drawImage(video, 0, 0, width, height);
      raf = requestAnimationFrame(draw);
    }
  };
  draw();
  return () => cancelAnimationFrame(raf);
}

async function recordVideoPass(
  video: HTMLVideoElement,
  file: File,
  targetWidth: number,
  targetHeight: number,
  duration: number,
  maxBytes: number,
  bitrateScale = 1
): Promise<Blob> {
  const mimeType = pickVideoMimeType();
  const targetBytes = maxBytes * 0.94;
  const totalBps = Math.floor((targetBytes * 8) / Math.max(duration, 0.5));
  // Qualidade: bitrate alto quando o teto e a duração permitem (até ~14 Mbps).
  const videoBps = Math.max(
    600_000,
    Math.min(14_000_000, Math.floor(totalBps * 0.9 * bitrateScale))
  );
  const audioBps = Math.min(160_000, Math.max(64_000, Math.floor(totalBps * 0.08)));

  const needScale = targetWidth !== video.videoWidth || targetHeight !== video.videoHeight;

  let stream: MediaStream;
  let stopDraw: (() => void) | undefined;
  let canvas: HTMLCanvasElement | undefined;

  if (needScale) {
    canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const canvasStream = canvas.captureStream(30);
    const sourceStream = captureStreamFromVideo(video);
    sourceStream.getAudioTracks().forEach((track) => canvasStream.addTrack(track));
    stream = canvasStream;
  } else {
    stream = captureStreamFromVideo(video);
  }

  const chunks: BlobPart[] = [];

  return new Promise<Blob>((resolve, reject) => {
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: videoBps,
      audioBitsPerSecond: audioBps
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onerror = () => {
      stopDraw?.();
      stream.getTracks().forEach((t) => t.stop());
      reject(new Error(`"${file.name}": erro ao comprimir o vídeo.`));
    };

    recorder.onstop = () => {
      stopDraw?.();
      stream.getTracks().forEach((t) => t.stop());
      resolve(new Blob(chunks, { type: mimeType.split(";")[0] }));
    };

    video.onended = () => {
      if (recorder.state !== "inactive") recorder.stop();
    };

    recorder.start(1000);
    video.currentTime = 0;

    const playPromise = video.play();
    if (needScale && canvas) {
      stopDraw = startCanvasDraw(video, canvas, targetWidth, targetHeight);
    }

    playPromise.catch(() => {
      if (recorder.state !== "inactive") recorder.stop();
      reject(new Error(`"${file.name}": não foi possível reproduzir o vídeo para optimização.`));
    });
  });
}

/**
 * Comprime até maxBytes privilegiando qualidade:
 * 1) resolução original + bitrate adequado ao teto
 * 2) só depois reduz bitrate / escala gradualmente
 */
async function compressVideo(
  file: File,
  maxBytes: number,
  onProgress?: (message: string) => void
): Promise<File> {
  if (file.size <= maxBytes) return file;

  const { video, objectUrl, duration, width, height } = await loadVideoMetadata(file);

  try {
    let best: Blob | null = null;
    let scale = 1;
    let bitrateScale = 1;

    // Até 10 passes: qualidade alta → mais agressivo só se ainda passar do limite
    for (let pass = 0; pass < 10; pass++) {
      const targetWidth = Math.max(640, Math.floor(width * scale) & ~1);
      const targetHeight = Math.max(360, Math.floor(height * scale) & ~1);

      onProgress?.(
        `A optimizar vídeo (passe ${pass + 1}/10, ${targetWidth}×${targetHeight})…`
      );

      const blob = await recordVideoPass(
        video,
        file,
        targetWidth,
        targetHeight,
        duration,
        maxBytes,
        bitrateScale
      );

      if (!best || blob.size < best.size) best = blob;

      if (blob.size <= maxBytes) {
        return blobToVideoFile(blob, file);
      }

      // Primeiro reduz bitrate; depois escala (preserva mais detalhe no início)
      if (pass < 3) {
        bitrateScale *= 0.72;
      } else {
        scale *= 0.82;
        bitrateScale *= 0.85;
      }
    }

    if (best && best.size <= maxBytes) {
      return blobToVideoFile(best, file);
    }

    throw new Error(
      `"${file.name}" (${formatMb(file.size)}) — não foi possível reduzir abaixo de ${limitLabel(maxBytes)} após várias passagens. Tenta um excerto mais curto ou Chrome/Edge.`
    );
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Converte qualquer imagem (incl. HEIC) para WebP leve.
 * Sempre produz WebP — mesmo ficheiros pequenos — para uniformizar o Storage.
 */
async function compressImage(file: File, maxBytes: number): Promise<File> {
  const bitmap = await decodeImageToBitmap(file);

  let { width, height } = fitWithinMaxEdge(bitmap.width, bitmap.height, IMAGE_MAX_EDGE_PX);
  let quality = 0.86;

  // Se o original é enorme, começa já mais agressivo
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

      // Fallback JPEG se o browser não exportar WebP
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

/** Reduz ficheiros grandes antes do envio (vídeo e imagem → WebP). */
export async function prepareFileForUpload(
  file: File,
  maxBytes: number,
  options?: { onProgress?: (message: string) => void }
): Promise<File> {
  const { onProgress } = options ?? {};
  const label = `"${file.name}" (${formatMb(file.size)})`;

  if (isVideoFile(file)) {
    if (file.size <= maxBytes) return file;
    onProgress?.(`A preparar vídeo ${label}…`);
    const compressed = await compressVideo(file, maxBytes, onProgress);
    if (compressed.size > maxBytes) {
      throw new Error(
        `${label} continua acima de ${limitLabel(maxBytes)} após optimização (${formatMb(compressed.size)}).`
      );
    }
    onProgress?.(`Vídeo optimizado: ${formatMb(compressed.size)}. A enviar…`);
    return compressed;
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
    return compressed;
  }

  throw new Error(
    `${label} — tipo de ficheiro não suportado. Usa JPG, PNG, WebP, HEIC ou vídeo MP4/MOV.`
  );
}
