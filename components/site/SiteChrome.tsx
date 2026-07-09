"use client";

import { useEffect, type ReactNode } from "react";

export function SiteChrome({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("site-theme");
    document.body.classList.add("site-theme");
    return () => {
      document.documentElement.classList.remove("site-theme");
      document.body.classList.remove("site-theme");
    };
  }, []);

  return <div className="site-root">{children}</div>;
}
