"use client";

import type { MediaFile } from "@/lib/admin/sections";
import { MAX_UPLOAD_MB } from "@/lib/admin/sections";
import { MediaPickerField } from "./MediaPickerField";

type VideoFieldProps = {
  videoSrc: string;
  files: MediaFile[];
  onVideoChange: (url: string) => void;
  onUploadVideo?: (file: File) => Promise<string | void>;
  uploading?: boolean;
  onRemoveVideo?: () => void;
};

export function VideoField({
  videoSrc,
  files,
  onVideoChange,
  onUploadVideo,
  uploading,
  onRemoveVideo
}: VideoFieldProps) {
  return (
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
      hint="O vídeo inicia automaticamente no site — não é necessária capa."
    />
  );
}
