import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, setSessionCookie, verifyCredentials } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return NextResponse.json(
      { error: "Painel não configurado. Contacta o programador." },
      { status: 500 }
    );
  }

  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Utilizador e palavra-passe em falta." }, { status: 400 });
  }

  if (!(await verifyCredentials(String(username).trim(), String(password)))) {
    return NextResponse.json({ error: "Utilizador ou palavra-passe incorretos." }, { status: 401 });
  }

  try {
    const token = createSessionToken(String(username).trim());
    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, token);
    return response;
  } catch {
    return NextResponse.json({ error: "Erro ao iniciar sessão." }, { status: 500 });
  }
}
