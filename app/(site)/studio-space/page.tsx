import GalleryView from "@/components/site/GalleryView";
import { getGallery } from "@/lib/content";

export default async function StudioSpacePage() {
  const data = await getGallery("studio-space");
  return <GalleryView data={data} />;
}
