import { NextResponse } from "next/server";

/** @deprecated Upload agora é directo para Supabase Storage (browser autenticado). */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Endpoint desactivado. O upload usa Supabase Storage directamente a partir do painel admin.",
    },
    { status: 410 }
  );
}
