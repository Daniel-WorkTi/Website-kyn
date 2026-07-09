"use client";

import { RefreshCw } from "lucide-react";
import type { MediaFile } from "@/lib/admin/sections";

type MediaLibraryProps = {
  files: MediaFile[];
  hint: string;
  filter?: "all" | "video" | "image";
  onSelect: (url: string, type: string) => void;
  onRefresh: () => void;
  loading?: boolean;
};

export function MediaLibrary({
  files,
  hint,
  filter = "all",
  onSelect,
  onRefresh,
  loading = false
}: MediaLibraryProps) {
  const filtered =
    filter === "all" ? files : files.filter((f) => f.type === filter);

  return (
    <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <h2 className="text-base font-medium text-white">Biblioteca de ficheiros</h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.08] disabled:opacity-50"
        >
          <RefreshCw className={["size-3.5", loading ? "animate-spin" : ""].join(" ")} strokeWidth={1.75} />
          Atualizar
        </button>
      </div>
      <p className="mb-4 text-sm text-zinc-500">{hint}</p>

      {!filtered.length ? (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-zinc-600">
          Ainda não há ficheiros carregados. Usa a área de envio abaixo.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {filtered.map((file) => (
            <button
              key={file.url}
              type="button"
              title={file.name}
              onClick={() => onSelect(file.url, file.type)}
              className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/40 transition hover:border-accent/40 hover:ring-1 hover:ring-accent/30"
            >
              {file.type === "video" ? (
                <video src={file.url} muted playsInline className="h-full w-full object-cover" />
              ) : (
                <img src={file.url} alt="" loading="lazy" className="h-full w-full object-cover" />
              )}
              <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[0.6rem] text-white">
                {file.type === "video" ? "Vídeo" : "Foto"}
              </span>
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
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-medium text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 px-6 py-10 text-center">
      <p className="text-sm font-medium text-zinc-400">{title}</p>
      <p className="mt-1 text-sm text-zinc-600">{text}</p>
    </div>
  );
}

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs text-zinc-400">
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
      className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-white outline-none transition focus:border-accent/40"
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
      className="w-full resize-y rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-white outline-none transition focus:border-accent/40"
    />
  );
}

export function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={onClick}
        className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
      >
        {label}
      </button>
    </div>
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
      className="group relative flex size-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition hover:border-white/20"
    >
      <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}
