"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { DevicePreview } from "@/lib/admin/device-preview";

type EditorStoreValue = {
  devicePreview: DevicePreview;
  setDevicePreview: (device: DevicePreview) => void;
  /** Mantido para compatibilidade com a topbar — sem editor visual activo. */
  canUndo: boolean;
  undo: () => void;
};

const EditorStoreContext = createContext<EditorStoreValue | null>(null);

export function EditorStoreProvider({ children }: { children: ReactNode }) {
  const [devicePreview, setDevicePreviewState] = useState<DevicePreview>("desktop");
  const setDevicePreview = useCallback((device: DevicePreview) => {
    setDevicePreviewState(device);
  }, []);

  const value = useMemo<EditorStoreValue>(
    () => ({
      devicePreview,
      setDevicePreview,
      canUndo: false,
      undo: () => {}
    }),
    [devicePreview, setDevicePreview]
  );

  return <EditorStoreContext.Provider value={value}>{children}</EditorStoreContext.Provider>;
}

export function useEditorStore(): EditorStoreValue {
  const ctx = useContext(EditorStoreContext);
  if (!ctx) throw new Error("useEditorStore must be used within EditorStoreProvider");
  return ctx;
}
