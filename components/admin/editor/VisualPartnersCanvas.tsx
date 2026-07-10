"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { EditableZone } from "@/components/admin/editor/EditableZone";
import { VisualEditorFrame } from "@/components/admin/editor/VisualEditorFrame";
import { VisualMediaControls } from "@/components/admin/editor/VisualMediaControls";
import type { MediaFile, Partner, PartnersData } from "@/lib/admin/sections";

type Selection =
  | { kind: "title" }
  | { kind: "main"; index: number }
  | { kind: "secondary"; index: number }
  | { kind: "logo"; list: "main" | "secondary"; index: number }
  | { kind: "add-main" }
  | { kind: "add-secondary" }
  | null;

type VisualPartnersCanvasProps = {
  data: PartnersData;
  onChange: (data: PartnersData) => void;
  onDirty: () => void;
  mediaLibrary: MediaFile[];
  onUpload?: (file: File) => Promise<string>;
  uploading?: boolean;
};

function emptyPartner(): Partner {
  return { name: "Novo parceiro", logo: "" };
}

export function VisualPartnersCanvas({
  data,
  onChange,
  onDirty,
  mediaLibrary,
  onUpload,
  uploading = false
}: VisualPartnersCanvasProps) {
  const [selection, setSelection] = useState<Selection>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const main = data.main || [];
  const secondary = data.secondary || [];

  function patch(partial: Partial<PartnersData>) {
    onChange({ ...data, ...partial });
    onDirty();
  }

  function updatePartner(list: "main" | "secondary", index: number, partial: Partial<Partner>) {
    const arr = list === "main" ? [...main] : [...secondary];
    arr[index] = { ...arr[index], ...partial };
    patch(list === "main" ? { main: arr } : { secondary: arr });
  }

  function removePartner(list: "main" | "secondary", index: number) {
    const arr = list === "main" ? main.filter((_, i) => i !== index) : secondary.filter((_, i) => i !== index);
    patch(list === "main" ? { main: arr } : { secondary: arr });
    setSelection(null);
  }

  function applyLogo(url: string) {
    if (selection?.kind !== "logo") return;
    updatePartner(selection.list, selection.index, { logo: url });
    setPickerOpen(false);
    setSelection(null);
  }

  async function handleUpload(file: File) {
    if (!onUpload || selection?.kind !== "logo") return;
    const url = await onUpload(file);
    if (url) applyLogo(url);
  }

  function renderPartner(partner: Partner, list: "main" | "secondary", index: number) {
    return (
      <div key={`${list}-${partner.name}-${index}`} className="group/zone relative">
        <EditableZone
          label="Logo"
          hint="Trocar logo"
          selected={selection?.kind === "logo" && selection.list === list && selection.index === index}
          onSelect={() => {
            setSelection({ kind: "logo", list, index });
            setPickerOpen(true);
          }}
          className="partner-card"
          overlayClassName="rounded-lg"
        >
          {partner.logo ? (
            <img src={partner.logo} alt={partner.name} />
          ) : (
            <span
              className="partner-card__name outline-none"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const value = e.currentTarget.textContent?.trim() || "";
                if (value !== partner.name) updatePartner(list, index, { name: value });
              }}
            >
              {partner.name}
            </span>
          )}
        </EditableZone>

        <button
          type="button"
          onClick={() => removePartner(list, index)}
          className="absolute right-1 top-1 z-30 flex size-7 items-center justify-center rounded-md bg-black/70 text-red-300 opacity-0 transition group-hover/zone:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <VisualEditorFrame onBackgroundClick={() => setSelection(null)}>
        <EditableZone
          label="Título"
          selected={selection?.kind === "title"}
          onSelect={() => setSelection({ kind: "title" })}
          className="page-heading"
          overlayClassName="rounded-none"
        >
          <h1
            className="page-heading__title outline-none"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const value = e.currentTarget.textContent?.trim() || "";
              if (value && value.toUpperCase() !== (data.title || "").toUpperCase()) {
                patch({ title: value });
              }
            }}
          >
            {(data.title || "Parceiros").toUpperCase()}
          </h1>
        </EditableZone>

        <div className="section">
          <div className="partners-section">
            <p className="partners-section__label">Principais</p>
            <div className="partners-grid partners-grid--main">
              {main.map((partner, i) => renderPartner(partner, "main", i))}
            </div>
            <button
              type="button"
              onClick={() => patch({ main: [...main, emptyPartner()] })}
              className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-emerald-300"
            >
              <Plus className="size-4" />
              Adicionar parceiro principal
            </button>
          </div>

          <div className="partners-section">
            <p className="partners-section__label">Secundários</p>
            <div className="partners-grid partners-grid--secondary">
              {secondary.map((partner, i) => renderPartner(partner, "secondary", i))}
            </div>
            <button
              type="button"
              onClick={() => patch({ secondary: [...secondary, emptyPartner()] })}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-dashed border-white/15 py-6 text-sm text-zinc-400 hover:border-emerald-400/40 hover:text-emerald-300"
            >
              <Plus className="size-4" />
              Adicionar parceiro secundário
            </button>
          </div>
        </div>
      </VisualEditorFrame>

      <VisualMediaControls
        open={selection?.kind === "logo"}
        title="Trocar logo"
        onClose={() => setSelection(null)}
        pickerOpen={pickerOpen}
        onPickerOpenChange={setPickerOpen}
        files={mediaLibrary}
        filterType="image"
        onPick={(file) => applyLogo(file.url)}
        onUpload={onUpload ? handleUpload : undefined}
        uploading={uploading}
      />
    </>
  );
}
