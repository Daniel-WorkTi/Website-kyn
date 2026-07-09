import TeamView from "@/components/site/TeamView";
import { getTeam } from "@/lib/content";

export default async function TeamPage() {
  const data = await getTeam();
  return <TeamView data={data} />;
}
