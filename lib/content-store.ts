import fs from "fs/promises";
import path from "path";
import { getGithubToken } from "@/lib/auth";

const REPO = "Daniel-WorkTi/Website-kyn";
const BRANCH = "main";
const CONTENT_ROOT = path.join(process.cwd(), "content");

function githubHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };
}

export function resolveContentRelativePath(segments: string[]): string | null {
  const relative = path.posix.join("content", ...segments);
  if (relative.includes("..") || !relative.endsWith(".json")) return null;
  const local = path.normalize(path.join(process.cwd(), relative));
  if (!local.startsWith(CONTENT_ROOT)) return null;
  return relative.replace(/\\/g, "/");
}

function resolveLocalAbsolutePath(relativePath: string): string | null {
  const segments = relativePath.replace(/^content\//, "").split("/");
  return resolveContentRelativePath(segments)
    ? path.normalize(path.join(process.cwd(), relativePath))
    : null;
}

export async function readContentFile(
  relativePath: string
): Promise<{ content: string; sha: string | null }> {
  const token = getGithubToken();

  if (token) {
    try {
      const gh = await fetch(
        `https://api.github.com/repos/${REPO}/contents/${relativePath}?ref=${BRANCH}`,
        { headers: githubHeaders(token), cache: "no-store" }
      );
      if (gh.ok) {
        const data = (await gh.json()) as { content?: string; sha?: string };
        if (data.content) {
          return {
            content: Buffer.from(data.content, "base64").toString("utf8"),
            sha: data.sha ?? null
          };
        }
      }
    } catch {
      /* fallback to local */
    }
  }

  const localPath = resolveLocalAbsolutePath(relativePath);
  if (!localPath) throw new Error("Caminho de conteúdo inválido.");

  const content = await fs.readFile(localPath, "utf8");
  return { content, sha: null };
}

export async function readContentJson<T>(relativePath: string): Promise<T> {
  const { content } = await readContentFile(relativePath);
  return JSON.parse(content) as T;
}

export async function writeContentFile(
  relativePath: string,
  content: string,
  sha: string | null,
  message: string
): Promise<string | null> {
  const token = getGithubToken();
  let newSha: string | null = null;

  if (token) {
    let fileSha = sha;
    if (!fileSha) {
      const meta = await fetch(
        `https://api.github.com/repos/${REPO}/contents/${relativePath}?ref=${BRANCH}`,
        { headers: githubHeaders(token) }
      );
      if (meta.ok) {
        const metaData = (await meta.json()) as { sha?: string };
        fileSha = metaData.sha ?? null;
      }
    }

    const body: Record<string, string> = {
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      branch: BRANCH
    };
    if (fileSha) body.sha = fileSha;

    const gh = await fetch(`https://api.github.com/repos/${REPO}/contents/${relativePath}`, {
      method: "PUT",
      headers: { ...githubHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const result = (await gh.json()) as { message?: string; content?: { sha?: string } };
    if (!gh.ok) {
      throw new Error(result.message || "Erro ao guardar no GitHub.");
    }
    newSha = result.content?.sha ?? null;
  }

  const localPath = resolveLocalAbsolutePath(relativePath);
  if (localPath) {
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, content, "utf8");
  }

  if (!token && !localPath) {
    throw new Error("Servidor não configurado (GITHUB_TOKEN ou pasta content/).");
  }

  return newSha;
}
