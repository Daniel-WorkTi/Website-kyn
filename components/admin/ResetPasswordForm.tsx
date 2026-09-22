"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { completePasswordReset } from "@/lib/admin/api";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function bootstrap() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!cancelled && session) {
        setReady(true);
        setChecking(false);
      }
    }

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        setReady(true);
        setChecking(false);
      }
    });

    const timeout = window.setTimeout(() => {
      if (!cancelled) setChecking(false);
    }, 2500);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await completePasswordReset(password, confirm);
      setSuccess(true);
      window.setTimeout(() => {
        router.replace("/admin");
      }, 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao actualizar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6">
      <div className="w-full max-w-lg text-center">
        <div className="mb-10 flex flex-col items-center">
          <h1 className="mb-6 text-2xl font-bold uppercase tracking-[0.28em] text-white sm:text-3xl">
            Proimagem.pt
          </h1>
          <p className="text-sm text-zinc-400">Nova palavra-passe</p>
        </div>

        {checking ? (
          <p className="text-sm text-zinc-500">A validar o link…</p>
        ) : !ready ? (
          <div className="space-y-4 text-left">
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200/90">
              Este link é inválido ou expirou. Volta ao login e pede um novo email de recuperação.
            </p>
            <Link
              href="/admin"
              className="block w-full rounded-xl bg-white py-3.5 text-center text-sm font-semibold text-black"
            >
              Voltar ao login
            </Link>
          </div>
        ) : success ? (
          <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            Palavra-passe actualizada. A redirecionar para o login…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label htmlFor="reset-pass" className="mb-1.5 block text-xs text-zinc-400">
                Nova palavra-passe
              </label>
              <input
                id="reset-pass"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                className="w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
              />
            </div>
            <div>
              <label htmlFor="reset-confirm" className="mb-1.5 block text-xs text-zinc-400">
                Confirmar
              </label>
              <input
                id="reset-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
                className="w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-black transition hover:bg-zinc-100 disabled:opacity-60"
            >
              {submitting ? "A guardar…" : "Guardar nova palavra-passe"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
