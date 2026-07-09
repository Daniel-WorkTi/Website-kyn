"use client";

import type { EditableElementId } from "@/lib/admin/editor-types";
import { useEditorStore } from "@/hooks/useEditorStore";

type EditableElementProps = {
  id: EditableElementId;
  label: string;
  children: React.ReactNode;
  className?: string;
};

export function EditableElement({ id, label, children, className = "" }: EditableElementProps) {
  const { selectedElementId, setSelectedElement } = useEditorStore();
  const selected = selectedElementId === id;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedElement(id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setSelectedElement(id);
        }
      }}
      className={[
        "group relative cursor-pointer rounded-lg transition-all duration-200",
        selected
          ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-black/80"
          : "hover:ring-1 hover:ring-emerald-400/50 hover:ring-offset-1 hover:ring-offset-black/60",
        className
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none absolute -top-2 left-2 z-20 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-opacity",
          selected
            ? "bg-emerald-500 text-black opacity-100"
            : "bg-black/80 text-emerald-300 opacity-0 group-hover:opacity-100"
        ].join(" ")}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
