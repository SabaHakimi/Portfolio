import Link from "next/link";
import type { ReactNode } from "react";
import { RouteNavigation } from "@/components/route-navigation";

type PortfolioShellProps = {
  children: ReactNode;
};

export function PortfolioShell({ children }: PortfolioShellProps) {
  return (
    <div className="site-shell" data-phase="route-foundation">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div aria-hidden="true" className="site-grid" />

      <header className="site-header">
        <Link className="brand" href="/" aria-label="Portfolio home">
          <span aria-hidden="true" className="brand__mark">
            P/
          </span>
          <span>
            <strong>PORTFOLIO</strong>
            <small>ROOT DIRECTORY</small>
          </span>
        </Link>

        <div className="system-status" aria-label="System status">
          <span aria-hidden="true" className="system-status__light" />
          <span>ROUTE SYSTEM ONLINE</span>
          <span className="system-status__version">PHASE_00</span>
        </div>
      </header>

      <aside className="site-sidebar">
        <RouteNavigation />
      </aside>

      <main className="site-main" id="main-content">
        {children}
      </main>

      <footer className="site-footer">
        <span>DESKTOP INTERFACE / STATIC ROUTE FOUNDATION</span>
        <span>WEBGL MODULE: NOT LOADED</span>
      </footer>
    </div>
  );
}
