"use client";

import { ProimagemLogo } from "@/components/admin/ProimagemLogo";
import { useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";

export function LoginForm() {
  const { login } = useAdmin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6">
      <div className="w-full max-w-lg text-center">
        <div className="mb-10 flex flex-col items-center">
          <ProimagemLogo className="mb-5 h-14 w-auto max-w-[min(100%,200px)] sm:h-16" />

          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5">
            <span className="size-1.5 shrink-0 rounded-full bg-emerald-400/90 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
            <span className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-zinc-400">
              Painel de gestão de conteúdos
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4 text-left">
          <div>
            <label htmlFor="login-user" className="mb-1.5 block text-xs text-zinc-400">
              Utilizador
            </label>
            <input
              id="login-user"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
              required
            />
          </div>
          <div>
            <label htmlFor="login-pass" className="mb-1.5 block text-xs text-zinc-400">
              Palavra-passe
            </label>
            <input
              id="login-pass"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
              required
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={[
              "w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-black",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]",
              "transition-all duration-200 ease-out",
              "hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_28px_rgba(255,255,255,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]",
              "active:translate-y-0 active:scale-[0.985] active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.12)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40",
              "disabled:pointer-events-none disabled:opacity-60"
            ].join(" ")}
          >
            {submitting ? "A entrar…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
