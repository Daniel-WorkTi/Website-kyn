import Nav from "@/components/site/Nav";
import { LightboxProvider } from "@/components/site/Lightbox";
import { SiteChrome } from "@/components/site/SiteChrome";
import { getSite } from "@/lib/content";
import "../site.css";

export default async function SiteLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const site = await getSite();

  return (
    <SiteChrome>
      <Nav items={site.nav} />
      <LightboxProvider>
        <main className="site-main">{children}</main>
      </LightboxProvider>
    </SiteChrome>
  );
}
