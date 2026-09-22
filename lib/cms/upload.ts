import { createClient } from "@/lib/supabase/client";
import {
  ALLOWED_IMAGE_MIME,
  ALLOWED_VIDEO_MIME,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
  MEDIA_BUCKET,
  RESUMABLE_UPLOAD_THRESHOLD_BYTES,
} from "@/lib/supabase/constants";
import {
  buildStoragePath,
  extensionForMime,
  publicUrlForPath,
} from "@/lib/supabase/media-url";

export type UploadProgress = {
  percent: number;
  phase: "uploading" | "saving" | "done" | "error";
  message?: string;
};

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isVideo(file: File): boolean {
  return file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
}

export function validateUploadFile(file: File): { kind: "image" | "video" } {
  const video = isVideo(file);
  if (video) {
    if (!ALLOWED_VIDEO_MIME.has(file.type) && !/\.(mp4|webm|mov)$/i.test(file.name)) {
      throw new Error(`Tipo de vídeo não suportado: ${file.type || file.name}`);
    }
    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      throw new Error(
        `"${file.name}" excede ${MAX_VIDEO_UPLOAD_BYTES / (1024 * 1024)} MB.`
      );
    }
    return { kind: "video" };
  }

  if (!ALLOWED_IMAGE_MIME.has(file.type)) {
    throw new Error(`Tipo de imagem não suportado: ${file.type || file.name}`);
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error(
      `"${file.name}" excede ${MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024)} MB.`
    );
  }
  return { kind: "image" };
}

async function uploadResumable(
  file: File,
  storagePath: string,
  onProgress?: (p: UploadProgress) => void
): Promise<void> {
  const { Upload } = await import("tus-js-client");
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Sessão expirada. Entra outra vez.");
  }

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
  // Hosted: hostname Storage directo (docs Supabase).
  const endpoint = projectUrl.includes(".supabase.co")
    ? `${projectUrl.replace(".supabase.co", ".storage.supabase.co")}/storage/v1/upload/resumable`
    : `${projectUrl}/storage/v1/upload/resumable`;

  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint,
      retryDelays: [0, 1000, 3000, 5000],
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "x-upsert": "false",
      },
      uploadDataDuringCreation: false,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: MEDIA_BUCKET,
        objectName: storagePath,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      },
      chunkSize: 6 * 1024 * 1024,
      onError(error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes("413") || /maximum size exceeded/i.test(msg)) {
          reject(
            new Error(
              "O Supabase rejeitou o ficheiro (limite de tamanho). Em Storage → Configuration sobe o Global file size limit para pelo menos 500 MB, e no bucket media define Restrict file size ≥ 500 MB."
            )
          );
          return;
        }
        reject(error instanceof Error ? error : new Error(msg));
      },
      onProgress(bytesUploaded, bytesTotal) {
        const percent = bytesTotal ? Math.round((bytesUploaded / bytesTotal) * 100) : 0;
        onProgress?.({ percent, phase: "uploading" });
      },
      onSuccess() {
        resolve();
      },
    });

    upload.findPreviousUploads().then((previous) => {
      if (previous.length > 0) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    });
  });
}

export async function uploadMediaFile(
  file: File,
  opts: {
    sectionId: string;
    onProgress?: (p: UploadProgress) => void;
  }
): Promise<{ url: string; storagePath: string; type: "image" | "video" }> {
  const { kind } = validateUploadFile(file);
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Entra outra vez.");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) throw new Error("Sem permissão de administrador.");

  const uuid = randomId();
  const ext = extensionForMime(
    file.type,
    kind === "video" ? "mp4" : "jpg"
  );
  const kindFolder = kind === "video" ? "videos" : "images";
  const storagePath = buildStoragePath({
    sectionId: opts.sectionId,
    kind: kindFolder,
    uuid,
    ext,
  });

  opts.onProgress?.({ percent: 0, phase: "uploading", message: `A enviar ${file.name}…` });

  if (kind === "video" && file.size >= RESUMABLE_UPLOAD_THRESHOLD_BYTES) {
    await uploadResumable(file, storagePath, opts.onProgress);
  } else {
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) throw new Error(error.message);
    opts.onProgress?.({ percent: 100, phase: "uploading" });
  }

  opts.onProgress?.({ percent: 100, phase: "done" });

  return {
    url: publicUrlForPath(storagePath),
    storagePath,
    type: kind,
  };
}

export async function deleteStoragePaths(paths: string[]): Promise<void> {
  const clean = paths.filter(Boolean);
  if (clean.length === 0) return;
  const supabase = createClient();
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove(clean);
  if (error) throw new Error(error.message);
}
