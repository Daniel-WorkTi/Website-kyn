"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeading from "@/components/site/PageHeading";
import Reveal from "@/components/site/Reveal";
import { initials } from "@/lib/utils";
import {
  TEAM_SKILL_LABELS,
  type PartnersJson,
  type TeamJson,
  type TeamMember,
  type Partner
} from "@/lib/types";

const FILTER_ORDER = [
  "photography",
  "videographer",
  "drone",
  "fpv",
  "editor",
  "social-media"
] as const;

interface TeamCardProps {
  member: TeamMember;
  hidden?: boolean;
}

function TeamCard({ member, hidden = false }: TeamCardProps) {
  return (
    <article className={`team-card${hidden ? " is-hidden" : ""}`}>
      <div className="team-card__photo">
        {member.photo ? (
          <img
            src={member.photo}
            alt={member.name}
            loading="lazy"
            style={member.photoPosition ? { objectPosition: member.photoPosition } : undefined}
          />
        ) : (
          <span>{initials(member.name)}</span>
        )}
      </div>
      <div className="team-card__info">
        <h2 className="team-card__name">{member.name}</h2>
        <p className="team-card__roles">{member.roles}</p>
      </div>
    </article>
  );
}

interface TeamFiltersProps {
  active: string | null;
  onChange: (filter: string | null) => void;
}

function TeamFilters({ active, onChange }: TeamFiltersProps) {
  return (
    <div className="team-filters">
      {FILTER_ORDER.map((skill) => (
        <button
          key={skill}
          type="button"
          className={`team-filter${active === skill ? " is-active" : ""}`}
          onClick={() => onChange(active === skill ? null : skill)}
        >
          {TEAM_SKILL_LABELS[skill] || skill}
        </button>
      ))}
    </div>
  );
}

interface TeamGridProps {
  members: TeamMember[];
  filter: string | null;
}

function TeamGrid({ members, filter }: TeamGridProps) {
  const visible = members.filter((member) => {
    if (!filter) return true;
    return (member.skills || []).includes(filter);
  });

  if (visible.length === 0) {
    return (
      <p className="placeholder-note" style={{ textAlign: "right" }}>
        Nenhum membro encontrado para este filtro.
      </p>
    );
  }

  return (
    <div className="team-grid">
      {visible.map((member) => (
        <TeamCard key={member.name} member={member} />
      ))}
    </div>
  );
}

function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <div className="partner-card">
      {partner.logo ? (
        <img src={partner.logo} alt={partner.name} loading="lazy" />
      ) : (
        <span className="partner-card__name">{partner.name}</span>
      )}
    </div>
  );
}

interface TeamViewProps {
  data: TeamJson;
  partners?: PartnersJson;
}

export default function TeamView({ data, partners }: TeamViewProps) {
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.page = "team";
    return () => {
      delete document.documentElement.dataset.page;
    };
  }, []);

  const gridMembers = useMemo(() => data.members || [], [data.members]);
  const mainPartners = partners?.main || [];
  const secondaryPartners = partners?.secondary || [];
  const hasPartners = mainPartners.length > 0 || secondaryPartners.length > 0;

  return (
    <>
      <PageHeading title={data.title} />
      <Reveal className="section">
        <div className="team-featured">
          {(data.featured || []).map((member) => (
            <TeamCard key={member.name} member={member} />
          ))}
        </div>
        <TeamFilters active={filter} onChange={setFilter} />
        <TeamGrid members={gridMembers} filter={filter} />

        {hasPartners && (
          <div id="parceiros" className="team-partners">
            <h2 className="section__title team-partners__title">Parceiros</h2>
            <p className="team-partners__subtitle">Os nossos clientes e parceiros de confiança</p>

            {mainPartners.length > 0 && (
              <div className="partners-section">
                <p className="partners-section__label">Principais</p>
                <div className="partners-grid partners-grid--main">
                  {mainPartners.map((partner) => (
                    <PartnerCard key={partner.name} partner={partner} />
                  ))}
                </div>
              </div>
            )}

            {secondaryPartners.length > 0 && (
              <div className="partners-section">
                <p className="partners-section__label">Secundários</p>
                <div className="partners-grid partners-grid--secondary">
                  {secondaryPartners.map((partner) => (
                    <PartnerCard key={partner.name} partner={partner} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Reveal>
    </>
  );
}
