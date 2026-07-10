import { NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/admin/auth-request";
import { configureCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import type { MediaFile } from "@/lib/admin/sections";

type CloudinaryResource = {
  secure_url: string;
  public_id: string;
  resource_type: string;
  bytes?: number;
  created_at?: string;
  width?: number;
  height?: number;
  duration?: number;
};

function mapResource(item: CloudinaryResource): MediaFile {
  const name = item.public_id.split("/").pop() || item.public_id;
  const isCover = /poster|cover|capa|thumb/i.test(name);
  return {
    url: item.secure_url,
    name,
    type: item.resource_type === "video" ? "video" : "image",
    size: item.bytes,
    createdAt: item.created_at,
    width: item.width,
    height: item.height,
    duration: item.duration,
    publicId: item.public_id,
    isCover
  };
}

export async function GET(req: NextRequest) {
  const admin = requireAdminRequest(req);
  if (admin instanceof Response) return admin;

  if (!isCloudinaryConfigured()) {
    return Response.json({ files: [], configured: false });
  }

  try {
    const cloudinary = configureCloudinary();

    const [images, videos] = await Promise.all([
      cloudinary.api.resources({
        type: "upload",
        resource_type: "image",
        max_results: 500
      }),
      cloudinary.api.resources({
        type: "upload",
        resource_type: "video",
        max_results: 500
      })
    ]);

    const files: MediaFile[] = [...images.resources, ...videos.resources]
      .map((item: CloudinaryResource) => mapResource(item))
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return Response.json({ files, configured: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const admin = requireAdminRequest(req);
  if (admin instanceof Response) return admin;

  if (!isCloudinaryConfigured()) {
    return Response.json({ error: "Cloudinary não configurado." }, { status: 500 });
  }

  try {
    const body = (await req.json()) as { publicId?: string; type?: "image" | "video" };
    if (!body.publicId) {
      return Response.json({ error: "publicId em falta." }, { status: 400 });
    }

    const cloudinary = configureCloudinary();
    const resourceType = body.type === "video" ? "video" : "image";
    await cloudinary.uploader.destroy(body.publicId, { resource_type: resourceType });

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erro ao remover." },
      { status: 500 }
    );
  }
}
