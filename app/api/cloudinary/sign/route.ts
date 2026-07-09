import { NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/admin/auth-request";
import { isCloudinaryConfigured, signUpload } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const admin = requireAdminRequest(req);
  if (admin instanceof Response) return admin;

  if (!isCloudinaryConfigured()) {
    return Response.json({ error: "Cloudinary não configurado (CLOUDINARY_URL)." }, { status: 500 });
  }

  try {
    const signed = signUpload();
    return Response.json(signed);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erro ao preparar envio." },
      { status: 500 }
    );
  }
}
