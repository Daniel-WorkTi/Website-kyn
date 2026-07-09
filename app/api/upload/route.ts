import { NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/admin/auth-request";

/** @deprecated Usa upload directo para Cloudinary via /api/cloudinary/sign */
export async function POST(req: NextRequest) {
  const admin = requireAdminRequest(req);
  if (admin instanceof Response) return admin;

  return Response.json(
    {
      error:
        "O envio de ficheiros passou para o Cloudinary. Actualiza a página do admin e tenta novamente."
    },
    { status: 410 }
  );
}
