import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestão — Proimagem.pt",
  description: "Painel de gestão do site Proimagem.pt"
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-black text-white antialiased">{children}</div>;
}
