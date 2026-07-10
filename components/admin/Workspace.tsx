"use client";

import { ContentWorkspace } from "@/components/admin/editor/ContentWorkspace";
import { MediaLibraryPage } from "@/components/admin/media/MediaLibrary";
import { useAdmin } from "@/hooks/useAdmin";

export function Workspace() {
  const {
    section,
    uploading,
    processUpload,
    showToast,
    mediaLibrary,
    mediaLoading,
    refreshMediaLibrary,
    deleteMedia
  } = useAdmin();

  if (section.type === "media") {
    async function uploadMany(files: File[]) {
      if (!files.length) return;

      try {
        for (const file of files) {
          await processUpload(
            file,
            () => {},
            {
              markDirty: false,
              refreshLibrary: false,
              showSuccessToast: false
            }
          );
        }

        await refreshMediaLibrary();
        showToast(
          files.length === 1
            ? "Ficheiro adicionado à biblioteca."
            : `${files.length} ficheiros adicionados à biblioteca.`,
          "ok"
        );
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Erro no envio.", "error");
        await refreshMediaLibrary();
      }
    }

    return (
      <MediaLibraryPage
        files={mediaLibrary}
        loading={mediaLoading}
        uploading={uploading}
        onRefresh={() => void refreshMediaLibrary()}
        onUpload={uploadMany}
        onDelete={deleteMedia}
        onCopyUrl={(url) => {
          void navigator.clipboard.writeText(url);
          showToast("URL copiada!", "ok");
        }}
      />
    );
  }

  return <ContentWorkspace />;
}
