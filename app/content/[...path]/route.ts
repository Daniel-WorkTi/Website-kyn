import fs from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const CONTENT_DIR = path.join(process.cwd(), "content");

function resolveContentPath(segments: string[]): string | null {
  const resolved = path.normalize(path.join(CONTENT_DIR, ...segments));
  if (!resolved.startsWith(CONTENT_DIR)) return null;
  if (!resolved.endsWith(".json")) return null;
  return resolved;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filePath = resolveContentPath(segments);
  if (!filePath) {
    return NextResponse.json({ error: "Caminho inválido." }, { status: 400 });
  }

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch {
    return NextResponse.json({ error: "Ficheiro não encontrado." }, { status: 404 });
  }
}
