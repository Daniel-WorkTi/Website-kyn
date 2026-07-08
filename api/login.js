import { verifyCredentials, createSessionToken, sessionCookie } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido." });
    return;
  }

  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    res.status(500).json({ error: "Painel não configurado. Contacta o programador." });
    return;
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ error: "Utilizador e palavra-passe em falta." });
    return;
  }

  if (!verifyCredentials(String(username).trim(), String(password))) {
    res.status(401).json({ error: "Utilizador ou palavra-passe incorretos." });
    return;
  }

  try {
    const token = createSessionToken(String(username).trim());
    res.setHeader("Set-Cookie", sessionCookie(token));
    res.status(200).json({ ok: true });
  } catch {
    res.status(500).json({ error: "Erro ao iniciar sessão." });
  }
}
