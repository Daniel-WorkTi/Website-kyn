import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin/auth-request";
import { readContentFile, writeContentFile } from "@/lib/content-store";
import { revalidateContentPaths } from "@/lib/revalidate-content";

const ALLOWED_PREFIXES = ["content/", "assets/uploads/"];

function isAllowed(path: string) {
  return ALLOWED_PREFIXES.some((p) => path.startsWith(p));
}

export async function GET(req: NextRequest) {
  const admin = requireAdminRequest(req);
  if (admin instanceof Response) return admin;

  const filePath = req.nextUrl.searchParams.get("path");
  if (!filePath || !isAllowed(filePath)) {
    return Response.json({ error: "Caminho inválido." }, { status: 400 });
  }

  try {
    const { content, sha } = await readContentFile(filePath);
    return Response.json({ content, sha });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = requireAdminRequest(req);
  if (admin instanceof Response) return admin;

  const { path: filePath, content, message, sha } = await req.json();
  if (!filePath || !isAllowed(filePath) || content === undefined) {
    return Response.json({ error: "Dados em falta." }, { status: 400 });
  }

  try {
    const newSha = await writeContentFile(
      filePath,
      content,
      sha ?? null,
      message || `Atualizar ${filePath} (${admin})`
    );

    if (filePath.startsWith("content/")) {
      revalidateContentPaths(filePath);
    }

    return Response.json({ ok: true, sha: newSha });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
