"use client";

import type { MediaFile } from "@/lib/admin/sections";
import { MAX_UPLOAD_MB } from "@/lib/admin/sections";
import { ImageField } from "./ImageField";
import { MediaPickerField } from "./MediaPickerField";

type VideoFieldProps = {
  videoSrc: string;
  posterSrc?: string;
  files: MediaFile[];
  onVideoChange: (url: string) => void;
  onPosterChange?: (url: string) => void;
  onUploadVideo?: (file: File) => Promise<string | void>;
  onUploadPoster?: (file: File) => Promise<string | void>;
  uploading?: boolean;
  onRemoveVideo?: () => void;
  onRemovePoster?: () => void;
};

export function VideoField({
  videoSrc,
  posterSrc = "",
  files,
  onVideoChange,
  onPosterChange,
  onUploadVideo,
  onUploadPoster,
  uploading,
  onRemoveVideo,
  onRemovePoster
}: VideoFieldProps) {
  return (
    <div className="space-y-6">
      <MediaPickerField
        label="Vídeo"
        value={videoSrc}
        type="video"
        files={files}
        onChange={onVideoChange}
        onUpload={onUploadVideo}
        uploading={uploading}
        onRemove={onRemoveVideo}
        formatsLabel="MP4, WEBM"
        maxSizeLabel={`${MAX_UPLOAD_MB} MB`}
        hint="Este vídeo aparece no fundo da página."
      />
      {onPosterChange && (
        <ImageField
          label="Capa do vídeo (thumbnail)"
          value={posterSrc}
          files={files}
          onChange={onPosterChange}
          onUpload={onUploadPoster}
          uploading={uploading}
          onRemove={onRemovePoster}
          hint="Imagem mostrada antes do vídeo carregar."
        />
      )}
    </div>
  );
}
