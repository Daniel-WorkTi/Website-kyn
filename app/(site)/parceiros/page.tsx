import PartnersView from "@/components/site/PartnersView";
import { getPartners } from "@/lib/content";

export default async function ParceirosPage() {
  const data = await getPartners();
  return <PartnersView data={data} />;
}
