import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback PKCE do Supabase Auth (recuperação de password, etc.).
 * Ex.: /auth/callback?code=...&next=/admin/reset-password
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextRaw = url.searchParams.get("next") || "/admin";
  const next = nextRaw.startsWith("/") ? nextRaw : "/admin";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const fail = new URL("/admin", url.origin);
      fail.searchParams.set("reset", "error");
      return NextResponse.redirect(fail);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
