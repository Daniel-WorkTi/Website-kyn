"use client";

import { RefreshCw } from "lucide-react";
import type { MediaFile } from "@/lib/admin/sections";
import { mediaPlaybackUrl, mediaThumbnailUrl } from "@/lib/admin/media-utils";

type MediaLibraryProps = {
  files: MediaFile[];
  hint?: string;
  filter?: "all" | "video" | "image";
  onSelect: (url: string, type: string) => void;
  onRefresh: () => void;
  loading?: boolean;
  compact?: boolean;
};

export function MediaLibrary({
  files,
  hint,
  filter = "all",
  onSelect,
  onRefresh,
  loading = false,
  compact = false
}: MediaLibraryProps) {
  const filtered = filter === "all" ? files : files.filter((f) => f.type === filter);

  return (
    <section className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-xs font-medium text-zinc-300">Biblioteca</h3>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-300 disabled:opacity-50"
        >
          <RefreshCw className={["size-3", loading ? "animate-spin" : ""].join(" ")} strokeWidth={1.75} />
          Atualizar
        </button>
      </div>

      {hint ? <p className="mb-3 text-[11px] leading-relaxed text-zinc-600">{hint}</p> : null}

      {!filtered.length ? (
        <p className="rounded-lg border border-dashed border-white/[0.08] px-3 py-6 text-center text-[11px] text-zinc-600">
          Sem ficheiros. Envia pela área de envio.
        </p>
      ) : (
        <div
          className={[
            "grid gap-1.5",
            compact ? "grid-cols-4" : "grid-cols-3 sm:grid-cols-4"
          ].join(" ")}
        >
          {filtered.map((file) => (
            <button
              key={file.url}
              type="button"
              title={file.name}
              onClick={() => onSelect(file.url, file.type)}
              className="relative aspect-square overflow-hidden rounded-md border border-white/[0.08] bg-black/40 transition hover:border-white/25"
            >
              {file.type === "video" ? (
                <video
                  src={mediaPlaybackUrl(file)}
                  poster={mediaThumbnailUrl(file)}
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={mediaThumbnailUrl(file)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export function SectionBlock({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-b border-white/[0.05] pb-6 last:border-0 last:pb-0">
      <div className="space-y-1">
        <h2 className="text-sm font-medium text-white">{title}</h2>
        {subtitle ? <p className="text-[11px] leading-relaxed text-zinc-500">{subtitle}</p> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/[0.08] px-4 py-8 text-center">
      <p className="text-xs font-medium text-zinc-500">{title}</p>
      <p className="mt-1 text-[11px] text-zinc-600">{text}</p>
    </div>
  );
}

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500"
    >
      {children}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  id
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="box-border w-full min-h-[40px] rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-3 py-2 text-sm leading-normal text-white outline-none transition placeholder:text-zinc-600 focus:border-white/20"
    />
  );
}

export function TextArea({
  value,
  onChange,
  id,
  rows = 4
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="box-border w-full resize-y rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-3 py-2.5 text-sm leading-relaxed text-white outline-none transition focus:border-white/20"
    />
  );
}

export function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-dashed border-white/[0.1] py-2.5 text-xs text-zinc-500 transition hover:border-white/20 hover:bg-white/[0.03] hover:text-zinc-300"
    >
      + {label}
    </button>
  );
}

export function UploadOverlayButton({
  onClick,
  label = "Carregar"
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex size-full items-center justify-center overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02] transition hover:border-white/20"
    >
      <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}
