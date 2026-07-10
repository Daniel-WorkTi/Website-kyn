"use client";

import { Upload } from "lucide-react";
import { CLOUDINARY_MAX_UPLOAD_MB, MAX_UPLOAD_MB } from "@/lib/admin/sections";

type MediaUploaderProps = {
  onFiles: (files: File[]) => void;
  uploading?: boolean;
  accept?: string;
  label?: string;
};

export function MediaUploader({
  onFiles,
  uploading = false,
  accept = "image/*,video/*",
  label = "Enviar mídia"
}: MediaUploaderProps) {
  return (
    <label
      className={[
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10",
        "bg-white/[0.02] px-6 py-8 text-center transition hover:border-emerald-500/30 hover:bg-emerald-500/5",
        uploading ? "pointer-events-none opacity-60" : ""
      ].join(" ")}
    >
      <input
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={(e) => {
          const list = e.target.files;
          if (list?.length) onFiles([...list]);
          e.target.value = "";
        }}
      />
      <div className="mb-3 flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-emerald-400">
        <Upload className="size-5" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-white">{label}</p>
      <p className="mt-1 text-xs text-zinc-500">
        Imagens e vídeos · até {MAX_UPLOAD_MB} MB (optimização automática acima de {CLOUDINARY_MAX_UPLOAD_MB} MB)
      </p>
      {uploading && <p className="mt-3 text-xs text-emerald-400 animate-pulse">A enviar…</p>}
    </label>
  );
}
