"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import type { SidebarSectionId } from "@/components/admin/AdminSidebar";
import type { ToastState, ToastType } from "@/components/admin/shared/Toast";
import {
  checkSession,
  loadContentFile,
  deleteMediaFile,
  loadMediaLibrary,
  login as apiLogin,
  logout as apiLogout,
  saveContent,
  uploadFile
} from "@/lib/admin/api";
import {
  getSectionById,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_MB,
  previewUrlForSection,
  type AdminSection,
  type MediaFile,
  type SectionData
} from "@/lib/admin/sections";

type AdminContextValue = {
  sessionChecked: boolean;
  authenticated: boolean;
  section: AdminSection;
  data: SectionData | null;
  sha: string | null;
  dirty: boolean;
  loading: boolean;
  saving: boolean;
  uploading: boolean;
  previewOpen: boolean;
  previewViewport: "desktop" | "mobile";
  toast: ToastState;
  mediaLibrary: MediaFile[];
  mediaLoading: boolean;
  previewKey: number;
  navigate: (id: SidebarSectionId) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  save: () => Promise<void>;
  setData: (data: SectionData) => void;
  markDirty: () => void;
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: () => void;
  processUpload: (file: File, onSuccess: (url: string, file: File) => void) => Promise<void>;
  refreshMediaLibrary: () => Promise<void>;
  deleteMedia: (file: MediaFile) => Promise<void>;
  togglePreview: (force?: boolean) => void;
  setPreviewViewport: (viewport: "desktop" | "mobile") => void;
  refreshPreview: () => void;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [sectionId, setSectionId] = useState<SidebarSectionId>("home");
  const [data, setDataState] = useState<SectionData | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");
  const [toast, setToast] = useState<ToastState>(null);
  const [mediaLibrary, setMediaLibrary] = useState<MediaFile[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const mediaCacheRef = useRef<MediaFile[] | null>(null);
  const section = getSectionById(sectionId);

  useEffect(() => {
    checkSession()
      .then((res) => setAuthenticated(res.authenticated))
      .catch(() => setAuthenticated(false))
      .finally(() => setSessionChecked(true));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "ok") => {
    setToast({ message, type });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const markDirty = useCallback(() => setDirty(true), []);

  const setData = useCallback((next: SectionData) => {
    setDataState(next);
  }, []);

  const refreshMediaLibrary = useCallback(async () => {
    setMediaLoading(true);
    try {
      mediaCacheRef.current = null;
      const files = await loadMediaLibrary(true, null);
      mediaCacheRef.current = files;
      setMediaLibrary(files);
    } finally {
      setMediaLoading(false);
    }
  }, []);

  const loadSection = useCallback(
    async (id: SidebarSectionId, skipDirtyCheck = false) => {
      if (!skipDirtyCheck && dirty) {
        const ok = window.confirm("Tens alterações por guardar. Queres continuar sem guardar?");
        if (!ok) return;
      }

      const nextSection = getSectionById(id);
      setSectionId(id);
      setDirty(false);

      if (nextSection.type === "media") {
        setLoading(true);
        setDataState(null);
        setSha(null);
        try {
          const files = await loadMediaLibrary(true, null);
          mediaCacheRef.current = files;
          setMediaLibrary(files);
        } catch (err) {
          showToast(err instanceof Error ? err.message : "Erro ao carregar mídias.", "error");
        } finally {
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const { data: loaded, sha: loadedSha } = await loadContentFile<SectionData>(nextSection.file);
        setDataState(loaded);
        setSha(loadedSha);
        setPreviewKey((k) => k + 1);

        const files = await loadMediaLibrary(false, mediaCacheRef.current);
        mediaCacheRef.current = files;
        setMediaLibrary(files);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Erro ao carregar.", "error");
        setDataState(null);
      } finally {
        setLoading(false);
      }
    },
    [dirty, showToast]
  );

  useEffect(() => {
    if (authenticated) {
      loadSection("home", true);
    }
  }, [authenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigate = useCallback(
    (id: SidebarSectionId) => {
      if (id === sectionId) return;
      loadSection(id);
    },
    [loadSection, sectionId]
  );

  const login = useCallback(
    async (username: string, password: string) => {
      await apiLogin(username, password);
      setAuthenticated(true);
      await loadSection("home", true);
    },
    [loadSection]
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setAuthenticated(false);
    setDataState(null);
    setDirty(false);
  }, []);

  const processUpload = useCallback(
    async (file: File, onSuccess: (url: string, file: File) => void) => {
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error(
          `Este ficheiro é demasiado grande (máximo ${MAX_UPLOAD_MB} MB). Tenta comprimir antes de enviar.`
        );
      }
      showToast(`A enviar ${file.name}…`, "pending");
      setUploadCount((c) => c + 1);
      try {
        const url = await uploadFile(file);
        onSuccess(url, file);
        mediaCacheRef.current = null;
        markDirty();
        showToast("Ficheiro enviado! Não te esqueças de guardar.", "ok");
        await refreshMediaLibrary();
      } finally {
        setUploadCount((c) => Math.max(0, c - 1));
      }
    },
    [markDirty, showToast, refreshMediaLibrary]
  );

  const deleteMedia = useCallback(
    async (file: MediaFile) => {
      await deleteMediaFile(file);
      mediaCacheRef.current = null;
      await refreshMediaLibrary();
      showToast("Mídia removida.", "ok");
    },
    [refreshMediaLibrary, showToast]
  );

  const save = useCallback(async () => {
    if (!data) return;
    setSaving(true);
    try {
      const newSha = await saveContent(section.file, data, sha, section.label);
      setSha(newSha);
      setDirty(false);
      mediaCacheRef.current = null;
      showToast("Alterações guardadas! O site atualiza em cerca de 1 minuto.", "ok");
      setPreviewKey((k) => k + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao guardar.";
      showToast(message, "error");
      if (message.includes("Sessão")) {
        setAuthenticated(false);
      }
    } finally {
      setSaving(false);
    }
  }, [data, section, sha, showToast]);

  const togglePreview = useCallback((force?: boolean) => {
    setPreviewOpen((prev) => (typeof force === "boolean" ? force : !prev));
  }, []);

  const refreshPreview = useCallback(() => {
    setPreviewKey((k) => k + 1);
  }, []);

  const value = useMemo<AdminContextValue>(
    () => ({
      sessionChecked,
      authenticated,
      section,
      data,
      sha,
      dirty,
      loading,
      saving,
      uploading: uploadCount > 0,
      previewOpen,
      previewViewport,
      toast,
      mediaLibrary,
      mediaLoading,
      previewKey,
      navigate,
      login,
      logout,
      save,
      setData,
      markDirty,
      showToast,
      dismissToast,
      processUpload,
      refreshMediaLibrary,
      deleteMedia,
      togglePreview,
      setPreviewViewport,
      refreshPreview
    }),
    [
      sessionChecked,
      authenticated,
      section,
      data,
      sha,
      dirty,
      loading,
      saving,
      uploadCount,
      previewOpen,
      previewViewport,
      toast,
      mediaLibrary,
      mediaLoading,
      previewKey,
      navigate,
      login,
      logout,
      save,
      setData,
      markDirty,
      showToast,
      dismissToast,
      processUpload,
      refreshMediaLibrary,
      deleteMedia,
      togglePreview,
      setPreviewViewport,
      refreshPreview
    ]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}

export { previewUrlForSection };
