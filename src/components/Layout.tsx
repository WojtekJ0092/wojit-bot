// ---------------------------------------------------------------------------
// Layout — top-level app shell
// ---------------------------------------------------------------------------

import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <header className="layout__header">
        <h1 className="layout__title intro-float" style={{ animationDelay: "0.1s" }}>Wojit Bot</h1>
        <span className="layout__subtitle intro-float" style={{ animationDelay: "0.35s" }}>LTL Commit Interview Explorer</span>
      </header>
      <main className="layout__main">{children}</main>
    </div>
  );
}
