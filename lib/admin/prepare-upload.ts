import { CLOUDINARY_MAX_UPLOAD_MB } from "@/lib/admin/sections";

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

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(file.name);
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
  maxBytes: number
): Promise<Blob> {
  const mimeType = pickVideoMimeType();
  const targetBytes = maxBytes * 0.9;
  const totalBps = Math.floor((targetBytes * 8) / duration);
  const videoBps = Math.max(350_000, Math.min(4_500_000, Math.floor(totalBps * 0.88)));
  const audioBps = Math.min(96_000, Math.floor(totalBps * 0.12));

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

async function compressVideo(file: File, maxBytes: number): Promise<File> {
  if (file.size <= maxBytes) return file;

  const { video, objectUrl, duration, width, height } = await loadVideoMetadata(file);

  try {
    let scale = Math.min(1, Math.sqrt((maxBytes * 0.92) / file.size));

    for (let pass = 0; pass < 4; pass++) {
      const targetWidth = Math.max(480, Math.floor(width * scale) & ~1);
      const targetHeight = Math.max(270, Math.floor(height * scale) & ~1);

      const blob = await recordVideoPass(
        video,
        file,
        targetWidth,
        targetHeight,
        duration,
        maxBytes
      );

      if (blob.size <= maxBytes) {
        return blobToVideoFile(blob, file);
      }

      scale *= 0.68;
    }

    throw new Error(
      `"${file.name}" (${formatMb(file.size)}) — não foi possível reduzir abaixo de ${limitLabel(maxBytes)}.`
    );
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}

async function compressImage(file: File, maxBytes: number): Promise<File> {
  if (file.size <= maxBytes) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      `"${file.name}" (${formatMb(file.size)}) — formato não suportado para optimização automática.`
    );
  }

  let width = bitmap.width;
  let height = bitmap.height;
  let quality = 0.88;

  const sizeRatio = file.size / maxBytes;
  if (sizeRatio > 1) {
    const scale = Math.min(0.95, 1 / Math.sqrt(sizeRatio * 1.05));
    width = Math.max(800, Math.floor(width * scale));
    height = Math.max(600, Math.floor(height * scale));
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error(`"${file.name}": não foi possível optimizar a imagem neste browser.`);
  }

  try {
    for (let attempt = 0; attempt < 10; attempt++) {
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(bitmap, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", quality);
      });

      if (!blob) break;

      if (blob.size <= maxBytes) {
        const base = file.name.replace(/\.[^.]+$/, "");
        return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
      }

      if (quality > 0.45) {
        quality -= 0.08;
      } else {
        width = Math.floor(width * 0.85);
        height = Math.floor(height * 0.85);
        quality = 0.82;
      }
    }

    throw new Error(
      `"${file.name}" (${formatMb(file.size)}) — não foi possível reduzir abaixo de ${limitLabel(maxBytes)}.`
    );
  } finally {
    bitmap.close();
  }
}

/** Reduz ficheiros grandes antes do envio (vídeo e imagem). */
export async function prepareFileForUpload(
  file: File,
  maxBytes: number,
  options?: { onProgress?: (message: string) => void }
): Promise<File> {
  if (file.size <= maxBytes) return file;

  const { onProgress } = options ?? {};
  const label = `"${file.name}" (${formatMb(file.size)})`;

  if (isVideoFile(file)) {
    onProgress?.(`A optimizar vídeo ${label}…`);
    const compressed = await compressVideo(file, maxBytes);
    if (compressed.size > maxBytes) {
      throw new Error(
        `${label} continua acima de ${limitLabel(maxBytes)} após optimização (${formatMb(compressed.size)}).`
      );
    }
    onProgress?.(`Vídeo optimizado: ${formatMb(compressed.size)}. A enviar…`);
    return compressed;
  }

  if (isImageFile(file)) {
    onProgress?.(`A optimizar imagem ${label}…`);
    const compressed = await compressImage(file, maxBytes);
    if (compressed.size > maxBytes) {
      throw new Error(
        `${label} continua acima de ${limitLabel(maxBytes)} após optimização (${formatMb(compressed.size)}).`
      );
    }
    onProgress?.(`Imagem optimizada: ${formatMb(compressed.size)}. A enviar…`);
    return compressed;
  }

  throw new Error(
    `${label} excede o máximo de ${CLOUDINARY_MAX_UPLOAD_MB} MB e este tipo de ficheiro não pode ser optimizado automaticamente.`
  );
}
