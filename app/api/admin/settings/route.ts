import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { getAdminConfig, saveAdminConfig } from "@/lib/admin-store";
import { requireAdminRequest } from "@/lib/admin/auth-request";

export async function GET(req: NextRequest) {
  const admin = requireAdminRequest(req);
  if (admin instanceof Response) return admin;

  try {
    const config = await getAdminConfig();
    return NextResponse.json({
      username: config.username,
      hasPassword: Boolean(config.passwordHash)
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao carregar definições." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const admin = requireAdminRequest(req);
  if (admin instanceof Response) return admin;

  const body = await req.json();
  const username = String(body.username || "").trim();

  if (!username) {
    return NextResponse.json({ error: "Indica um utilizador." }, { status: 400 });
  }

  try {
    const config = await getAdminConfig(true);
    const next = await saveAdminConfig(
      {
        ...config,
        username,
        displayName: username
      },
      `Alterar utilizador (${admin})`
    );

    const response = NextResponse.json({
      ok: true,
      username: next.username,
      hasPassword: Boolean(next.passwordHash)
    });
    setSessionCookie(response, createSessionToken(next.username));
    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao guardar." },
      { status: 500 }
    );
  }
}
