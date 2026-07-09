"use client";

import { useMemo, useState } from "react";
import PageHeading from "@/components/site/PageHeading";
import Reveal from "@/components/site/Reveal";
import { initials } from "@/lib/utils";
import { TEAM_SKILL_LABELS, type TeamJson, type TeamMember } from "@/lib/types";

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
          <img src={member.photo} alt={member.name} loading="lazy" />
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

interface TeamViewProps {
  data: TeamJson;
}

export default function TeamView({ data }: TeamViewProps) {
  const [filter, setFilter] = useState<string | null>(null);

  const gridMembers = useMemo(() => data.members || [], [data.members]);

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
      </Reveal>
    </>
  );
}
