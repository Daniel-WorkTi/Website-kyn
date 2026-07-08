import { requireAdmin, getGithubToken } from "../lib/auth.js";

const REPO = "Daniel-WorkTi/Website-kyn";
const BRANCH = "main";
const ALLOWED_PREFIXES = ["content/", "assets/uploads/"];

function isAllowed(path) {
  return ALLOWED_PREFIXES.some((p) => path.startsWith(p));
}

function githubHeaders(token) {
  return { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };
}

export default async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const token = getGithubToken();
  if (!token) {
    res.status(500).json({ error: "Servidor não configurado (GITHUB_TOKEN)." });
    return;
  }

  if (req.method === "GET") {
    const path = req.query.path;
    if (!path || !isAllowed(path)) {
      res.status(400).json({ error: "Caminho inválido." });
      return;
    }

    try {
      const gh = await fetch(
        `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`,
        { headers: githubHeaders(token) }
      );
      if (!gh.ok) {
        res.status(gh.status).json({ error: "Não foi possível ler o ficheiro." });
        return;
      }
      const data = await gh.json();
      const text = Buffer.from(data.content, "base64").toString("utf8");
      res.status(200).json({ content: text, sha: data.sha });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  if (req.method === "POST") {
    const { path, content, message, sha } = req.body || {};
    if (!path || !isAllowed(path) || content === undefined) {
      res.status(400).json({ error: "Dados em falta." });
      return;
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

      const body = {
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
        res.status(gh.status).json({ error: result.message || "Erro ao guardar." });
        return;
      }
      res.status(200).json({ ok: true, sha: result.content?.sha });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  res.status(405).json({ error: "Método não permitido." });
}
