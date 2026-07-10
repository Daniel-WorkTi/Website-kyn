"use client";

import type { MediaFile } from "@/lib/admin/sections";
import { MediaPickerField } from "./MediaPickerField";

type ImageFieldProps = {
  label: string;
  value: string;
  files: MediaFile[];
  onChange: (url: string) => void;
  onUpload?: (file: File) => Promise<string | void>;
  uploading?: boolean;
  onRemove?: () => void;
};

export function ImageField(props: ImageFieldProps) {
  return <MediaPickerField {...props} type="image" />;
}
