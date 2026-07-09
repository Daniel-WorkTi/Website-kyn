import GalleryView from "@/components/site/GalleryView";
import { getGallery } from "@/lib/content";

export default async function PhotographyPage() {
  const data = await getGallery("photography");
  return <GalleryView data={data} />;
}
