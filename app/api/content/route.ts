import { NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/admin/auth-request";
import { getGithubToken } from "@/lib/auth";

const REPO = "Daniel-WorkTi/Website-kyn";
const BRANCH = "main";
const ALLOWED_PREFIXES = ["content/", "assets/uploads/"];

function isAllowed(path: string) {
  return ALLOWED_PREFIXES.some((p) => path.startsWith(p));
}

function githubHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };
}

export async function GET(req: NextRequest) {
  const admin = requireAdminRequest(req);
  if (admin instanceof Response) return admin;

  const token = getGithubToken();
  if (!token) {
    return Response.json({ error: "Servidor não configurado (GITHUB_TOKEN)." }, { status: 500 });
  }

  const path = req.nextUrl.searchParams.get("path");
  if (!path || !isAllowed(path)) {
    return Response.json({ error: "Caminho inválido." }, { status: 400 });
  }

  try {
    const gh = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`,
      { headers: githubHeaders(token) }
    );
    if (!gh.ok) {
      return Response.json({ error: "Não foi possível ler o ficheiro." }, { status: gh.status });
    }
    const data = await gh.json();
    const text = Buffer.from(data.content, "base64").toString("utf8");
    return Response.json({ content: text, sha: data.sha });
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

  const token = getGithubToken();
  if (!token) {
    return Response.json({ error: "Servidor não configurado (GITHUB_TOKEN)." }, { status: 500 });
  }

  const { path, content, message, sha } = await req.json();
  if (!path || !isAllowed(path) || content === undefined) {
    return Response.json({ error: "Dados em falta." }, { status: 400 });
  }

  try {
    let fileSha = sha;
    if (!fileSha) {
      const meta = await fetch(
        `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`,
        { headers: githubHeaders(token) }
      );
      if (meta.ok) {
        const metaData = await meta.json();
        fileSha = metaData.sha;
      }
    }

    const body: Record<string, string> = {
      message: message || `Atualizar ${path} (${admin})`,
      content: Buffer.from(content, "utf8").toString("base64"),
      branch: BRANCH
    };
    if (fileSha) body.sha = fileSha;

    const gh = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
      method: "PUT",
      headers: { ...githubHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const result = await gh.json();
    if (!gh.ok) {
      return Response.json({ error: result.message || "Erro ao guardar." }, { status: gh.status });
    }
    return Response.json({ ok: true, sha: result.content?.sha });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
