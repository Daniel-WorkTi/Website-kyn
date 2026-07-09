"use client";

import { useState } from "react";
import { FolderOpen, ImageIcon, Trash2, Video } from "lucide-react";
import { MediaPickerModal } from "@/components/admin/media/MediaPickerModal";
import {
  formatDimensions,
  formatDuration,
  formatFileSize,
  formatMediaDate
} from "@/lib/admin/media-utils";
import type { MediaFile } from "@/lib/admin/sections";
import { UploadField } from "./UploadField";

type MediaPickerFieldProps = {
  label: string;
  value: string;
  type: "image" | "video";
  files: MediaFile[];
  onChange: (url: string) => void;
  onUpload?: (file: File) => Promise<string | void>;
  uploading?: boolean;
  onRemove?: () => void;
  hint?: string;
  formatsLabel?: string;
  maxSizeLabel?: string;
};

export function MediaPickerField({
  label,
  value,
  type,
  files,
  onChange,
  onUpload,
  uploading,
  onRemove,
  hint,
  formatsLabel,
  maxSizeLabel
}: MediaPickerFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const fileMeta = files.find((f) => f.url === value);

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-zinc-300">{label}</span>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
        <div className="relative aspect-video bg-zinc-900">
          {value ? (
            type === "video" ? (
              <video src={value} className="h-full w-full object-cover" muted playsInline controls />
            ) : (
              <img src={value} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-600">
              {type === "video" ? (
                <Video className="size-8" strokeWidth={1.5} />
              ) : (
                <ImageIcon className="size-8" strokeWidth={1.5} />
              )}
              <span className="text-xs">Nenhuma mídia selecionada</span>
            </div>
          )}
        </div>
      </div>

      {fileMeta && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-zinc-500 space-y-1">
          <p className="truncate text-zinc-300">{fileMeta.name}</p>
          <p>{formatFileSize(fileMeta.size)} · {formatMediaDate(fileMeta.createdAt)}</p>
          {type === "image" && <p>{formatDimensions(fileMeta)}</p>}
          {type === "video" && <p>Duração: {formatDuration(fileMeta.duration)}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {onUpload && (
          <UploadField
            label="Fazer upload"
            accept={type === "video" ? "video/mp4,video/webm,video/*" : "image/jpeg,image/png,image/webp,image/*"}
            uploading={uploading}
            onFile={async (file) => {
              const url = await onUpload(file);
              if (typeof url === "string") onChange(url);
            }}
          />
        )}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
        >
          <FolderOpen className="size-4" strokeWidth={1.75} />
          Biblioteca
        </button>
        {value && (
          <button
            type="button"
            onClick={() => setReplaceOpen(true)}
            className="col-span-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
          >
            Substituir
          </button>
        )}
        {onRemove && value && (
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

      {(formatsLabel || maxSizeLabel || hint) && (
        <div className="text-xs text-zinc-600 space-y-0.5">
          {formatsLabel && <p>Formatos: {formatsLabel}</p>}
          {maxSizeLabel && <p>Máximo: {maxSizeLabel}</p>}
          {hint && <p>{hint}</p>}
          {uploading && <p className="text-emerald-400">A enviar ficheiro…</p>}
        </div>
      )}

      <MediaPickerModal
        open={pickerOpen || replaceOpen}
        onClose={() => {
          setPickerOpen(false);
          setReplaceOpen(false);
        }}
        files={files}
        filterType={type}
        onPick={(file) => onChange(file.url)}
        onUpload={onUpload}
        uploading={uploading}
        title={replaceOpen ? "Substituir mídia" : "Escolher da biblioteca"}
      />
    </div>
  );
}
