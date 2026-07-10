"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SidebarSectionId } from "@/components/admin/AdminSidebar";
import Hero from "@/components/site/Hero";
import HomeStack from "@/components/site/HomeStack";
import GalleryView from "@/components/site/GalleryView";
import StudioGalleryView from "@/components/site/StudioGalleryView";
import MulticamGalleryView from "@/components/site/MulticamGalleryView";
import ReelsGalleryView from "@/components/site/ReelsGalleryView";
import TeamView from "@/components/site/TeamView";
import { LightboxProvider } from "@/components/site/Lightbox";
import { SiteChrome } from "@/components/site/SiteChrome";
import { useEditorStore } from "@/hooks/useEditorStore";
import { loadContentFile } from "@/lib/admin/api";
import type {
  AdminSection,
  GalleryData,
  HomeData,
  PartnersData,
  SectionData,
  TeamData
} from "@/lib/admin/sections";
import type { GalleryJson, PartnersJson, TeamJson } from "@/lib/types";
import "@/app/site.css";

type LiveSitePreviewProps = {
  section: AdminSection;
  data: SectionData;
};

function GalleryPage({ sectionId, data }: { sectionId: SidebarSectionId; data: GalleryData }) {
  const gallery = data as GalleryJson;

  if (sectionId === "studio-space" && data.layout === "studio") {
    return <StudioGalleryView data={gallery} />;
  }
  if (sectionId === "multicam" || data.layout === "multicam") {
    return <MulticamGalleryView data={gallery} />;
  }
  if (sectionId === "aftermovie" || data.layout === "reels") {
    return <ReelsGalleryView data={gallery} />;
  }
  return <GalleryView data={gallery} />;
}

export function LiveSitePreview({ section, data }: LiveSitePreviewProps) {
  const { devicePreview } = useEditorStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [teamExtra, setTeamExtra] = useState<TeamJson | null>(null);
  const [partnersExtra, setPartnersExtra] = useState<PartnersJson | null>(null);

  useEffect(() => {
    if (section.type === "team") {
      loadContentFile<PartnersData>("content/partners.json")
        .then(({ data: partners }) => setPartnersExtra(partners as PartnersJson))
        .catch(() => setPartnersExtra({ title: "", main: [], secondary: [] }));
      return;
    }

    if (section.type === "partners") {
      loadContentFile<TeamData>("content/team.json")
        .then(({ data: team }) => setTeamExtra(team as TeamJson))
        .catch(() => setTeamExtra({ title: "", featured: [], members: [] }));
      return;
    }

    setTeamExtra(null);
    setPartnersExtra(null);
  }, [section.type]);

  useEffect(() => {
    if (section.type !== "partners" || !scrollRef.current) return;
    const timer = window.setTimeout(() => {
      const target = scrollRef.current?.querySelector("#parceiros");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [section.type, section.id]);

  const pageContent = useMemo(() => {
    if (section.type === "home") {
      const home = data as HomeData;
      return (
        <>
          <Hero
            hero={home.hero || {}}
            brand={home.brand || "Proimagem.pt"}
            interactive={false}
          />
          {home.homeStack && home.homeStack.length > 0 && (
            <HomeStack items={home.homeStack} />
          )}
        </>
      );
    }

    if (section.type === "gallery") {
      return <GalleryPage sectionId={section.id} data={data as GalleryData} />;
    }

    if (section.type === "team") {
      const team = data as TeamData;
      return (
        <TeamView
          data={team as TeamJson}
          partners={partnersExtra ?? { title: "Parceiros", main: [], secondary: [] }}
        />
      );
    }

    if (section.type === "partners") {
      const partners = data as PartnersData;
      const team = teamExtra ?? { title: "Equipa", featured: [], members: [] };
      return <TeamView data={team} partners={partners as PartnersJson} />;
    }

    return null;
  }, [section.type, section.id, data, partnersExtra, teamExtra]);

  return (
    <div
      ref={scrollRef}
      className="sidebar-scroll min-h-[50vh] min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#050505] lg:min-h-0"
    >
      <div
        className={[
          "mx-auto min-h-full w-full transition-[max-width]",
          devicePreview === "mobile" ? "max-w-[390px] px-0" : "max-w-none"
        ].join(" ")}
      >
        <LightboxProvider>
          <SiteChrome scoped>
            <main className="site-main">{pageContent}</main>
          </SiteChrome>
        </LightboxProvider>
      </div>
    </div>
  );
}
