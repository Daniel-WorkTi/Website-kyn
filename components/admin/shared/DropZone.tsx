"use client";

import { useCallback, useRef, useState } from "react";
import { UploadIcon } from "@/components/admin/icons/ProimagemIcons";

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
        "group relative flex cursor-pointer flex-col items-center justify-center rounded-lg",
        "border border-dashed px-4 py-5 text-center transition",
        dragOver
          ? "border-white/25 bg-white/[0.04]"
          : "border-white/[0.08] bg-white/[0.02] hover:border-white/15",
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
      <div className="mb-2 flex size-9 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-500 transition group-hover:text-zinc-300">
        <UploadIcon className="size-4" />
      </div>
      <p className="text-xs text-zinc-400">Arrastar ou clicar para enviar</p>
      {uploading ? (
        <p className="mt-2 text-[10px] text-zinc-500">A enviar…</p>
      ) : null}
    </div>
  );
}
