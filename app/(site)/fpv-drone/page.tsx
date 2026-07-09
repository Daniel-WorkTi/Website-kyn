import GalleryView from "@/components/site/GalleryView";
import { getGallery } from "@/lib/content";

export default async function FpvDronePage() {
  const data = await getGallery("fpv-drone");
  return <GalleryView data={data} />;
}
