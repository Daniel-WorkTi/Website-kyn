"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  createDefaultPageEditorData,
  type DevicePreview,
  type EditableElementId,
  type PageEditorData
} from "@/lib/admin/editor-types";

type EditorStoreValue = {
  pageData: PageEditorData;
  selectedElementId: EditableElementId | null;
  devicePreview: DevicePreview;
  canUndo: boolean;
  setPageData: (data: PageEditorData) => void;
  setSelectedElement: (id: EditableElementId | null) => void;
  updateElement: (updater: (data: PageEditorData) => PageEditorData) => void;
  setDevicePreview: (device: DevicePreview) => void;
  undo: () => void;
  resetHistory: (data: PageEditorData) => void;
};

const EditorStoreContext = createContext<EditorStoreValue | null>(null);

export function EditorStoreProvider({
  initialData,
  onEdit,
  children
}: {
  initialData?: PageEditorData;
  onEdit?: () => void;
  children: ReactNode;
}) {
  const [pageData, setPageDataState] = useState<PageEditorData>(
    initialData ?? createDefaultPageEditorData()
  );
  const [selectedElementId, setSelectedElementId] = useState<EditableElementId | null>(null);
  const [devicePreview, setDevicePreview] = useState<DevicePreview>("desktop");
  const [history, setHistory] = useState<PageEditorData[]>([]);

  const setPageData = useCallback((data: PageEditorData) => {
    setPageDataState(data);
  }, []);

  const updateElement = useCallback((updater: (data: PageEditorData) => PageEditorData) => {
    setPageDataState((current) => {
      const next = updater(current);
      setHistory((h) => [...h.slice(-19), current]);
      onEdit?.();
      return next;
    });
  }, [onEdit]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setPageDataState(prev);
      return h.slice(0, -1);
    });
  }, []);

  const resetHistory = useCallback((data: PageEditorData) => {
    setPageDataState(data);
    setHistory([]);
    setSelectedElementId(null);
  }, []);

  const value = useMemo<EditorStoreValue>(
    () => ({
      pageData,
      selectedElementId,
      devicePreview,
      canUndo: history.length > 0,
      setPageData,
      setSelectedElement: setSelectedElementId,
      updateElement,
      setDevicePreview,
      undo,
      resetHistory
    }),
    [pageData, selectedElementId, devicePreview, history.length, setPageData, updateElement, undo, resetHistory]
  );

  return <EditorStoreContext.Provider value={value}>{children}</EditorStoreContext.Provider>;
}

export function useEditorStore(): EditorStoreValue {
  const ctx = useContext(EditorStoreContext);
  if (!ctx) throw new Error("useEditorStore must be used within EditorStoreProvider");
  return ctx;
}
