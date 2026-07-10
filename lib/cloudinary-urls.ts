const CLOUD_NAME = "zk5df6k0";
const FOLDER = "proimagem";

/** URL de imagem para o site público (pasta proimagem no Cloudinary). */
export function cloudinaryGalleryImage(publicId: string, width = 2400): string {
  const id = publicId.includes("/") ? publicId : `${FOLDER}/${publicId}`;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_${width},c_limit/${id}`;
}

/** URL de vídeo MP4 compatível com browsers (pasta proimagem). */
export function cloudinaryGalleryVideo(publicId: string): string {
  const id = publicId.includes("/") ? publicId : `${FOLDER}/${publicId}`;
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/f_mp4,vc_h264,q_auto/${id}.mp4`;
}
