"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProimagemLogo } from "@/components/admin/ProimagemLogo";
import { useAdmin } from "@/hooks/useAdmin";
import { requestPasswordReset } from "@/lib/admin/api";

type View = "login" | "forgot" | "sent";

export function LoginForm() {
  const { login } = useAdmin();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    searchParams.get("reset") === "error"
      ? "O link de recuperação falhou. Pede um novo email."
      : ""
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setView("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar email.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6">
      <div className="w-full max-w-lg text-center">
        <div className="mb-10 flex flex-col items-center">
          <ProimagemLogo className="mb-6 h-10 w-auto max-w-[280px] object-contain sm:h-12" />

          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5">
            <span className="size-1.5 shrink-0 rounded-full bg-emerald-400/90 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
            <span className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-zinc-400">
              {view === "login"
                ? "Painel de gestão de conteúdos"
                : view === "forgot"
                  ? "Recuperar palavra-passe"
                  : "Email enviado"}
            </span>
          </div>
        </div>

        {view === "sent" ? (
          <div className="space-y-4 text-left">
            <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              Se existir uma conta com <span className="font-medium text-white">{email.trim()}</span>,
              envíamos um link para redefinir a palavra-passe. Verifica a caixa de entrada e o spam.
            </p>
            <button
              type="button"
              onClick={() => {
                setView("login");
                setError("");
              }}
              className="w-full rounded-xl border border-white/10 bg-transparent py-3.5 text-sm font-medium text-white transition hover:bg-white/[0.04]"
            >
              Voltar ao login
            </button>
          </div>
        ) : view === "forgot" ? (
          <form onSubmit={handleForgot} className="mt-2 space-y-4 text-left">
            <p className="text-sm text-zinc-400">
              Indica o email da conta. Recebes um link para criar uma nova palavra-passe.
            </p>
            <div>
              <label htmlFor="forgot-email" className="mb-1.5 block text-xs text-zinc-400">
                Email
              </label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="o.teu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-accent/40"
                required
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
              {submitting ? "A enviar…" : "Enviar link de recuperação"}
            </button>

            <button
              type="button"
              onClick={() => {
                setView("login");
                setError("");
              }}
              className="w-full text-center text-xs text-zinc-500 transition hover:text-zinc-300"
            >
              Voltar ao login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="mt-2 space-y-4 text-left">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-xs text-zinc-400">
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="o.teu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-accent/40"
                required
              />
            </div>
            <div>
              <label htmlFor="login-pass" className="mb-1.5 block text-xs text-zinc-400">
                Palavra-passe
              </label>
              <input
                id="login-pass"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setView("forgot");
                  setError("");
                  setPassword("");
                }}
                className="text-xs text-zinc-500 underline-offset-2 transition hover:text-zinc-300 hover:underline"
              >
                Esqueceste a palavra-passe?
              </button>
            </div>

            {error ? (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            ) : null}

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
        )}
      </div>
    </div>
  );
}
