export const PROIMAGEM_LOGO_SRC =
  "https://res.cloudinary.com/zk5df6k0/image/upload/v1783721421/proimagem/avuve9px3olbytlqhset.png";

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
