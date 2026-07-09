"use client";

import type { MediaFile } from "@/lib/admin/sections";
import { MAX_UPLOAD_MB } from "@/lib/admin/sections";
import { MediaPickerField } from "./MediaPickerField";

type ImageFieldProps = {
  label: string;
  value: string;
  files: MediaFile[];
  onChange: (url: string) => void;
  onUpload?: (file: File) => Promise<string | void>;
  uploading?: boolean;
  onRemove?: () => void;
  hint?: string;
};

export function ImageField(props: ImageFieldProps) {
  return (
    <MediaPickerField
      {...props}
      type="image"
      formatsLabel="JPG, PNG, WEBP"
      maxSizeLabel={`${MAX_UPLOAD_MB} MB`}
    />
  );
}
