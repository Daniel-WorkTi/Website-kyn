/** Chave pública (publishable ou anon). Nunca service_role. */
export function getSupabasePublishableKey(): string {
  // Acesso ESTÁTICO obrigatório — Next.js só injeta NEXT_PUBLIC_* no browser assim.
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (publishable) return publishable;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (anon) return anon;
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY (ou PUBLISHABLE_KEY) em falta. Na Vercel: Environment Variables + Redeploy."
  );
}

export function getSupabaseUrl(): string {
  // Acesso ESTÁTICO obrigatório — `process.env[name]` dinâmico NÃO funciona no client.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL em falta. Na Vercel: Environment Variables + Redeploy."
    );
  }
  return url;
}

export function isSupabaseConfigured(): boolean {
  try {
    getSupabaseUrl();
    getSupabasePublishableKey();
    return true;
  } catch {
    return false;
  }
}
