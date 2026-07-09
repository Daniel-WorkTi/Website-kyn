"use client";

import { useRef } from "react";

type ColorFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
};

export function ColorField({ label, value, onChange }: ColorFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const safeValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#ffffff";

  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-zinc-300">{label}</span>}
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="size-7 shrink-0 rounded-md border border-white/15 shadow-inner transition hover:border-white/25"
          style={{ backgroundColor: safeValue }}
          aria-label={label ? `${label}: ${safeValue}` : `Cor: ${safeValue}`}
        />
        <input
          ref={inputRef}
          type="color"
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
        <input
          type="text"
          value={safeValue}
          onChange={(e) => {
            const next = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(next)) onChange(next);
          }}
          onBlur={(e) => {
            if (!/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(safeValue);
          }}
          className="min-w-0 flex-1 bg-transparent text-xs uppercase tracking-wide text-zinc-400 outline-none"
          spellCheck={false}
        />
      </div>
    </label>
  );
}
