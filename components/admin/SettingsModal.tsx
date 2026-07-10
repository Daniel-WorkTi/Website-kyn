"use client";

import { ArrowLeft, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  confirmPasswordChange,
  loadAdminSettings,
  requestPasswordCode,
  saveAdminUsername,
  type AdminSettings
} from "@/lib/admin/api";

type SettingsModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: (message: string) => void;
};

export function SettingsModal({ open, onClose, onSaved }: SettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"main" | "reset">("main");
  const [username, setUsername] = useState("");
  const [initialUsername, setInitialUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [codeHint, setCodeHint] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) return;
    setView("main");
    setError("");
    setCodeSent(false);
    setCodeHint("");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setLoading(true);

    loadAdminSettings()
      .then((data: AdminSettings) => {
        setUsername(data.username);
        setInitialUsername(data.username);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erro ao carregar.");
      })
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  async function handleSaveUsername(e: React.FormEvent) {
    e.preventDefault();
    if (username.trim() === initialUsername) {
      onClose();
      return;
    }
    setError("");
    setSaving(true);
    try {
      const next = await saveAdminUsername(username.trim());
      setInitialUsername(next.username);
      setUsername(next.username);
      onSaved?.("Utilizador actualizado.");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const message = await requestPasswordCode({ newPassword, confirmPassword });
      setCodeSent(true);
      setCodeHint(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar código.");
    } finally {
      setSending(false);
    }
  }

  async function handleConfirmCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setConfirming(true);
    try {
      await confirmPasswordChange(code);
      setView("main");
      setCodeSent(false);
      setCodeHint("");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      onSaved?.("Palavra-passe alterada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao confirmar.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          {view === "reset" ? (
            <button
              type="button"
              onClick={() => {
                setView("main");
                setError("");
                setCodeSent(false);
                setCodeHint("");
              }}
              className="flex items-center gap-1.5 text-xs text-zinc-400 transition hover:text-white"
            >
              <ArrowLeft className="size-3.5" strokeWidth={1.75} />
              Voltar
            </button>
          ) : (
            <h2 className="text-sm font-medium text-white">Definições</h2>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-5 py-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-zinc-500" strokeWidth={1.75} />
            </div>
          ) : view === "main" ? (
            <form onSubmit={handleSaveUsername} className="space-y-4">
              <div>
                <label htmlFor="settings-user" className="mb-1.5 block text-xs text-zinc-500">
                  Utilizador
                </label>
                <input
                  id="settings-user"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label htmlFor="settings-pass" className="mb-1.5 block text-xs text-zinc-500">
                  Palavra-passe
                </label>
                <input
                  id="settings-pass"
                  type="password"
                  value="••••••••"
                  readOnly
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setView("reset")}
                className="text-xs text-zinc-400 underline-offset-2 transition hover:text-white hover:underline"
              >
                Esqueceu a palavra-passe?
              </button>

              {error ? <p className="text-xs text-red-400">{error}</p> : null}

              <button
                type="submit"
                disabled={saving || !username.trim()}
                className="w-full rounded-lg bg-white py-2.5 text-sm font-medium text-black transition hover:bg-zinc-100 disabled:opacity-50"
              >
                {saving ? "A guardar…" : "Guardar"}
              </button>
            </form>
          ) : (
            <form onSubmit={codeSent ? handleConfirmCode : handleSendCode} className="space-y-4">
              <p className="text-xs text-zinc-500">
                Envia um código para o email de recuperação e define uma nova palavra-passe.
              </p>

              <div>
                <label htmlFor="new-pass" className="mb-1.5 block text-xs text-zinc-500">
                  Nova palavra-passe
                </label>
                <input
                  id="new-pass"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label htmlFor="confirm-pass" className="mb-1.5 block text-xs text-zinc-500">
                  Confirmar
                </label>
                <input
                  id="confirm-pass"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white outline-none focus:border-white/20"
                />
              </div>

              {codeSent ? (
                <>
                  {codeHint ? <p className="text-xs text-amber-400/90">{codeHint}</p> : null}
                  <div>
                    <label htmlFor="verify-code" className="mb-1.5 block text-xs text-zinc-500">
                      Código
                    </label>
                    <input
                      id="verify-code"
                      inputMode="numeric"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-3 py-2.5 text-sm tracking-[0.3em] text-white outline-none focus:border-white/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={confirming || code.length !== 6}
                    className="w-full rounded-lg bg-white py-2.5 text-sm font-medium text-black transition hover:bg-zinc-100 disabled:opacity-50"
                  >
                    {confirming ? "A confirmar…" : "Confirmar"}
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-lg bg-white py-2.5 text-sm font-medium text-black transition hover:bg-zinc-100 disabled:opacity-50"
                >
                  {sending ? "A enviar…" : "Enviar código por email"}
                </button>
              )}

              {error ? <p className="text-xs text-red-400">{error}</p> : null}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
