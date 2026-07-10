"use client";

import { Eye, Loader2, Monitor, RefreshCw, RotateCcw, Smartphone } from "lucide-react";
import { useEditorStore } from "@/hooks/useEditorStore";
import type { DevicePreview } from "@/lib/admin/editor-types";

type EditorTopbarProps = {
  pageLabel: string;
  saving: boolean;
  uploading?: boolean;
  previewOpen: boolean;
  onTogglePreview: () => void;
  onRefreshPreview?: () => void;
};

const DEVICES: { id: DevicePreview; label: string; icon: typeof Monitor }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "mobile", label: "Mobile", icon: Smartphone }
];

export function EditorTopbar({
  pageLabel,
  saving,
  uploading = false,
  previewOpen,
  onTogglePreview,
  onRefreshPreview
}: EditorTopbarProps) {
  const { devicePreview, setDevicePreview, undo, canUndo } = useEditorStore();

  const statusLabel = saving
    ? "A guardar…"
    : uploading
      ? "A enviar ficheiro…"
      : "Guardado";

  const statusClass = saving || uploading
    ? "border border-amber-500/30 bg-amber-500/10 text-amber-300"
    : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-black/60 px-4 py-3 backdrop-blur-md md:px-6">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Página atual</p>
        <h1 className="truncate text-base font-medium text-white md:text-lg">{pageLabel}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          {DEVICES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              title={label}
              onClick={() => setDevicePreview(id)}
              className={[
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition",
                devicePreview === id
                  ? "bg-white/[0.1] text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              ].join(" ")}
            >
              <Icon className="size-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {onRefreshPreview && (
          <button
            type="button"
            onClick={onRefreshPreview}
            title="Atualizar site"
            className="flex size-9 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
          >
            <RefreshCw className="size-4" strokeWidth={1.75} />
          </button>
        )}

        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          title="Desfazer"
          className="flex size-9 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
        >
          <RotateCcw className="size-4" strokeWidth={1.75} />
        </button>

        <button
          type="button"
          onClick={onTogglePreview}
          className={[
            "hidden items-center gap-2 rounded-lg border px-3 py-2 text-xs transition lg:inline-flex",
            previewOpen
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
              : "border-white/10 text-zinc-400 hover:bg-white/[0.06]"
          ].join(" ")}
        >
          <Eye className="size-3.5" strokeWidth={1.75} />
          Pré-visualizar
        </button>

        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium md:text-xs",
            statusClass
          ].join(" ")}
        >
          {(saving || uploading) && (
            <Loader2 className="size-3 animate-spin" strokeWidth={1.75} />
          )}
          {statusLabel}
        </span>
      </div>
    </header>
  );
}
