"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";

type UploadFieldProps = {
  label?: string;
  accept?: string;
  uploading?: boolean;
  onFile: (file: File) => void;
};

export function UploadField({
  label = "Fazer upload",
  accept = "image/*",
  uploading,
  onFile
}: UploadFieldProps) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => ref.current?.click()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm text-zinc-200 transition hover:bg-white/[0.08] disabled:opacity-50"
      >
        <Upload className="size-4" strokeWidth={1.75} />
        {uploading ? "A enviar…" : label}
      </button>
    </>
  );
}
