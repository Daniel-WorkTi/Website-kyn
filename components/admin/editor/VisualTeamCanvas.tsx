"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { EditableZone } from "@/components/admin/editor/EditableZone";
import { VisualEditorFrame } from "@/components/admin/editor/VisualEditorFrame";
import { VisualMediaControls } from "@/components/admin/editor/VisualMediaControls";
import { initials } from "@/lib/admin/sections";
import type { MediaFile, TeamData, TeamMember } from "@/lib/admin/sections";

type Selection =
  | { kind: "title" }
  | { kind: "featured"; index: number }
  | { kind: "member"; index: number }
  | { kind: "photo"; list: "featured" | "members"; index: number }
  | { kind: "add-featured" }
  | { kind: "add-member" }
  | null;

type VisualTeamCanvasProps = {
  data: TeamData;
  onChange: (data: TeamData) => void;
  onDirty: () => void;
  mediaLibrary: MediaFile[];
  onUpload?: (file: File) => Promise<string>;
  uploading?: boolean;
};

function emptyMember(): TeamMember {
  return {
    name: "Novo membro",
    roles: "Função",
    photo: "",
    skills: []
  };
}

export function VisualTeamCanvas({
  data,
  onChange,
  onDirty,
  mediaLibrary,
  onUpload,
  uploading = false
}: VisualTeamCanvasProps) {
  const [selection, setSelection] = useState<Selection>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const featured = data.featured || [];
  const members = data.members || [];

  function patch(partial: Partial<TeamData>) {
    onChange({ ...data, ...partial });
    onDirty();
  }

  function updateMember(list: "featured" | "members", index: number, partial: Partial<TeamMember>) {
    const arr = list === "featured" ? [...featured] : [...members];
    arr[index] = { ...arr[index], ...partial };
    patch(list === "featured" ? { featured: arr } : { members: arr });
  }

  function removeMember(list: "featured" | "members", index: number) {
    const arr = list === "featured" ? featured.filter((_, i) => i !== index) : members.filter((_, i) => i !== index);
    patch(list === "featured" ? { featured: arr } : { members: arr });
    setSelection(null);
  }

  function applyPhoto(url: string) {
    if (selection?.kind !== "photo") return;
    updateMember(selection.list, selection.index, { photo: url });
    setPickerOpen(false);
    setSelection(null);
  }

  async function handleUpload(file: File) {
    if (!onUpload || selection?.kind !== "photo") return;
    const url = await onUpload(file);
    if (url) applyPhoto(url);
  }

  function renderMemberCard(member: TeamMember, list: "featured" | "members", index: number, featuredLayout = false) {
    return (
        <article key={`${list}-${member.name}-${index}`} className="team-card relative">
        <EditableZone
          label="Foto"
          hint="Trocar foto"
          selected={selection?.kind === "photo" && selection.list === list && selection.index === index}
          onSelect={() => {
            setSelection({ kind: "photo", list, index });
            setPickerOpen(true);
          }}
          className="team-card__photo"
          overlayClassName="rounded-none"
        >
          {member.photo ? (
            <img
              src={member.photo}
              alt={member.name}
              style={member.photoPosition ? { objectPosition: member.photoPosition } : undefined}
            />
          ) : (
            <span>{initials(member.name)}</span>
          )}
        </EditableZone>

        <div className="team-card__info">
          <EditableZone
            label="Nome"
            selected={selection?.kind === (list === "featured" ? "featured" : "member") && selection.index === index}
            onSelect={() =>
              setSelection({ kind: list === "featured" ? "featured" : "member", index })
            }
            overlayClassName="rounded-sm"
          >
            <h2
              className="team-card__name outline-none"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const value = e.currentTarget.textContent?.trim() || "";
                if (value && value !== member.name) updateMember(list, index, { name: value });
              }}
            >
              {member.name}
            </h2>
          </EditableZone>

          <EditableZone
            label="Funções"
            overlayClassName="rounded-sm"
          >
            <p
              className="team-card__roles outline-none"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const value = e.currentTarget.textContent?.trim() || "";
                if (value !== member.roles) updateMember(list, index, { roles: value });
              }}
            >
              {member.roles}
            </p>
          </EditableZone>
        </div>

        <button
          type="button"
          onClick={() => removeMember(list, index)}
          className="absolute right-2 top-2 z-30 flex size-8 items-center justify-center rounded-lg bg-black/70 text-red-300 opacity-0 transition hover:bg-red-500/20 group-hover/zone:opacity-100"
          title="Remover"
        >
          <Trash2 className="size-4" />
        </button>
      </article>
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
            {(data.title || "Meet the Team").toUpperCase()}
          </h1>
        </EditableZone>

        <div className="section">
          <div className="team-featured">
            {featured.map((member, i) => (
              <div key={i}>{renderMemberCard(member, "featured", i, true)}</div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => patch({ featured: [...featured, emptyMember()] })}
            className="mb-8 inline-flex items-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-2 text-sm text-zinc-400 transition hover:border-emerald-400/40 hover:text-emerald-300"
          >
            <Plus className="size-4" />
            Adicionar destaque
          </button>

          <div className="team-grid">
            {members.map((member, i) => (
              <div key={i}>{renderMemberCard(member, "members", i)}</div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => patch({ members: [...members, emptyMember()] })}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 border border-dashed border-white/15 py-8 text-sm text-zinc-400 transition hover:border-emerald-400/40 hover:text-emerald-300"
          >
            <Plus className="size-4" />
            Adicionar membro
          </button>
        </div>
      </VisualEditorFrame>

      <VisualMediaControls
        open={selection?.kind === "photo"}
        title="Trocar foto"
        onClose={() => setSelection(null)}
        pickerOpen={pickerOpen}
        onPickerOpenChange={setPickerOpen}
        files={mediaLibrary}
        filterType="image"
        onPick={(file) => applyPhoto(file.url)}
        onUpload={onUpload ? handleUpload : undefined}
        uploading={uploading}
      />
    </>
  );
}
