// Inicia o login do GitHub para o painel Decap CMS.
// Requer as variáveis de ambiente no Vercel:
//   OAUTH_GITHUB_CLIENT_ID / OAUTH_GITHUB_CLIENT_SECRET

export default function handler(req, res) {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send("OAUTH_GITHUB_CLIENT_ID em falta.");
    return;
  }

  const host = req.headers.host;
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0];
  const redirectUri = `${proto}://${host}/api/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo",
    state: Math.random().toString(36).slice(2)
  });

  res.writeHead(302, {
    Location: `https://github.com/login/oauth/authorize?${params.toString()}`
  });
  res.end();
}
