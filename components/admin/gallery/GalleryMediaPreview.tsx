"use client";

type GalleryMediaPreviewProps = {
  src: string;
  type: "image" | "video";
  poster?: string;
  title: string;
  onReplace: () => void;
};

export function GalleryMediaPreview({
  src,
  type,
  poster,
  title,
  onReplace
}: GalleryMediaPreviewProps) {
  return (
    <button
      type="button"
      onClick={onReplace}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onReplace();
        }
      }}
      aria-label={`Substituir ${title}`}
      className="group relative block w-full overflow-hidden bg-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
    >
      <div className="aspect-video w-full">
        {type === "video" ? (
          <video
            src={src}
            poster={poster || undefined}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => {
              try {
                e.currentTarget.currentTime = 0.05;
              } catch {
                /* ignore */
              }
            }}
          />
        ) : (
          <img src={src} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      {type === "video" ? (
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <span className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-sm">
            <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
              <path d="M0 0v16l14-8L0 0z" />
            </svg>
          </span>
        </span>
      ) : null}
      <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-medium tracking-wide text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
        Substituir
      </span>
    </button>
  );
}
