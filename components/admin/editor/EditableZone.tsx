"use client";

import type { ReactNode } from "react";

type EditableZoneProps = {
  label: string;
  hint?: string;
  selected?: boolean;
  onSelect?: () => void;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
};

export function EditableZone({
  label,
  hint,
  selected,
  onSelect,
  children,
  className = "",
  overlayClassName = ""
}: EditableZoneProps) {
  return (
    <div
      className={[
        "group/zone relative",
        onSelect ? "cursor-pointer" : "",
        className
      ].join(" ")}
      onClick={(e) => {
        if (!onSelect) return;
        e.stopPropagation();
        onSelect();
      }}
      onKeyDown={(e) => {
        if (!onSelect) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div
        className={[
          "pointer-events-none absolute inset-0 z-20 rounded-sm border-2 transition-all duration-200",
          selected
            ? "border-emerald-400 bg-emerald-400/10"
            : "border-transparent group-hover/zone:border-emerald-400/70 group-hover/zone:bg-emerald-400/5",
          overlayClassName
        ].join(" ")}
      />
      <span
        className={[
          "pointer-events-none absolute left-3 top-3 z-30 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-lg transition-opacity",
          selected
            ? "bg-emerald-400 text-black opacity-100"
            : "bg-black/85 text-emerald-300 opacity-0 group-hover/zone:opacity-100"
        ].join(" ")}
      >
        {label}
      </span>
      {hint && (
        <span
          className={[
            "pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/80 px-3 py-1 text-[11px] text-white shadow-lg transition-opacity",
            selected ? "opacity-100" : "opacity-0 group-hover/zone:opacity-100"
          ].join(" ")}
        >
          {hint}
        </span>
      )}
      {children}
    </div>
  );
}
