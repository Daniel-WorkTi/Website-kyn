"use client";

import { Trash2 } from "lucide-react";
import { MediaPickerField } from "@/components/admin/editor/fields/MediaPickerField";
import {
  AddButton,
  EmptyState,
  MediaLibrary,
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
  mediaLibrary,
  refreshMediaLibrary,
  mediaLoading
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
      <MediaLibrary
        files={mediaLibrary}
        filter="image"
        hint="Logótipos dos parceiros — escolhe ou envia imagens com fundo transparente se possível."
        onSelect={() => {}}
        onRefresh={refreshMediaLibrary}
        loading={mediaLoading}
      />

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
    <article className="space-y-4 rounded-xl border border-white/[0.08] bg-[#141414] p-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <MediaPickerField
          label={`Logo — ${partner.name || "sem nome"}`}
          type="image"
          value={partner.logo}
          files={mediaLibrary}
          onChange={(url) => onChange({ ...partner, logo: url })}
          onUpload={uploadForPicker}
          onRemove={() => onChange({ ...partner, logo: "" })}
        />
        <div className="flex flex-col justify-center gap-3">
          <TextInput
            value={partner.name}
            onChange={(value) => onChange({ ...partner, name: value })}
            placeholder="Nome do parceiro"
          />
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex w-fit items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400"
          >
            <Trash2 className="size-3.5" strokeWidth={1.75} />
            Remover
          </button>
        </div>
      </div>
    </article>
  );
}
