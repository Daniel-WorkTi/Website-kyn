"use client";

import { ImageIcon, Plus, Trash2, Video, X } from "lucide-react";
import type { MediaFile } from "@/lib/admin/sections";

type FloatingEditPanelProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function FloatingEditPanel({ title, onClose, children }: FloatingEditPanelProps) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#0a0a0a]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      </div>
      {children}
    </div>
  );
}

export function MediaQuickActions({
  onPickLibrary,
  onUpload,
  onRemove,
  uploading
}: {
  onPickLibrary: () => void;
  onUpload: () => void;
  onRemove?: () => void;
  uploading?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={onPickLibrary}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
      >
        <ImageIcon className="size-4" strokeWidth={1.75} />
        Biblioteca
      </button>
      <button
        type="button"
        onClick={onUpload}
        disabled={uploading}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm text-zinc-200 transition hover:bg-white/[0.08] disabled:opacity-50"
      >
        <Video className="size-4" strokeWidth={1.75} />
        {uploading ? "A enviar…" : "Upload"}
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 py-2.5 text-sm text-red-300 transition hover:bg-red-500/15"
        >
          <Trash2 className="size-4" strokeWidth={1.75} />
          Remover
        </button>
      )}
    </div>
  );
}

export function AddMediaButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 border border-dashed border-white/15 bg-white/[0.02] py-10 text-sm text-zinc-400 transition hover:border-emerald-400/40 hover:bg-emerald-500/5 hover:text-emerald-300"
    >
      <Plus className="size-4" strokeWidth={1.75} />
      Adicionar mídia
    </button>
  );
}

export type { MediaFile };
