import { SECTIONS, guessMediaType, type MediaFile } from "./sections";
import { publicIdFromUrl } from "./media-utils";

const FETCH_OPTS: RequestInit = { credentials: "include" };
const FETCH_TIMEOUT_MS = 20_000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("O pedido demorou demasiado. Verifica a ligação e tenta outra vez.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function checkSession(): Promise<{ authenticated: boolean; user?: string }> {
  const res = await fetchWithTimeout("/api/session", FETCH_OPTS, 10_000);
  if (!res.ok) return { authenticated: false };
  return res.json();
}

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch("/api/login", {
    method: "POST",
    ...FETCH_OPTS,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Não foi possível entrar. Verifica os dados.");
}

export async function logout(): Promise<void> {
  await fetch("/api/logout", { method: "POST", ...FETCH_OPTS });
}

export async function loadContentFile<T>(file: string): Promise<{ data: T; sha: string | null }> {
  const apiPath = file.replace(/^content\//, "");
  const res = await fetchWithTimeout(`/content/${apiPath}?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Não foi possível carregar o conteúdo.");
  const data = (await res.json()) as T;

  let sha: string | null = null;
  try {
    const meta = await fetchWithTimeout(
      `/api/content?path=${encodeURIComponent(file)}`,
      FETCH_OPTS,
      10_000
    );
    if (meta.ok) {
      const m = await meta.json();
      sha = m.sha ?? null;
    }
  } catch {
    /* sha opcional em dev */
  }

  return { data, sha };
}

export async function saveContent(
  file: string,
  data: unknown,
  sha: string | null,
  label: string
): Promise<string | null> {
  const res = await fetch("/api/content", {
    method: "POST",
    ...FETCH_OPTS,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: file,
      content: JSON.stringify(data, null, 2) + "\n",
      message: `Atualizar ${label}`,
      sha
    })
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Erro ao guardar.");
  return result.sha ?? null;
}

function isVideoFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true;
  return /\.(mp4|webm|mov|m4v)$/i.test(file.name);
}

export async function uploadFile(file: File): Promise<string> {
  const resourceType = isVideoFile(file) ? "video" : "image";

  const signRes = await fetch("/api/cloudinary/sign", {
    method: "POST",
    ...FETCH_OPTS,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resourceType })
  });

  const sign = await signRes.json();
  if (!signRes.ok) throw new Error(sign.error || "Erro ao preparar envio.");

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.api_key);
  form.append("timestamp", String(sign.timestamp));
  form.append("signature", sign.signature);
  form.append("folder", sign.folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${sign.cloud_name}/${resourceType}/upload`;
  const uploadRes = await fetch(endpoint, { method: "POST", body: form });
  const result = await uploadRes.json();

  if (!uploadRes.ok) {
    throw new Error(result.error?.message || "Erro no envio para o Cloudinary.");
  }

  return result.secure_url as string;
}

function walkUrls(obj: unknown, urls: Set<string>): void {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((item) => walkUrls(item, urls));
    return;
  }
  for (const val of Object.values(obj as Record<string, unknown>)) {
    if (
      typeof val === "string" &&
      (val.startsWith("/assets/uploads/") || val.includes("res.cloudinary.com"))
    ) {
      urls.add(val);
    } else if (typeof val === "object") {
      walkUrls(val, urls);
    }
  }
}

async function collectMediaFromContent(): Promise<MediaFile[]> {
  const urls = new Set<string>();
  const contentSections = SECTIONS.filter((s) => s.file);

  await Promise.all(
    contentSections.map(async (section) => {
      try {
        const apiPath = section.file.replace(/^content\//, "");
        const res = await fetchWithTimeout(`/content/${apiPath}?t=${Date.now()}`, {
          cache: "no-store"
        }, 8_000);
        if (!res.ok) return;
        walkUrls(await res.json(), urls);
      } catch {
        /* ignore */
      }
    })
  );

  return [...urls].map((url) => ({
    url,
    name: url.split("/").pop() || url,
    type: guessMediaType(url),
    publicId: publicIdFromUrl(url) ?? undefined
  }));
}

function mergeMediaFiles(...lists: MediaFile[][]): MediaFile[] {
  const merged = new Map<string, MediaFile>();

  for (const list of lists) {
    for (const file of list) {
      const existing = merged.get(file.url);
      merged.set(file.url, existing ? { ...existing, ...file } : file);
    }
  }

  return [...merged.values()].sort((a, b) =>
    (b.createdAt || b.name).localeCompare(a.createdAt || a.name)
  );
}

export async function loadMediaLibrary(force = false, cache: MediaFile[] | null): Promise<MediaFile[]> {
  if (cache && !force) return cache;

  const fromContent = await collectMediaFromContent();
  let fromCloudinary: MediaFile[] = [];
  let configured = false;
  let apiError: string | null = null;

  try {
    const res = await fetchWithTimeout(`/api/media?t=${Date.now()}`, FETCH_OPTS, 15_000);
    const data = await res.json();

    if (res.ok) {
      configured = data.configured !== false;
      if (Array.isArray(data.files)) {
        fromCloudinary = data.files as MediaFile[];
      }
    } else {
      apiError = typeof data.error === "string" ? data.error : "Erro ao carregar biblioteca.";
    }
  } catch {
    apiError = "Não foi possível contactar a API de mídias.";
  }

  const files = mergeMediaFiles(fromCloudinary, fromContent);

  if (!configured && !files.length && apiError) {
    throw new Error(
      "Cloudinary não está configurado no servidor. Adiciona CLOUDINARY_URL nas variáveis de ambiente da Vercel."
    );
  }

  if (apiError && !fromCloudinary.length && fromContent.length) {
    return files;
  }

  if (apiError && !files.length) {
    throw new Error(apiError);
  }

  return files;
}

export async function deleteMediaFile(file: MediaFile): Promise<void> {
  const publicId = file.publicId ?? publicIdFromUrl(file.url);
  if (!publicId) throw new Error("Não foi possível identificar o ficheiro para remover.");

  const res = await fetch("/api/media", {
    method: "DELETE",
    ...FETCH_OPTS,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      publicId,
      type: file.type === "video" ? "video" : "image"
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao remover ficheiro.");
}

export type AdminSettings = {
  username: string;
  hasPassword: boolean;
};

async function parseApiError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return (data as { error?: string }).error || "Pedido falhou.";
}

export async function loadAdminSettings(): Promise<AdminSettings> {
  const res = await fetchWithTimeout("/api/admin/settings", FETCH_OPTS, 10_000);
  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json() as Promise<AdminSettings>;
}

export async function saveAdminUsername(username: string): Promise<AdminSettings> {
  const res = await fetch("/api/admin/settings", {
    method: "PUT",
    ...FETCH_OPTS,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  const data = (await res.json()) as { username: string; hasPassword: boolean };
  return { username: data.username, hasPassword: data.hasPassword };
}

export async function requestPasswordCode(payload: {
  newPassword: string;
  confirmPassword: string;
}): Promise<string> {
  const res = await fetch("/api/admin/settings/password", {
    method: "POST",
    ...FETCH_OPTS,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  const data = (await res.json()) as { message?: string };
  return data.message || "Código enviado.";
}

export async function confirmPasswordChange(code: string): Promise<void> {
  const res = await fetch("/api/admin/settings/password", {
    method: "PATCH",
    ...FETCH_OPTS,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });
  if (!res.ok) throw new Error(await parseApiError(res));
}
