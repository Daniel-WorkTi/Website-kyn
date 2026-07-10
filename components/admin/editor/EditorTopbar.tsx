"use client";

import { Check, Eye, Loader2, Monitor, RefreshCw, RotateCcw, Smartphone } from "lucide-react";
import { useEditorStore } from "@/hooks/useEditorStore";
import type { DevicePreview } from "@/lib/admin/editor-types";

type EditorTopbarProps = {
  pageLabel: string;
  saving: boolean;
  uploading?: boolean;
  dirty?: boolean;
  previewOpen: boolean;
  onTogglePreview: () => void;
  onRefreshPreview?: () => void;
};

const DEVICES: { id: DevicePreview; label: string; icon: typeof Monitor }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "mobile", label: "Mobile", icon: Smartphone }
];

function SaveStatus({
  saving,
  uploading,
  dirty
}: {
  saving: boolean;
  uploading: boolean;
  dirty: boolean;
}) {
  const wrap = (tone: "neutral" | "warn" | "ok" | "dirty", content: React.ReactNode) => {
    const border =
      tone === "ok"
        ? "border-emerald-500/15"
        : tone === "dirty"
          ? "border-red-500/15"
          : tone === "warn"
            ? "border-amber-500/15"
            : "border-white/[0.06]";
    return (
      <div className={`flex items-center gap-2 border-l pl-3 ${border}`}>{content}</div>
    );
  };

  if (uploading) {
    return wrap(
      "warn",
      <>
        <Loader2 className="size-3 shrink-0 animate-spin text-amber-500/80" strokeWidth={2} />
        <span className="text-[11px] text-amber-500/90">A enviar ficheiro</span>
      </>
    );
  }

  if (saving) {
    return wrap(
      "warn",
      <>
        <Loader2 className="size-3 shrink-0 animate-spin text-amber-500/80" strokeWidth={2} />
        <span className="text-[11px] text-amber-500/90">A guardar</span>
      </>
    );
  }

  if (dirty) {
    return wrap(
      "dirty",
      <>
        <span className="size-1.5 shrink-0 rounded-full bg-red-500/90" aria-hidden />
        <span className="text-[11px] text-red-400/90">Por guardar</span>
      </>
    );
  }

  return wrap(
    "ok",
    <>
      <Check className="size-3 shrink-0 text-emerald-500/90" strokeWidth={2.25} />
      <span className="text-[11px] text-emerald-500/90">Guardado</span>
    </>
  );
}

export function EditorTopbar({
  pageLabel,
  saving,
  uploading = false,
  dirty = false,
  previewOpen,
  onTogglePreview,
  onRefreshPreview
}: EditorTopbarProps) {
  const { devicePreview, setDevicePreview, undo, canUndo } = useEditorStore();

  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-black px-4 py-3 md:px-5">
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">
          Página
        </p>
        <h1 className="truncate text-sm font-medium text-zinc-100 md:text-base">{pageLabel}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex rounded-md border border-white/[0.06] bg-white/[0.02] p-0.5">
          {DEVICES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              title={label}
              onClick={() => setDevicePreview(id)}
              className={[
                "flex items-center gap-1.5 rounded px-2 py-1.5 text-[11px] transition",
                devicePreview === id
                  ? "bg-white/[0.08] text-zinc-200"
                  : "text-zinc-600 hover:text-zinc-400"
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
            title="Atualizar pré-visualização"
            className="flex size-8 items-center justify-center rounded-md text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-300"
          >
            <RefreshCw className="size-3.5" strokeWidth={1.75} />
          </button>
        )}

        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          title="Desfazer"
          className="flex size-8 items-center justify-center rounded-md text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-300 disabled:opacity-30"
        >
          <RotateCcw className="size-3.5" strokeWidth={1.75} />
        </button>

        <button
          type="button"
          onClick={onTogglePreview}
          title="Abrir site público"
          className={[
            "hidden size-8 items-center justify-center rounded-md transition lg:flex",
            previewOpen
              ? "bg-white/[0.06] text-zinc-300"
              : "text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-300"
          ].join(" ")}
        >
          <Eye className="size-3.5" strokeWidth={1.75} />
        </button>

        <SaveStatus saving={saving} uploading={uploading} dirty={dirty} />
      </div>
    </header>
  );
}
