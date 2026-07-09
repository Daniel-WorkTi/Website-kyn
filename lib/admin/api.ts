import { SECTIONS, guessMediaType, type MediaFile } from "./sections";

const FETCH_OPTS: RequestInit = { credentials: "include" };

export async function checkSession(): Promise<{ authenticated: boolean; user?: string }> {
  const res = await fetch("/api/session", FETCH_OPTS);
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
  const res = await fetch(`/content/${apiPath}?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Não foi possível carregar o conteúdo.");
  const data = (await res.json()) as T;

  let sha: string | null = null;
  try {
    const meta = await fetch(`/api/content?path=${encodeURIComponent(file)}`, FETCH_OPTS);
    if (meta.ok) {
      const m = await meta.json();
      sha = m.sha ?? null;
    }
  } catch {
    /* ignore */
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
  for (const section of SECTIONS) {
    try {
      const res = await fetch(`/content/${section.file.replace(/^content\//, "")}?t=${Date.now()}`, {
        cache: "no-store"
      });
      if (!res.ok) continue;
      walkUrls(await res.json(), urls);
    } catch {
      /* ignore */
    }
  }
  return [...urls].map((url) => ({
    url,
    name: url.split("/").pop() || url,
    type: guessMediaType(url)
  }));
}

export async function loadMediaLibrary(force = false, cache: MediaFile[] | null): Promise<MediaFile[]> {
  if (cache && !force) return cache;

  try {
    const res = await fetch(`/api/media?t=${Date.now()}`, FETCH_OPTS);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.files)) return data.files as MediaFile[];
    }
  } catch {
    /* ignore */
  }

  return collectMediaFromContent();
}

export async function deleteMediaFile(file: MediaFile): Promise<void> {
  const publicId = file.publicId;
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
