import GalleryView from "@/components/site/GalleryView";
import { getGallery } from "@/lib/content";

export default async function AftermoviePage() {
  const data = await getGallery("aftermovie");
  return <GalleryView data={data} />;
}
