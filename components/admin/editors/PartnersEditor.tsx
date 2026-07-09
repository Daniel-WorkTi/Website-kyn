"use client";

import { useRef } from "react";
import { Trash2 } from "lucide-react";
import {
  AddButton,
  EmptyState,
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

export function PartnersEditor({ data, onChange, onDirty, processUpload, showToast }: PartnersEditorProps) {
  const main = data.main || [];
  const secondary = data.secondary || [];

  function patch(partial: Partial<PartnersData>) {
    onChange({ ...data, ...partial });
    onDirty();
  }

  return (
    <div className="space-y-8">
      <PartnerSection
        title="Parceiros principais"
        subtitle="Logótipos em destaque no topo da página."
        items={main}
        onChange={(items) => patch({ main: items })}
        onAdd={() => patch({ main: [...main, { name: "", logo: "" }] })}
        processUpload={processUpload}
        showToast={showToast}
      />
      <PartnerSection
        title="Parceiros secundários"
        subtitle="Logótipos adicionais na parte inferior."
        items={secondary}
        onChange={(items) => patch({ secondary: items })}
        onAdd={() => patch({ secondary: [...secondary, { name: "", logo: "" }] })}
        processUpload={processUpload}
        showToast={showToast}
      />
    </div>
  );
}

function PartnerSection({
  title,
  subtitle,
  items,
  onChange,
  onAdd,
  processUpload,
  showToast
}: {
  title: string;
  subtitle: string;
  items: Partner[];
  onChange: (items: Partner[]) => void;
  onAdd: () => void;
  processUpload: (file: File, onSuccess: (url: string, file: File) => void) => Promise<void>;
  showToast: (message: string, type?: "ok" | "error" | "pending") => void;
}) {
  return (
    <SectionBlock title={title} subtitle={subtitle}>
      {items.length === 0 ? (
        <EmptyState title={`Sem ${title.toLowerCase()}`} text="Adiciona o primeiro parceiro abaixo." />
      ) : (
        <div className="space-y-3">
          {items.map((partner, i) => (
            <PartnerCard
              key={`${partner.name}-${i}`}
              partner={partner}
              onChange={(updated) => {
                const next = [...items];
                next[i] = updated;
                onChange(next);
              }}
              onRemove={() => onChange(items.filter((_, idx) => idx !== i))}
              onUpload={async (file) => {
                try {
                  await processUpload(file, (url) => {
                    const next = [...items];
                    next[i] = { ...next[i], logo: url };
                    onChange(next);
                  });
                } catch (err) {
                  showToast(err instanceof Error ? err.message : "Erro no envio.", "error");
                }
              }}
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
  onChange,
  onRemove,
  onUpload
}: {
  partner: Partner;
  onChange: (partner: Partner) => void;
  onRemove: () => void;
  onUpload: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fallback = (partner.name || "").slice(0, 2);

  return (
    <article className="flex flex-wrap items-center gap-4 rounded-xl border border-white/[0.08] bg-[#141414] p-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold uppercase text-zinc-400"
      >
        {partner.logo ? (
          <img src={partner.logo} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          fallback
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[0.65rem] text-white opacity-0 transition group-hover:opacity-100">
          Carregar logo
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

      <div className="min-w-0 flex-1">
        <TextInput
          value={partner.name}
          onChange={(value) => onChange({ ...partner, name: value })}
          placeholder="Nome do parceiro"
        />
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400"
      >
        <Trash2 className="size-3.5" strokeWidth={1.75} />
        Remover
      </button>
    </article>
  );
}
