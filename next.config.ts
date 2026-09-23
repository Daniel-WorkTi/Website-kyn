import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["heic-convert", "libheif-js"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vnpslhbjlrhfuqajeuqx.supabase.co",
        pathname: "/storage/v1/object/public/**"
      },
      // Legado — URLs Cloudinary ainda no conteúdo até reupload
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" }
    ],
    unoptimized: true
  }
};

export default nextConfig;
