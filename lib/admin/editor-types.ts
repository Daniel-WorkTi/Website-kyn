import type { HomeData } from "@/lib/admin/sections";

export type DevicePreview = "desktop" | "mobile";

export type EditableElementType =
  | "hero"
  | "text"
  | "button"
  | "video"
  | "card"
  | "section";

export type EditableElementId =
  | "hero"
  | "hero.video"
  | "hero.title"
  | "hero.subtitle"
  | "hero.button"
  | "featured.sectionTitle"
  | "stats"
  | `featured.cards.${string}`;

export type TitleSize = "sm" | "md" | "lg";
export type TextAlign = "left" | "center" | "right";
export type ButtonStyle = "primary" | "secondary";

const TITLE_SIZE_TO_HOME: Record<TitleSize, "small" | "medium" | "large"> = {
  sm: "small",
  md: "medium",
  lg: "large"
};

const TITLE_SIZE_FROM_HOME: Record<"small" | "medium" | "large", TitleSize> = {
  small: "sm",
  medium: "md",
  large: "lg"
};

export type FeaturedCardEditor = {
  id: string;
  title: string;
  image: string;
  link: string;
  visible: boolean;
};

export type StatItem = {
  id: string;
  label: string;
  value: string;
};

export type PageEditorData = {
  hero: {
    mediaType: "video" | "image";
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    videoSrc: string;
    videoPoster: string;
    imageSrc: string;
    visible: boolean;
    titleSize: TitleSize;
    titleAlign: TextAlign;
    titleColor: string;
    buttonStyle: ButtonStyle;
    buttonVisible: boolean;
  };
  featured: {
    sectionTitle: string;
    visible: boolean;
    cards: FeaturedCardEditor[];
  };
  stats: StatItem[];
};

const DEFAULT_CARDS: FeaturedCardEditor[] = [
  {
    id: "studio-space",
    title: "Studio Space",
    image: "https://supdmick.com/_assets/video/71d67c33cfa966760c88adbe5e62ed9e.jpg",
    link: "/studio-space",
    visible: true
  },
  {
    id: "aftermovie",
    title: "Aftermovie",
    image: "https://supdmick.com/_assets/video/8414d0ba0697b5a91a14de18bbbe8727.jpg",
    link: "/aftermovie",
    visible: true
  },
  {
    id: "multicam",
    title: "Multicam",
    image: "https://supdmick.com/_assets/video/71d67c33cfa966760c88adbe5e62ed9e.jpg",
    link: "/multicam",
    visible: true
  },
  {
    id: "fpv-drone",
    title: "FPV / Drone",
    image: "https://supdmick.com/_assets/video/8414d0ba0697b5a91a14de18bbbe8727.jpg",
    link: "/fpv-drone",
    visible: true
  }
];

const DEFAULT_STATS: StatItem[] = [
  { id: "events", label: "Eventos", value: "500+" },
  { id: "clients", label: "Clientes", value: "120+" },
  { id: "years", label: "Anos", value: "10+" },
  { id: "hours", label: "Horas de filmagem", value: "5k+" }
];

export function createDefaultPageEditorData(): PageEditorData {
  return {
    hero: {
      mediaType: "video",
      title: "PROIMAGEM.PT",
      subtitle: "MULTICAM | AFTERMOVIE | PHOTOGRAPHY | FPV / DRONE",
      buttonText: "VER TRABALHOS",
      buttonLink: "/studio-space",
      videoSrc: "",
      videoPoster: "",
      imageSrc: "",
      visible: true,
      titleSize: "lg",
      titleAlign: "center",
      titleColor: "#ffffff",
      buttonStyle: "primary",
      buttonVisible: true
    },
    featured: {
      sectionTitle: "ÚLTIMOS TRABALHOS",
      visible: true,
      cards: DEFAULT_CARDS.map((c) => ({ ...c }))
    },
    stats: DEFAULT_STATS.map((s) => ({ ...s }))
  };
}

export function homeDataToPageEditor(data: HomeData): PageEditorData {
  const defaults = createDefaultPageEditorData();
  const videos = data.hero?.videos ?? [];
  const subtitle =
    data.hero?.subtitleLines?.join(" | ").toUpperCase() ?? defaults.hero.subtitle;

  const cards =
    (data as HomeData & { featured?: { cards?: FeaturedCardEditor[] } }).featured?.cards?.map(
      (c) => ({ ...c, visible: c.visible ?? true })
    ) ??
    defaults.featured.cards.map((card, i) => {
      const stackItem = data.homeStack?.[i];
      if (!stackItem) return card;
      return {
        ...card,
        image: stackItem.src || card.image,
        title: stackItem.alt || card.title
      };
    });

  return {
    hero: {
      ...defaults.hero,
      title: (data.hero?.title ?? defaults.hero.title).toUpperCase(),
      subtitle,
      videoSrc: videos[0]?.src ?? defaults.hero.videoSrc,
      videoPoster: videos[0]?.poster ?? "",
      imageSrc: stackItemImage(data, 0) ?? defaults.hero.imageSrc,
      buttonText: (data.hero as { buttonText?: string })?.buttonText ?? defaults.hero.buttonText,
      buttonLink: (data.hero as { buttonLink?: string })?.buttonLink ?? defaults.hero.buttonLink,
      buttonStyle:
        (data.hero as { buttonStyle?: ButtonStyle })?.buttonStyle ?? defaults.hero.buttonStyle,
      buttonVisible:
        (data.hero as { buttonVisible?: boolean })?.buttonVisible ?? defaults.hero.buttonVisible,
      mediaType:
        (data.hero as { mediaType?: "video" | "image" })?.mediaType ?? defaults.hero.mediaType,
      visible: (data.hero as { visible?: boolean })?.visible ?? defaults.hero.visible,
      titleSize:
        TITLE_SIZE_FROM_HOME[
          (data.hero?.titleSize as "small" | "medium" | "large" | undefined) ?? "large"
        ] ?? defaults.hero.titleSize,
      titleAlign:
        (data.hero as { titleAlign?: TextAlign })?.titleAlign ?? defaults.hero.titleAlign,
      titleColor:
        (data.hero as { titleColor?: string })?.titleColor ?? defaults.hero.titleColor
    },
    featured: {
      sectionTitle:
        (data as HomeData & { featured?: { sectionTitle?: string } }).featured?.sectionTitle ??
        defaults.featured.sectionTitle,
      visible:
        (data as HomeData & { featured?: { visible?: boolean } }).featured?.visible ??
        defaults.featured.visible,
      cards
    },
    stats:
      (data as HomeData & { stats?: StatItem[] }).stats?.length
        ? (data as HomeData & { stats: StatItem[] }).stats
        : defaults.stats
  };
}

function stackItemImage(data: HomeData, index: number): string {
  return data.homeStack?.[index]?.src ?? "";
}

export function pageEditorToHomeData(page: PageEditorData, original: HomeData): HomeData {
  const subtitleLines = page.hero.subtitle
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  const lines =
    subtitleLines.length > 1
      ? subtitleLines
      : page.hero.subtitle
          .split(/\s*\|\s*/)
          .map((s) => s.trim())
          .filter(Boolean);

  const videos =
    page.hero.mediaType === "video" && page.hero.videoSrc
      ? [
          {
            src: page.hero.videoSrc,
            poster: page.hero.videoPoster
          },
          ...(original.hero?.videos?.[1]
            ? [{ src: original.hero.videos[1].src, poster: original.hero.videos[1].poster ?? "" }]
            : [])
        ]
      : original.hero?.videos ?? [];

  const homeStack = original.homeStack ?? [];

  return {
    ...original,
    brand: original.brand ?? "Proimagem.pt",
    hero: {
      ...original.hero,
      title: page.hero.title,
      subtitleLines: lines.length ? lines : [page.hero.subtitle],
      videos,
      buttonText: page.hero.buttonText,
      buttonLink: page.hero.buttonLink,
      buttonStyle: page.hero.buttonStyle,
      buttonVisible: page.hero.buttonVisible,
      mediaType: page.hero.mediaType,
      imageSrc: page.hero.imageSrc,
      visible: page.hero.visible,
      titleSize: TITLE_SIZE_TO_HOME[page.hero.titleSize],
      titleAlign: page.hero.titleAlign,
      titleColor: page.hero.titleColor
    },
    featured: {
      sectionTitle: page.featured.sectionTitle,
      visible: page.featured.visible,
      cards: page.featured.cards
    },
    stats: page.stats,
    homeStack
  };
}

export function getElementType(id: EditableElementId | null): EditableElementType | null {
  if (!id) return null;
  if (id === "hero" || id === "hero.video") return id === "hero.video" ? "video" : "hero";
  if (id === "hero.title" || id === "hero.subtitle") return "text";
  if (id === "hero.button") return "button";
  if (id === "featured.sectionTitle") return "section";
  if (id === "stats") return "section";
  if (id.startsWith("featured.cards.")) return "card";
  return null;
}

export function getElementLabel(id: EditableElementId): string {
  const map: Record<string, string> = {
    hero: "Editar Hero",
    "hero.video": "Editar vídeo",
    "hero.title": "Editar título",
    "hero.subtitle": "Editar subtítulo",
    "hero.button": "Editar botão",
    "featured.sectionTitle": "Editar secção",
    stats: "Editar estatísticas"
  };
  if (map[id]) return map[id];
  if (id.startsWith("featured.cards.")) return "Editar card";
  return "Editar";
}
