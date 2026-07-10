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
import type { MediaFile, Partner, PartnersData } from "@/lib/admin/sections";

type EditorCommonProps = {
  onDirty: () => void;
  processUpload: (file: File, onSuccess: (url: string, file: File) => void) => Promise<void>;
  showToast: (message: string, type?: "ok" | "error" | "pending") => void;
  mediaLibrary: MediaFile[];
  refreshMediaLibrary: () => Promise<void>;
  mediaLoading: boolean;
};

type PartnersEditorProps = EditorCommonProps & {
  data: PartnersData;
  onChange: (data: PartnersData) => void;
};

export function PartnersEditor({
  data,
  onChange,
  onDirty,
  processUpload,
  mediaLibrary
}: PartnersEditorProps) {
  const main = data.main || [];
  const secondary = data.secondary || [];

  function patch(partial: Partial<PartnersData>) {
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
      <PartnerSection
        title="Parceiros principais"
        subtitle="Logótipos em destaque na página Meet the Team."
        items={main}
        mediaLibrary={mediaLibrary}
        uploadForPicker={uploadForPicker}
        onChange={(items) => patch({ main: items })}
        onAdd={() => patch({ main: [...main, { name: "", logo: "" }] })}
      />
      <PartnerSection
        title="Parceiros secundários"
        subtitle="Logótipos adicionais na parte inferior."
        items={secondary}
        mediaLibrary={mediaLibrary}
        uploadForPicker={uploadForPicker}
        onChange={(items) => patch({ secondary: items })}
        onAdd={() => patch({ secondary: [...secondary, { name: "", logo: "" }] })}
      />
    </div>
  );
}

function PartnerSection({
  title,
  subtitle,
  items,
  mediaLibrary,
  uploadForPicker,
  onChange,
  onAdd
}: {
  title: string;
  subtitle: string;
  items: Partner[];
  mediaLibrary: MediaFile[];
  uploadForPicker: (file: File) => Promise<string>;
  onChange: (items: Partner[]) => void;
  onAdd: () => void;
}) {
  return (
    <SectionBlock title={title} subtitle={subtitle}>
      {items.length === 0 ? (
        <EmptyState title={`Sem ${title.toLowerCase()}`} text="Adiciona o primeiro parceiro abaixo." />
      ) : (
        <div className="space-y-4">
          {items.map((partner, i) => (
            <PartnerCard
              key={`${partner.name}-${i}`}
              partner={partner}
              mediaLibrary={mediaLibrary}
              uploadForPicker={uploadForPicker}
              onChange={(updated) => {
                const next = [...items];
                next[i] = updated;
                onChange(next);
              }}
              onRemove={() => onChange(items.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
      )}
      <AddButton label="Adicionar parceiro" onClick={onAdd} />
    </SectionBlock>
  );
}

function PartnerCard({
  partner,
  mediaLibrary,
  uploadForPicker,
  onChange,
  onRemove
}: {
  partner: Partner;
  mediaLibrary: MediaFile[];
  uploadForPicker: (file: File) => Promise<string>;
  onChange: (partner: Partner) => void;
  onRemove: () => void;
}) {
  return (
    <article className="space-y-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      <MediaPickerField
        label="Logo"
        type="image"
        value={partner.logo || ""}
        files={mediaLibrary}
        onChange={(url) => onChange({ ...partner, logo: url })}
        onUpload={uploadForPicker}
        onRemove={() => onChange({ ...partner, logo: "" })}
      />
      <div>
        <FieldLabel>Nome</FieldLabel>
        <TextInput
          value={partner.name}
          onChange={(value) => onChange({ ...partner, name: value })}
          placeholder="Nome do parceiro"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex items-center gap-1 text-[11px] text-red-400/80 transition hover:text-red-300"
      >
        <Trash2 className="size-3.5" strokeWidth={1.75} />
        Remover
      </button>
    </article>
  );
}
