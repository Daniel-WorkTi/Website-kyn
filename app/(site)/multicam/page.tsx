import GalleryView from "@/components/site/GalleryView";
import { getGallery } from "@/lib/content";

export default async function MulticamPage() {
  const data = await getGallery("multicam");
  return <GalleryView data={data} />;
}
