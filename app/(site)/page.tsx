import Hero from "@/components/site/Hero";
import HomeStack from "@/components/site/HomeStack";
import { getSite } from "@/lib/content";

export default async function HomePage() {
  const site = await getSite();

  return (
    <>
      <Hero hero={site.hero || {}} brand={site.brand} />
      {site.homeStack && site.homeStack.length > 0 && (
        <HomeStack items={site.homeStack} />
      )}
    </>
  );
}
