import TeamView from "@/components/site/TeamView";
import { getPartners, getTeam } from "@/lib/content";

export default async function TeamPage() {
  const [team, partners] = await Promise.all([getTeam(), getPartners()]);
  return <TeamView data={team} partners={partners} />;
}
