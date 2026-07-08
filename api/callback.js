// Recebe o código do GitHub, troca-o por um token de acesso
// e devolve-o à janela do painel de gestão.

export default async function handler(req, res) {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
  const code = req.query.code;

  if (!clientId || !clientSecret) {
    res.status(500).send("Variáveis OAuth do GitHub em falta.");
    return;
  }
  if (!code) {
    res.status(400).send("Código de autorização em falta.");
    return;
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
    });
    const data = await tokenRes.json();

    if (data.error || !data.access_token) {
      res.status(401).send("Falha na autenticação: " + (data.error_description || data.error || "desconhecido"));
      return;
    }

    const payload = JSON.stringify({ token: data.access_token, provider: "github" });
    const html = `<!DOCTYPE html><html><body><script>
      (function () {
        function send(status) {
          window.opener.postMessage("authorization:github:" + status + ":" + '${payload}', "*");
        }
        window.addEventListener("message", function () { send("success"); }, { once: true });
        window.opener.postMessage("authorizing:github", "*");
        send("success");
      })();
    </script></body></html>`;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);
  } catch (err) {
    res.status(500).send("Erro ao contactar o GitHub: " + err.message);
  }
}
