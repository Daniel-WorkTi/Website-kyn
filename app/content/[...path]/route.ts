import { NextRequest, NextResponse } from "next/server";
import { readContentFile, resolveContentRelativePath } from "@/lib/content-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const relativePath = resolveContentRelativePath(segments);
  if (!relativePath) {
    return NextResponse.json({ error: "Caminho inválido." }, { status: 400 });
  }

  try {
    const { content } = await readContentFile(relativePath);
    const data = JSON.parse(content);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch {
    return NextResponse.json({ error: "Ficheiro não encontrado." }, { status: 404 });
  }
}
