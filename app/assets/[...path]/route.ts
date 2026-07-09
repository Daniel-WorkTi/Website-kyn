import fs from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const ASSETS_DIR = path.join(process.cwd(), "assets");

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime"
};

function resolveAssetPath(segments: string[]): string | null {
  const resolved = path.normalize(path.join(ASSETS_DIR, ...segments));
  if (!resolved.startsWith(ASSETS_DIR)) return null;
  return resolved;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filePath = resolveAssetPath(segments);
  if (!filePath) {
    return NextResponse.json({ error: "Caminho inválido." }, { status: 400 });
  }

  try {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return NextResponse.json({ error: "Ficheiro não encontrado." }, { status: 404 });
  }
}
