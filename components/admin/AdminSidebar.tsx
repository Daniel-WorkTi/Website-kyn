"use client";

import {
  AftermovieIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EquipaIcon,
  FpvDroneIcon,
  HomeIcon,
  LogoutIcon,
  MulticamIcon,
  ParceirosIcon,
  PhotographyIcon,
  SettingsIcon,
  SocialMediaIcon,
  StudioSpaceIcon
} from "@/components/admin/icons/ProimagemIcons";
import { useCallback, useState, type ComponentType, type SVGProps } from "react";
import { Images } from "lucide-react";

/* ── Tipos ── */

export type SidebarSectionId =
  | "home"
  | "media"
  | "studio-space"
  | "multicam"
  | "aftermovie"
  | "photography"
  | "fpv-drone"
  | "social-media"
  | "team"
  | "partners";

type SidebarIcon = ComponentType<SVGProps<SVGSVGElement>>;

type NavItem = {
  id: SidebarSectionId;
  label: string;
  icon: SidebarIcon;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

export type AdminSidebarProps = {
  activeId?: SidebarSectionId;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNavigate?: (id: SidebarSectionId) => void;
  onSettings?: () => void;
  onLogout?: () => void;
  className?: string;
};

/* ── Navegação ── */

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Conteúdos",
    items: [
      { id: "studio-space", label: "Studio Space", icon: StudioSpaceIcon },
      { id: "multicam", label: "Multicam", icon: MulticamIcon },
      { id: "aftermovie", label: "Aftermovie", icon: AftermovieIcon },
      { id: "photography", label: "Photography", icon: PhotographyIcon },
      { id: "fpv-drone", label: "FPV / Drone", icon: FpvDroneIcon },
      { id: "social-media", label: "Social Media", icon: SocialMediaIcon }
    ]
  },
  {
    title: "Páginas",
    items: [
      { id: "team", label: "Equipa", icon: EquipaIcon },
      { id: "partners", label: "Parceiros", icon: ParceirosIcon }
    ]
  }
];

const HOME_ITEM: NavItem = {
  id: "home",
  label: "Home",
  icon: HomeIcon
};

function MediaNavIcon({ className }: SVGProps<SVGSVGElement>) {
  return <Images className={className} strokeWidth={1.75} />;
}

const MEDIA_ITEM: NavItem = {
  id: "media",
  label: "Mídias",
  icon: MediaNavIcon
};

/* ── Marca ── */

function BrandMark({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-black text-lg font-bold text-white">
        P
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <h2 className="text-base font-semibold tracking-tight text-white">Proimagem.pt</h2>
      <span className="mt-1 inline-flex rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-zinc-400">
        Gestão
      </span>
    </div>
  );
}

/* ── Item de menu ── */

type SidebarItemProps = {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
};

function SidebarItem({ item, active, collapsed, onClick }: SidebarItemProps) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={[
        "sidebar__btn group relative flex w-full items-center transition-all duration-200",
        collapsed
          ? "h-9 justify-center rounded-lg px-0"
          : ["gap-3 rounded-lg", active ? "h-10 px-3" : "h-9 px-2.5"].join(" "),
        active
          ? [
              "is-active bg-white/[0.08] text-white",
              "border border-white/[0.08]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_40px_rgba(0,0,0,0.25)]"
            ].join(" ")
          : "border border-transparent text-zinc-300 hover:bg-white/[0.05] hover:text-white"
      ].join(" ")}
    >
      {active && (
        <span
          className={[
            "absolute left-0 w-[3px] rounded-full bg-emerald-400",
            "shadow-[0_0_18px_rgba(74,222,128,0.8)]",
            collapsed ? "top-2.5 bottom-2.5" : "top-2 bottom-2"
          ].join(" ")}
          aria-hidden="true"
        />
      )}

      <Icon
        className={[
          "sidebar__btn-icon size-4 shrink-0 transition-colors duration-200",
          active ? "text-emerald-400" : "text-zinc-400 group-hover:text-zinc-200"
        ].join(" ")}
      />

      {!collapsed && (
        <span
          className={[
            "sidebar__btn-label truncate text-[13px] leading-none tracking-[-0.01em]",
            active ? "font-medium text-white" : "font-normal"
          ].join(" ")}
        >
          {item.label}
        </span>
      )}
    </button>
  );
}

/* ── Sidebar principal ── */

export function AdminSidebar({
  activeId = "home",
  collapsed: collapsedProp,
  onCollapsedChange,
  onNavigate,
  onSettings,
  onLogout,
  className = ""
}: AdminSidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = collapsedProp ?? internalCollapsed;

  const toggleCollapsed = useCallback(() => {
    const next = !collapsed;
    if (collapsedProp === undefined) setInternalCollapsed(next);
    onCollapsedChange?.(next);
  }, [collapsed, collapsedProp, onCollapsedChange]);

  const handleNavigate = useCallback(
    (id: SidebarSectionId) => {
      onNavigate?.(id);
    },
    [onNavigate]
  );

  return (
    <aside
      className={[
        "sidebar sticky top-4 m-4 flex shrink-0 flex-col self-start overflow-hidden",
        "h-[calc(100dvh-32px)] max-h-[calc(100dvh-32px)] rounded-[28px] border border-white/[0.12]",
        "bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_35%),linear-gradient(180deg,#111315_0%,#050505_100%)]",
        "shadow-[0_40px_120px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.08)]",
        "font-[Inter,SF_Pro_Display,system-ui,sans-serif]",
        "transition-[width] duration-300 ease-out",
        collapsed ? "w-[84px]" : "w-[292px]",
        className
      ].join(" ")}
      aria-label="Menu do painel"
    >
      <div className={["flex h-full min-h-0 flex-col", collapsed ? "p-3.5" : "p-4"].join(" ")}>
        <div className="shrink-0">
          {collapsed ? (
            <div className="flex flex-col items-center gap-3">
              <BrandMark collapsed />
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="Expandir menu"
                className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <ChevronRightIcon className="size-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <BrandMark collapsed={false} />
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="Recolher menu"
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <ChevronLeftIcon className="size-5" />
              </button>
            </div>
          )}
        </div>

        <nav
          className={[
            "sidebar__nav sidebar-scroll -mr-1 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden pr-1",
            collapsed ? "mt-4" : "mt-5"
          ].join(" ")}
        >
          <div className="shrink-0 space-y-1.5">
            <SidebarItem
              item={MEDIA_ITEM}
              active={activeId === MEDIA_ITEM.id}
              collapsed={collapsed}
              onClick={() => handleNavigate(MEDIA_ITEM.id)}
            />
            <SidebarItem
              item={HOME_ITEM}
              active={activeId === HOME_ITEM.id}
              collapsed={collapsed}
              onClick={() => handleNavigate(HOME_ITEM.id)}
            />
          </div>

          <div className="mt-4 flex flex-col gap-4 pb-2">
            {NAV_GROUPS.map((group, index) => (
              <div key={group.title} className="sidebar__group shrink-0">
                {!collapsed && (
                  <p
                    className={[
                      "sidebar__label mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500",
                      index === 0 ? "" : ""
                    ].join(" ")}
                  >
                    {group.title}
                  </p>
                )}
                {collapsed && <div className="my-2 h-px bg-white/[0.06]" aria-hidden="true" />}
                <ul className="flex flex-col gap-1">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <SidebarItem
                        item={item}
                        active={activeId === item.id}
                        collapsed={collapsed}
                        onClick={() => handleNavigate(item.id)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <div className="shrink-0 border-t border-white/[0.06] pt-3">
          <div
            className={[
              "overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]",
              collapsed ? "flex flex-col" : "grid grid-cols-2"
            ].join(" ")}
          >
            <button
              type="button"
              onClick={onSettings}
              aria-label="Definições"
              title={collapsed ? "Definições" : undefined}
              className={[
                "flex h-9 items-center justify-center text-zinc-400 transition-colors",
                "hover:bg-white/[0.06] hover:text-white",
                collapsed ? "" : "border-r border-white/10"
              ].join(" ")}
            >
              <SettingsIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Sair"
              title={collapsed ? "Sair" : undefined}
              className={[
                "flex h-9 items-center justify-center text-zinc-400 transition-colors",
                "hover:bg-white/[0.06] hover:text-red-400",
                collapsed ? "border-t border-white/10" : ""
              ].join(" ")}
            >
              <LogoutIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
