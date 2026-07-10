"use client";

import { useRef } from "react";
import { FloatingEditPanel, MediaQuickActions } from "@/components/admin/editor/FloatingEditPanel";
import { MediaPickerModal } from "@/components/admin/media/MediaPickerModal";
import type { MediaFile } from "@/lib/admin/sections";

type VisualMediaControlsProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  pickerOpen: boolean;
  onPickerOpenChange: (open: boolean) => void;
  files: MediaFile[];
  filterType?: "image" | "video" | "all";
  onPick: (file: MediaFile) => void;
  onUpload?: (file: File) => Promise<void>;
  uploading?: boolean;
  onRemove?: () => void;
  extra?: React.ReactNode;
};

export function VisualMediaControls({
  open,
  title,
  onClose,
  pickerOpen,
  onPickerOpenChange,
  files,
  filterType = "all",
  onPick,
  onUpload,
  uploading,
  onRemove,
  extra
}: VisualMediaControlsProps) {
  const uploadRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {open && (
        <FloatingEditPanel title={title} onClose={onClose}>
          {extra}
          <MediaQuickActions
            uploading={uploading}
            onPickLibrary={() => onPickerOpenChange(true)}
            onUpload={() => uploadRef.current?.click()}
            onRemove={onRemove}
          />
          {onUpload && (
            <input
              ref={uploadRef}
              type="file"
              accept={filterType === "video" ? "video/*" : filterType === "image" ? "image/*" : "image/*,video/*"}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void onUpload(file);
              }}
            />
          )}
        </FloatingEditPanel>
      )}

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => onPickerOpenChange(false)}
        files={files}
        filterType={filterType}
        onPick={onPick}
        onUpload={onUpload}
        uploading={uploading}
        title={title}
      />
    </>
  );
}
