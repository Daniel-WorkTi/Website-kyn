export interface NavItem {
  label: string;
  href: string;
}

export interface HeroVideo {
  src: string;
  poster?: string;
}

export interface Hero {
  title?: string;
  subtitleLines?: string[];
  videos?: HeroVideo[];
}

export interface MediaItem {
  type: "image" | "video";
  src: string;
  alt?: string;
  poster?: string;
  featured?: boolean;
}

export interface SiteJson {
  brand: string;
  email?: string;
  socials?: {
    instagram?: string;
    vimeo?: string;
    youtube?: string;
  };
  nav: NavItem[];
  hero?: Hero;
  homeStack?: MediaItem[];
}

export interface GalleryJson {
  title: string;
  items?: MediaItem[];
  note?: string;
}

export interface TeamMember {
  name: string;
  roles: string;
  photo?: string;
  skills?: string[];
}

export interface TeamJson {
  title: string;
  featured?: TeamMember[];
  members?: TeamMember[];
}

export interface Partner {
  name: string;
  logo?: string;
}

export interface PartnersJson {
  title: string;
  main?: Partner[];
  secondary?: Partner[];
}

export type TeamSkill =
  | "photography"
  | "videographer"
  | "drone"
  | "fpv"
  | "editor"
  | "social-media";

export const TEAM_SKILL_LABELS: Record<string, string> = {
  photography: "Photography",
  videographer: "Videographer",
  drone: "Drone",
  fpv: "FPV",
  editor: "Editor",
  "social-media": "Social Media",
};
