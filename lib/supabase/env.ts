function requirePublicEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name} não configurado. Copia .env.example para .env.local e preenche as variáveis Supabase.`
    );
  }
  return value;
}

/** Chave pública (publishable ou anon). Nunca service_role. */
export function getSupabasePublishableKey(): string {
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (publishable) return publishable;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (anon) return anon;
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY em falta."
  );
}

export function getSupabaseUrl(): string {
  return requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL");
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
