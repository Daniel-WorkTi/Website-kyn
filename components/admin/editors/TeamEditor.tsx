"use client";

import { useRef } from "react";
import { Trash2 } from "lucide-react";
import {
  AddButton,
  EmptyState,
  SectionBlock,
  TextInput
} from "@/components/admin/shared/MediaLibrary";
import { ALL_SKILLS, SKILL_LABELS, initials, type MediaFile, type TeamData, type TeamMember } from "@/lib/admin/sections";

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

export function TeamEditor({ data, onChange, onDirty, processUpload, showToast }: TeamEditorProps) {
  const featured = data.featured || [];
  const members = data.members || [];

  function patch(partial: Partial<TeamData>) {
    onChange({ ...data, ...partial });
    onDirty();
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
          <div className="space-y-3">
            {featured.map((member, i) => (
              <PersonCard
                key={`featured-${i}`}
                member={member}
                showSkills={false}
                onChange={(updated) => {
                  const next = [...featured];
                  next[i] = updated;
                  patch({ featured: next });
                }}
                onUpload={async (file) => {
                  try {
                    await processUpload(file, (url) => {
                      const next = [...featured];
                      next[i] = { ...next[i], photo: url };
                      patch({ featured: next });
                    });
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : "Erro no envio.", "error");
                  }
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
          <div className="space-y-3">
            {members.map((member, i) => (
              <PersonCard
                key={`member-${i}`}
                member={member}
                showSkills
                onChange={(updated) => {
                  const next = [...members];
                  next[i] = updated;
                  patch({ members: next });
                }}
                onUpload={async (file) => {
                  try {
                    await processUpload(file, (url) => {
                      const next = [...members];
                      next[i] = { ...next[i], photo: url };
                      patch({ members: next });
                    });
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : "Erro no envio.", "error");
                  }
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
  onChange,
  onUpload,
  onRemove
}: {
  member: TeamMember;
  showSkills?: boolean;
  onChange: (member: TeamMember) => void;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <article className="flex flex-wrap items-start gap-4 rounded-xl border border-white/[0.08] bg-[#141414] p-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-zinc-400"
      >
        {member.photo ? (
          <img src={member.photo} alt="" className="h-full w-full object-cover" />
        ) : (
          initials(member.name)
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[0.65rem] text-white opacity-0 transition group-hover:opacity-100">
          Carregar foto
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onUpload(file);
          }}
        />
      </button>

      <div className="min-w-0 flex-1 space-y-2">
        <TextInput
          value={member.name}
          onChange={(value) => onChange({ ...member, name: value })}
          placeholder="Nome"
        />
        <TextInput
          value={member.roles}
          onChange={(value) => onChange({ ...member, roles: value })}
          placeholder="Funções (ex.: Cam OP · Editor)"
        />
        {showSkills && (
          <div className="flex flex-wrap gap-2 pt-1">
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
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400"
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
          Remover
        </button>
      )}
    </article>
  );
}
