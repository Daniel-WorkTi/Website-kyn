export const PROIMAGEM_LOGO_SRC = "/assets/logo-proimagem.png";

type ProimagemLogoProps = {
  className?: string;
  alt?: string;
};

export function ProimagemLogo({
  className = "h-10 w-auto object-contain",
  alt = "Proimagem.pt"
}: ProimagemLogoProps) {
  return (
    <img
      src={PROIMAGEM_LOGO_SRC}
      alt={alt}
      className={className}
      decoding="async"
      draggable={false}
    />
  );
}
