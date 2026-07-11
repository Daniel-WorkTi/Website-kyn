import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ className, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <path
        d="M10 30.5 32 12l22 18.5"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 28.5V53h30V28.5"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M27 53V39h10v14"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function StudioSpaceIcon({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <rect x="13" y="13" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="3.4" />
      <rect x="37" y="13" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="3.4" />
      <rect x="13" y="37" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="3.4" />
      <rect x="37" y="37" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="3.4" />
    </IconBase>
  );
}

export function MulticamIcon({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <rect x="10" y="18" width="34" height="28" rx="6" stroke="currentColor" strokeWidth="3.6" />
      <path
        d="M44 27l12-7v24l-12-7"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="21" cy="32" r="4" stroke="currentColor" strokeWidth="3.2" />
    </IconBase>
  );
}

export function AftermovieIcon({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <rect x="11" y="22" width="42" height="30" rx="5" stroke="currentColor" strokeWidth="3.4" />
      <path
        d="M13 22 20 11h10l-7 11m9 0 7-11h10l-7 11"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 32l11 6-11 6V32Z"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function PhotographyIcon({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <path
        d="M16 22h8l4-6h8l4 6h8c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8 8H16c-4.4 0-8-3.6-8-8V30c0-4.4 3.6-8 8-8Z"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="38" r="10" stroke="currentColor" strokeWidth="3.6" />
      <path d="M48 30h.1" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </IconBase>
  );
}

export function FpvDroneIcon({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <circle cx="18" cy="18" r="7" stroke="currentColor" strokeWidth="3.4" />
      <circle cx="46" cy="18" r="7" stroke="currentColor" strokeWidth="3.4" />
      <circle cx="18" cy="46" r="7" stroke="currentColor" strokeWidth="3.4" />
      <circle cx="46" cy="46" r="7" stroke="currentColor" strokeWidth="3.4" />
      <rect x="25" y="25" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="3.4" />
      <path
        d="M25 29 21 22m18 7 4-7M25 35l-4 7m18-7 4 7"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function SocialMediaIcon({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <path
        d="M13 17h38c4 0 7 3 7 7v18c0 4-3 7-7 7H29L15 57v-8h-2c-4 0-7-3-7-7V24c0-4 3-7 7-7Z"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinejoin="round"
      />
      <path d="M19 31h26M19 39h16" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
    </IconBase>
  );
}

export function EquipaIcon({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <circle cx="25" cy="24" r="8" stroke="currentColor" strokeWidth="3.6" />
      <path
        d="M11 52c2.3-8 8-13 14-13s11.7 5 14 13"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <circle cx="44" cy="26" r="6" stroke="currentColor" strokeWidth="3.2" />
      <path d="M39 42c5 1 9 4.5 11 10" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    </IconBase>
  );
}

export function ParceirosIcon({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <path
        d="M24 35l7-7c3-3 7-3 10 0l2 2"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 32l7-7 8 8-7 7c-2 2-5 2-7 0l-1-1c-2-2-2-5 0-7Z"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      <path
        d="M47 32l-7-7-9 9 9 9c2 2 5 2 7 0l1-1c2-2 2-5 0-7l-1-3Z"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      <path
        d="M25 40l5 5m4-10 9 9m-4-14 8 8"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function SettingsIcon({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <circle cx="32" cy="32" r="8" stroke="currentColor" strokeWidth="3.6" />
      <path
        d="M32 8v8m0 32v8M13.5 13.5l5.7 5.7m25.6 25.6 5.7 5.7M8 32h8m32 0h8M50.5 13.5l-5.7 5.7M19.2 44.8l-5.7 5.7"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path
        d="M24 12.5 28 8h8l4 4.5M51.5 24l4.5 4v8l-4.5 4M40 51.5 36 56h-8l-4-4.5M12.5 40 8 36v-8l4.5-4"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function LogoutIcon({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <path
        d="M28 12H16c-4 0-7 3-7 7v26c0 4 3 7 7 7h12"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path
        d="M35 22l10 10-10 10"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18 32h27" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" />
    </IconBase>
  );
}

export function ChevronRightIcon({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <path
        d="M25 16l16 16-16 16"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function ChevronLeftIcon({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} style={{ transform: "scaleX(-1)" }} {...props}>
      <path
        d="M25 16l16 16-16 16"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function UploadIcon({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <path d="M32 42V14" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" />
      <path
        d="M21 25l11-11 11 11"
        stroke="currentColor"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 42v7c0 4 3 7 7 7h22c4 0 7-3 7-7v-7"
        stroke="currentColor"
        strokeWidth="3.8"
        strokeLinecap="round"
      />
    </IconBase>
  );
}
