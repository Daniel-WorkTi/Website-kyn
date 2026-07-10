"use client";

import { Trash2 } from "lucide-react";
import { MediaPickerField } from "@/components/admin/editor/fields/MediaPickerField";
import {
  AddButton,
  EmptyState,
  FieldLabel,
  SectionBlock,
  TextInput
} from "@/components/admin/shared/MediaLibrary";
import { ALL_SKILLS, SKILL_LABELS, type MediaFile, type TeamData, type TeamMember } from "@/lib/admin/sections";

type EditorCommonProps = {
  onDirty: () => void;
  processUpload: (file: File, onSuccess: (url: string, file: File) => void) => Promise<void>;
  showToast: (message: string, type?: "ok" | "error" | "pending") => void;
  mediaLibrary: MediaFile[];
  refreshMediaLibrary: () => Promise<void>;
  mediaLoading: boolean;
};

type TeamEditorProps = EditorCommonProps & {
  data: TeamData;
  onChange: (data: TeamData) => void;
};

const PHOTO_POSITIONS = [
  { value: "", label: "Centro (padrão)" },
  { value: "center 35%", label: "Mostrar mais o topo" },
  { value: "center 58%", label: "Mostrar mais o meio/baixo" },
  { value: "center 50%", label: "Centro exacto" }
];

export function TeamEditor({
  data,
  onChange,
  onDirty,
  processUpload,
  mediaLibrary
}: TeamEditorProps) {
  const featured = data.featured || [];
  const members = data.members || [];

  function patch(partial: Partial<TeamData>) {
    onChange({ ...data, ...partial });
    onDirty();
  }

  async function uploadForPicker(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      processUpload(file, (url) => resolve(url)).catch(reject);
    });
  }

  return (
    <div className="space-y-8">
      <SectionBlock
        title="Destaques no topo"
        subtitle="Membros em destaque no início da página da equipa."
      >
        {featured.length === 0 ? (
          <EmptyState
            title="Sem destaques"
            text="Os membros em destaque aparecem no topo da página."
          />
        ) : (
          <div className="space-y-4">
            {featured.map((member, i) => (
              <PersonCard
                key={`featured-${i}`}
                member={member}
                showSkills={false}
                mediaLibrary={mediaLibrary}
                uploadForPicker={uploadForPicker}
                onChange={(updated) => {
                  const next = [...featured];
                  next[i] = updated;
                  patch({ featured: next });
                }}
              />
            ))}
          </div>
        )}
      </SectionBlock>

      <SectionBlock title="Todos os membros">
        {members.length === 0 ? (
          <EmptyState title="Sem membros" text="Adiciona o primeiro membro da equipa abaixo." />
        ) : (
          <div className="space-y-4">
            {members.map((member, i) => (
              <PersonCard
                key={`member-${i}`}
                member={member}
                showSkills
                mediaLibrary={mediaLibrary}
                uploadForPicker={uploadForPicker}
                onChange={(updated) => {
                  const next = [...members];
                  next[i] = updated;
                  patch({ members: next });
                }}
                onRemove={() => patch({ members: members.filter((_, idx) => idx !== i) })}
              />
            ))}
          </div>
        )}
        <AddButton
          label="Adicionar membro"
          onClick={() =>
            patch({
              members: [...members, { name: "", roles: "", skills: [], photo: "" }]
            })
          }
        />
      </SectionBlock>
    </div>
  );
}

function PersonCard({
  member,
  showSkills,
  mediaLibrary,
  uploadForPicker,
  onChange,
  onRemove
}: {
  member: TeamMember;
  showSkills?: boolean;
  mediaLibrary: MediaFile[];
  uploadForPicker: (file: File) => Promise<string>;
  onChange: (member: TeamMember) => void;
  onRemove?: () => void;
}) {
  return (
    <article className="space-y-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      <MediaPickerField
        label="Foto"
        type="image"
        value={member.photo || ""}
        files={mediaLibrary}
        onChange={(url) => onChange({ ...member, photo: url })}
        onUpload={uploadForPicker}
        onRemove={() => onChange({ ...member, photo: "" })}
      />

      <div className="space-y-3">
        <div>
          <FieldLabel>Nome</FieldLabel>
          <TextInput
            value={member.name}
            onChange={(value) => onChange({ ...member, name: value })}
            placeholder="Nome"
          />
        </div>
        <div>
          <FieldLabel>Funções</FieldLabel>
          <TextInput
            value={member.roles}
            onChange={(value) => onChange({ ...member, roles: value })}
            placeholder="Ex.: Cam OP · Editor"
          />
        </div>
        {member.photo ? (
          <div>
            <FieldLabel>Enquadramento</FieldLabel>
            <select
              value={member.photoPosition || ""}
              onChange={(e) =>
                onChange({
                  ...member,
                  photoPosition: e.target.value || undefined
                })
              }
              className="box-border w-full min-h-[40px] rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:border-white/20"
            >
              {PHOTO_POSITIONS.map((opt) => (
                <option key={opt.value || "default"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {showSkills && (
        <div className="flex flex-wrap gap-2">
          {ALL_SKILLS.map((skill) => (
            <label
              key={skill}
              className={[
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition",
                (member.skills || []).includes(skill)
                  ? "border-accent/40 bg-accent-dim text-accent"
                  : "border-white/10 text-zinc-500 hover:border-white/20"
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={(member.skills || []).includes(skill)}
                onChange={(e) => {
                  const skills = new Set(member.skills || []);
                  if (e.target.checked) skills.add(skill);
                  else skills.delete(skill);
                  onChange({ ...member, skills: [...skills] });
                }}
                className="sr-only"
              />
              {SKILL_LABELS[skill] || skill}
            </label>
          ))}
        </div>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400"
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
          Remover membro
        </button>
      )}
    </article>
  );
}
