import { NextResponse } from "next/server";

/** @deprecated A biblioteca de mídia lê de PostgreSQL via cliente Supabase no admin. */
export async function GET() {
  return NextResponse.json(
    { error: "Use o cliente Supabase no admin. Esta rota foi desactivada." },
    { status: 410 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Use o cliente Supabase no admin. Esta rota foi desactivada." },
    { status: 410 }
  );
}
