"use client";

import { useCallback, useRef, useState } from "react";
import { UploadIcon } from "@/components/admin/icons/ProimagemIcons";
import { CLOUDINARY_MAX_UPLOAD_MB, MAX_UPLOAD_MB } from "@/lib/admin/sections";

type DropZoneProps = {
  accept?: string;
  multiple?: boolean;
  uploading?: boolean;
  onFiles: (files: File[]) => void;
  className?: string;
};

export function DropZone({
  accept = "image/*,video/*",
  multiple = true,
  uploading = false,
  onFiles,
  className = ""
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return;
      onFiles([...fileList]);
    },
    [onFiles]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        if ((e.target as HTMLElement).tagName !== "INPUT") inputRef.current?.click();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={[
        "group relative flex cursor-pointer flex-col items-center justify-center rounded-xl",
        "border-2 border-dashed px-4 py-6 text-center transition-all duration-200",
        dragOver
          ? "border-accent/60 bg-accent-dim"
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
        uploading ? "pointer-events-none opacity-60" : "",
        className
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        className={[
          "mb-3 flex size-11 items-center justify-center rounded-xl",
          "border border-white/10 bg-white/[0.04] text-zinc-400",
          "group-hover:text-accent transition-colors"
        ].join(" ")}
      >
        <UploadIcon className="size-5" />
      </div>
      <p className="text-sm font-medium text-zinc-200">Arrasta ficheiros para aqui</p>
      <p className="mt-1 text-xs text-zinc-500">
        ou clica para escolher · até {MAX_UPLOAD_MB} MB (ficheiros acima de {CLOUDINARY_MAX_UPLOAD_MB} MB são optimizados automaticamente)
      </p>
      {uploading && (
        <p className="mt-3 text-xs text-accent animate-pulse">A enviar ficheiros…</p>
      )}
    </div>
  );
}
