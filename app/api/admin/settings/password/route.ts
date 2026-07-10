import { NextRequest, NextResponse } from "next/server";
import {
  clearPasswordChangeCookie,
  generateVerificationCode,
  readPasswordChangeCookie,
  setPasswordChangeCookie,
  verifyVerificationCode
} from "@/lib/admin-verification";
import { getAdminConfig, saveAdminConfig } from "@/lib/admin-store";
import { requireAdminRequest } from "@/lib/admin/auth-request";
import { sendVerificationCodeEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}

export async function POST(req: NextRequest) {
  const admin = requireAdminRequest(req);
  if (admin instanceof Response) return admin;

  const body = await req.json();
  const newPassword = String(body.newPassword || "");
  const confirmPassword = String(body.confirmPassword || "");

  if (!newPassword || !confirmPassword) {
    return NextResponse.json({ error: "Preenche a nova palavra-passe." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "A palavra-passe deve ter pelo menos 8 caracteres." },
      { status: 400 }
    );
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "As palavras-passe não coincidem." }, { status: 400 });
  }

  try {
    const config = await getAdminConfig(true);
    const email =
      config.email ||
      process.env.ADMIN_EMAIL?.trim() ||
      process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1] ||
      "";

    if (!email) {
      return NextResponse.json(
        { error: "Email de recuperação não configurado. Contacta o programador." },
        { status: 400 }
      );
    }

    const code = generateVerificationCode();
    await sendVerificationCodeEmail(email, code);

    const response = NextResponse.json({
      ok: true,
      message: `Código enviado para ${maskEmail(email)}.`
    });
    setPasswordChangeCookie(response, hashPassword(newPassword), code);
    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao enviar código." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const admin = requireAdminRequest(req);
  if (admin instanceof Response) return admin;

  const body = await req.json();
  const code = String(body.code || "").trim();
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Código inválido." }, { status: 400 });
  }

  const pending = readPasswordChangeCookie(req);
  if (!pending) {
    return NextResponse.json({ error: "Pedido expirado. Tenta outra vez." }, { status: 400 });
  }

  if (!verifyVerificationCode(code, pending.codeHash)) {
    return NextResponse.json({ error: "Código incorrecto." }, { status: 401 });
  }

  try {
    const config = await getAdminConfig(true);
    await saveAdminConfig(
      {
        ...config,
        passwordHash: pending.newPasswordHash
      },
      `Alterar palavra-passe (${admin})`
    );

    const response = NextResponse.json({ ok: true });
    clearPasswordChangeCookie(response);
    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao alterar palavra-passe." },
      { status: 500 }
    );
  }
}
