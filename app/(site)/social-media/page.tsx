import GalleryView from "@/components/site/GalleryView";
import { getGallery } from "@/lib/content";

export default async function SocialMediaPage() {
  const data = await getGallery("social-media");
  return <GalleryView data={data} />;
}
