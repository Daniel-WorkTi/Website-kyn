import { createClient } from "@/lib/supabase/client";
import { loadSectionDocument, saveSectionDocument } from "@/lib/cms/section-document";
import { deleteStoragePaths, uploadMediaFile } from "@/lib/cms/upload";
import { resolveMediaUrl } from "@/lib/supabase/media-url";
import type { MediaFile } from "@/lib/admin/sections";
import type { SidebarSectionId } from "@/components/admin/AdminSidebar";
import type { SectionData } from "@/lib/admin/sections";

export async function checkSession(): Promise<{ authenticated: boolean; user?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { authenticated: false };

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    return { authenticated: false };
  }

  return { authenticated: true, user: user.email || user.id };
}

export async function login(email: string, password: string): Promise<void> {
  const trimmed = email.trim();
  if (!trimmed.includes("@")) {
    throw new Error("Usa o email da conta Supabase (não o utilizador antigo).");
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: trimmed,
    password,
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
      throw new Error("Email ou palavra-passe incorrectos.");
    }
    throw new Error(error.message || "Não foi possível entrar.");
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    throw new Error(
      "Esta conta não tem acesso de administrador. Adiciona o user_id em admin_profiles."
    );
  }
}

export async function logout(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export function getPasswordResetRedirectUrl(): string {
  if (typeof window === "undefined") {
    return "/auth/callback?next=/admin/reset-password";
  }
  return `${window.location.origin}/auth/callback?next=/admin/reset-password`;
}

/** Envia email de recuperação (Supabase Auth). */
export async function requestPasswordReset(email: string): Promise<void> {
  const trimmed = email.trim();
  if (!trimmed.includes("@")) {
    throw new Error("Indica um email válido.");
  }

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: getPasswordResetRedirectUrl(),
  });
  if (error) throw new Error(error.message || "Não foi possível enviar o email.");
}

/** Define nova palavra-passe após abrir o link do email. */
export async function completePasswordReset(password: string, confirmPassword: string): Promise<void> {
  if (password !== confirmPassword) {
    throw new Error("As palavras-passe não coincidem.");
  }
  if (password.length < 8) {
    throw new Error("A palavra-passe deve ter pelo menos 8 caracteres.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Link inválido ou expirado. Pede um novo email de recuperação.");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message || "Não foi possível actualizar a palavra-passe.");

  // Força novo login com a password nova.
  await supabase.auth.signOut();
}

export async function loadContentFile<T>(
  fileOrSection: string
): Promise<{ data: T; sha: string | null }> {
  const supabase = createClient();

  // Aceita path antigo "content/..." ou section id
  let sectionId = fileOrSection as SidebarSectionId;
  if (fileOrSection.startsWith("content/")) {
    const section = getSectionByIdFromFile(fileOrSection);
    if (!section) throw new Error("Secção não encontrada para o ficheiro.");
    sectionId = section;
  }

  const data = await loadSectionDocument(supabase, sectionId);
  return { data: data as T, sha: null };
}

function getSectionByIdFromFile(file: string): SidebarSectionId | null {
  const map: Record<string, SidebarSectionId> = {
    "content/site.json": "home",
    "content/team.json": "team",
    "content/partners.json": "partners",
    "content/galleries/studio-space.json": "studio-space",
    "content/galleries/multicam.json": "multicam",
    "content/galleries/aftermovie.json": "aftermovie",
    "content/galleries/photography.json": "photography",
    "content/galleries/fpv-drone.json": "fpv-drone",
    "content/galleries/social-media.json": "social-media",
  };
  return map[file] ?? null;
}

export async function saveContent(
  file: string,
  data: unknown,
  _sha: string | null = null,
  _label = ""
): Promise<string | null> {
  void _sha;
  void _label;
  const supabase = createClient();
  const sectionId = getSectionByIdFromFile(file);
  if (!sectionId) throw new Error("Secção desconhecida.");
  await saveSectionDocument(supabase, sectionId, data as SectionData);
  return null;
}

export async function uploadFile(
  file: File,
  sectionId = "home",
  extras?: {
    posterFile?: File;
    duration?: number;
    width?: number;
    height?: number;
  }
): Promise<{
  url: string;
  posterUrl?: string;
  storagePath: string;
  type: "image" | "video";
}> {
  const result = await uploadMediaFile(file, {
    sectionId,
    posterFile: extras?.posterFile,
    duration: extras?.duration,
    width: extras?.width,
    height: extras?.height,
  });
  return {
    url: result.url,
    posterUrl: result.posterUrl,
    storagePath: result.storagePath,
    type: result.type,
  };
}

export async function loadMediaLibrary(
  force = false,
  cache: MediaFile[] | null
): Promise<MediaFile[]> {
  if (cache && !force) return cache;

  const supabase = createClient();
  // Só a secção "library" — itens de gallery/home/hero são uso no site,
  // não entradas da biblioteca (senão cada upload aparece duplicado após guardar).
  const { data, error } = await supabase
    .from("media_items")
    .select("*")
    .eq("section_id", "library")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  const seen = new Set<string>();
  const files: MediaFile[] = [];

  for (const row of data || []) {
    const dedupeKey = row.storage_path || row.legacy_url || row.id;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const url = resolveMediaUrl({
      storagePath: row.storage_path,
      legacyUrl: row.legacy_url,
    });

    files.push({
      id: row.id,
      url,
      name: row.title || row.storage_path?.split("/").pop() || row.id,
      type: row.type === "video" ? "video" : "image",
      publicId: row.storage_path || row.id,
      size: row.file_size ?? undefined,
      width: row.width ?? undefined,
      height: row.height ?? undefined,
      createdAt: row.created_at,
    });
  }

  return files;
}

export async function deleteMediaFile(file: MediaFile): Promise<void> {
  const supabase = createClient();
  const storagePaths = new Set<string>();

  // Preferir apagar só a linha da biblioteca pelo id.
  if (file.id) {
    const { data: row } = await supabase
      .from("media_items")
      .select("id, storage_path, thumbnail_path, section_id")
      .eq("id", file.id)
      .maybeSingle();

    if (row) {
      if (row.storage_path) storagePaths.add(row.storage_path);
      if (row.thumbnail_path) storagePaths.add(row.thumbnail_path);
      await supabase.from("media_items").delete().eq("id", row.id);
    }
  } else if (file.publicId && !file.publicId.startsWith("http") && file.publicId.includes("/")) {
    const { data: byPath } = await supabase
      .from("media_items")
      .select("id, storage_path, thumbnail_path")
      .eq("section_id", "library")
      .eq("storage_path", file.publicId);

    for (const row of byPath || []) {
      if (row.storage_path) storagePaths.add(row.storage_path);
      if (row.thumbnail_path) storagePaths.add(row.thumbnail_path);
      await supabase.from("media_items").delete().eq("id", row.id);
    }

    if (!(byPath && byPath.length)) {
      storagePaths.add(file.publicId);
    }
  } else if (file.url) {
    const { data: byUrl } = await supabase
      .from("media_items")
      .select("id, storage_path, thumbnail_path")
      .eq("section_id", "library")
      .eq("legacy_url", file.url);

    for (const row of byUrl || []) {
      if (row.storage_path) storagePaths.add(row.storage_path);
      if (row.thumbnail_path) storagePaths.add(row.thumbnail_path);
      await supabase.from("media_items").delete().eq("id", row.id);
    }
  }

  // Só remove do Storage se nenhum outro sítio (galeria/home) ainda usa o ficheiro.
  for (const path of [...storagePaths]) {
    const { count } = await supabase
      .from("media_items")
      .select("id", { count: "exact", head: true })
      .eq("storage_path", path);

    if ((count ?? 0) > 0) {
      storagePaths.delete(path);
    }
  }

  if (storagePaths.size > 0) {
    await deleteStoragePaths([...storagePaths]);
  }
}

export type AdminSettings = {
  email: string;
  hasPassword: boolean;
};

export async function loadAdminSettings(): Promise<AdminSettings> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");
  return { email: user.email || "", hasPassword: true };
}

export async function saveAdminEmail(email: string): Promise<AdminSettings> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ email: email.trim() });
  if (error) throw new Error(error.message);
  return { email: email.trim(), hasPassword: true };
}

/** @deprecated usar saveAdminEmail */
export async function saveAdminUsername(email: string): Promise<AdminSettings> {
  return saveAdminEmail(email);
}

export async function updateAdminPassword(payload: {
  newPassword: string;
  confirmPassword: string;
}): Promise<string> {
  if (payload.newPassword !== payload.confirmPassword) {
    throw new Error("As palavras-passe não coincidem.");
  }
  if (payload.newPassword.length < 8) {
    throw new Error("A palavra-passe deve ter pelo menos 8 caracteres.");
  }
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: payload.newPassword });
  if (error) throw new Error(error.message);
  return "Palavra-passe actualizada.";
}

/** @deprecated usar updateAdminPassword */
export async function requestPasswordCode(payload: {
  newPassword: string;
  confirmPassword: string;
}): Promise<string> {
  return updateAdminPassword(payload);
}

export async function confirmPasswordChange(code: string): Promise<void> {
  void code;
}
