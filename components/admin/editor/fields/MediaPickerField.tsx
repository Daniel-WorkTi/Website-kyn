"use client";

import { useRef, useState } from "react";
import { FolderOpen, ImageIcon, Trash2, Upload, Video } from "lucide-react";
import { MediaPickerModal } from "@/components/admin/media/MediaPickerModal";
import type { MediaFile } from "@/lib/admin/sections";

type MediaPickerFieldProps = {
  label?: string;
  value: string;
  type: "image" | "video";
  files: MediaFile[];
  onChange: (url: string) => void;
  onUpload?: (file: File) => Promise<string | void>;
  uploading?: boolean;
  onRemove?: () => void;
};

function fileName(url: string): string {
  return url.split("/").pop()?.split("?")[0] || "ficheiro";
}

export function MediaPickerField({
  label,
  value,
  type,
  files,
  onChange,
  onUpload,
  uploading,
  onRemove
}: MediaPickerFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2.5">
      {label ? (
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      ) : null}

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="group relative w-full overflow-hidden rounded-lg border border-white/[0.08] bg-black/50 transition hover:border-white/20"
      >
        <div className="aspect-video w-full bg-zinc-950">
          {value ? (
            type === "video" ? (
              <video src={value} className="h-full w-full object-cover" muted playsInline />
            ) : (
              <img src={value} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1.5 text-zinc-600">
              {type === "video" ? (
                <Video className="size-6" strokeWidth={1.5} />
              ) : (
                <ImageIcon className="size-6" strokeWidth={1.5} />
              )}
              <span className="text-[11px]">Clica para escolher</span>
            </div>
          )}
        </div>
        <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-xs text-white opacity-0 transition group-hover:opacity-100">
          Trocar mídia
        </span>
      </button>

      {value ? (
        <p className="truncate text-[10px] text-zinc-600" title={fileName(value)}>
          {fileName(value)}
        </p>
      ) : null}

      <div className="flex items-center gap-1.5">
        {onUpload && (
          <>
            <input
              ref={uploadRef}
              type="file"
              accept={type === "video" ? "video/*" : "image/*"}
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) {
                  void onUpload(file).then((url) => {
                    if (typeof url === "string") onChange(url);
                  });
                }
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => uploadRef.current?.click()}
              title="Enviar ficheiro"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-200 disabled:opacity-50"
            >
              <Upload className="size-3.5" strokeWidth={1.75} />
              {uploading ? "A enviar…" : "Enviar"}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          title="Biblioteca"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-200"
        >
          <FolderOpen className="size-3.5" strokeWidth={1.75} />
          Biblioteca
        </button>
        {value && onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            title="Remover"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-red-500/15 text-red-400/80 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="size-3.5" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        files={files}
        filterType={type}
        onPick={(file) => onChange(file.url)}
        onUpload={onUpload}
        uploading={uploading}
        title="Escolher mídia"
      />
    </div>
  );
}
