import { requireAdmin, getGithubToken } from "../lib/auth.js";

const REPO = "Daniel-WorkTi/Website-kyn";
const BRANCH = "main";
const MAX_BYTES = 4 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido." });
    return;
  }

  const admin = requireAdmin(req, res);
  if (!admin) return;

  const token = getGithubToken();
  if (!token) {
    res.status(500).json({ error: "Servidor não configurado (GITHUB_TOKEN)." });
    return;
  }

  const { filename, contentBase64, message } = req.body || {};
  if (!filename || !contentBase64) {
    res.status(400).json({ error: "Ficheiro em falta." });
    return;
  }

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  const path = `assets/uploads/${Date.now()}-${safeName}`;

  const bytes = Buffer.from(contentBase64, "base64");
  if (bytes.length > MAX_BYTES) {
    res.status(400).json({ error: "Ficheiro demasiado grande (máx. 4 MB)." });
    return;
  }

  try {
    const gh = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: message || `Adicionar mídia ${safeName} (${admin})`,
        content: contentBase64,
        branch: BRANCH
      })
    });

    const result = await gh.json();
    if (!gh.ok) {
      res.status(gh.status).json({ error: result.message || "Erro no envio." });
      return;
    }

    res.status(200).json({ url: `/${path}`, path });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
