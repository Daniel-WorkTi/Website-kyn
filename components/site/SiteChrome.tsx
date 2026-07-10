"use client";

import { useEffect, type ReactNode } from "react";

type SiteChromeProps = {
  children: ReactNode;
  /** Preview embutido (ex.: admin) — não altera html/body */
  scoped?: boolean;
};

export function SiteChrome({ children, scoped = false }: SiteChromeProps) {
  useEffect(() => {
    if (scoped) return;

    document.documentElement.classList.add("site-theme");
    document.body.classList.add("site-theme");
    return () => {
      document.documentElement.classList.remove("site-theme");
      document.body.classList.remove("site-theme");
    };
  }, [scoped]);

  return <div className={`site-root${scoped ? " site-root--scoped" : ""}`}>{children}</div>;
}
