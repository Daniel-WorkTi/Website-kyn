export const PROIMAGEM_LOGO_SRC = "/brand/proimagem-logo.webp";
export const PROIMAGEM_MARK_SRC = "/brand/proimagem-mark.webp";
export const PROIMAGEM_LOGO_PNG = "/brand/proimagem-logo.png";
export const PROIMAGEM_MARK_PNG = "/brand/proimagem-mark.png";

type ProimagemLogoProps = {
  className?: string;
  alt?: string;
  /** `logo` = horizontal; `mark` = versão quadrada */
  variant?: "logo" | "mark";
};

export function ProimagemLogo({
  className = "h-10 w-auto object-contain",
  alt = "Proimagem.pt",
  variant = "logo"
}: ProimagemLogoProps) {
  const webp = variant === "mark" ? PROIMAGEM_MARK_SRC : PROIMAGEM_LOGO_SRC;
  const png = variant === "mark" ? PROIMAGEM_MARK_PNG : PROIMAGEM_LOGO_PNG;

  return (
    <picture>
      <source srcSet={webp} type="image/webp" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={png}
        alt={alt}
        className={className}
        decoding="async"
        draggable={false}
      />
    </picture>
  );
}
