function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendVerificationCodeEmail(to: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Envio de email não configurado. Adiciona RESEND_API_KEY e EMAIL_FROM às variáveis de ambiente."
    );
  }

  const from = process.env.EMAIL_FROM || "Proimagem.pt <onboarding@resend.dev>";
  const safeCode = escapeHtml(code);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Código de verificação — Proimagem.pt",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111;">
          <p>Recebeste este email porque pediste para alterar a palavra-passe do painel Proimagem.pt.</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:0.2em;margin:24px 0;">${safeCode}</p>
          <p style="color:#666;font-size:14px;">O código expira em 15 minutos. Se não foste tu, ignora este email.</p>
        </div>
      `
    })
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message || "Não foi possível enviar o email de verificação.");
  }
}
