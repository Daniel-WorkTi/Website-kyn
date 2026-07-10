import GalleryView from "@/components/site/GalleryView";
import ReelsGalleryView from "@/components/site/ReelsGalleryView";
import { getGallery } from "@/lib/content";

export default async function AftermoviePage() {
  const data = await getGallery("aftermovie");
  if (data.layout === "reels") {
    return <ReelsGalleryView data={data} />;
  }
  return <GalleryView data={data} />;
}
