import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: {
    default: "Proimagem.pt",
    template: "%s — Proimagem.pt"
  },
  description: "Multicam · Aftermovie · Photography · FPV/Drone · Social Media · Studio Space"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
