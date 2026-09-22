"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  loadAdminSettings,
  saveAdminEmail,
  updateAdminPassword,
  type AdminSettings
} from "@/lib/admin/api";

type SettingsModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: (message: string) => void;
};

export function SettingsModal({ open, onClose, onSaved }: SettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [initialEmail, setInitialEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setNewPassword("");
    setConfirmPassword("");
    setLoading(true);

    loadAdminSettings()
      .then((data: AdminSettings) => {
        setEmail(data.email);
        setInitialEmail(data.email);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erro ao carregar.");
      })
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const nextEmail = email.trim();
      if (nextEmail !== initialEmail) {
        const next = await saveAdminEmail(nextEmail);
        setInitialEmail(next.email);
        setEmail(next.email);
      }

      if (newPassword || confirmPassword) {
        await updateAdminPassword({ newPassword, confirmPassword });
        setNewPassword("");
        setConfirmPassword("");
      }

      onSaved?.("Definições actualizadas.");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao guardar.");
    } finally {
      setSaving(false);
    }
  }

  const canSave =
    Boolean(email.trim()) &&
    (email.trim() !== initialEmail || Boolean(newPassword) || Boolean(confirmPassword));

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
          <h2 className="text-sm font-medium text-white">Definições</h2>
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
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="settings-email" className="mb-1.5 block text-xs text-zinc-500">
                  Email
                </label>
                <input
                  id="settings-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white outline-none focus:border-white/20"
                  required
                />
              </div>

              <div>
                <label htmlFor="settings-new-pass" className="mb-1.5 block text-xs text-zinc-500">
                  Nova palavra-passe
                </label>
                <input
                  id="settings-new-pass"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Deixar em branco para não alterar"
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20"
                />
              </div>

              <div>
                <label htmlFor="settings-confirm-pass" className="mb-1.5 block text-xs text-zinc-500">
                  Confirmar palavra-passe
                </label>
                <input
                  id="settings-confirm-pass"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white outline-none focus:border-white/20"
                />
              </div>

              {error ? <p className="text-xs text-red-400">{error}</p> : null}

              <button
                type="submit"
                disabled={saving || !canSave}
                className="w-full rounded-lg bg-white py-2.5 text-sm font-medium text-black transition hover:bg-zinc-100 disabled:opacity-50"
              >
                {saving ? "A guardar…" : "Guardar"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
