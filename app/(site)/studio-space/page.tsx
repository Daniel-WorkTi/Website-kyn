import GalleryView from "@/components/site/GalleryView";
import StudioGalleryView from "@/components/site/StudioGalleryView";
import { getGallery } from "@/lib/content";

export default async function StudioSpacePage() {
  const data = await getGallery("studio-space");
  if (data.layout === "studio") {
    return <StudioGalleryView data={data} />;
  }
  return <GalleryView data={data} />;
}
