import GalleryView from "@/components/site/GalleryView";
import MulticamGalleryView from "@/components/site/MulticamGalleryView";
import { getGallery } from "@/lib/content";

export default async function MulticamPage() {
  const data = await getGallery("multicam");
  if (data.layout === "multicam") {
    return <MulticamGalleryView data={data} />;
  }
  return <GalleryView data={data} />;
}
