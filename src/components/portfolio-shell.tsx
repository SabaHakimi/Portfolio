import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { RouteNavigation } from "@/components/route-navigation";
import { SpatialExperience } from "@/components/scene/spatial-experience";

type PortfolioShellProps = {
  children: ReactNode;
};

export function PortfolioShell({ children }: PortfolioShellProps) {
  return (
    <div className="site-shell" data-phase="spatial-foundation">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div aria-hidden="true" className="site-grid" />
      <Suspense fallback={null}>
        <SpatialExperience />
      </Suspense>

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
          <span>SPATIAL SYSTEM ONLINE</span>
          <span className="system-status__version">PHASE_01</span>
        </div>
      </header>

      <aside className="site-sidebar">
        <RouteNavigation />
      </aside>

      <main className="site-main" id="main-content">
        {children}
      </main>

      <footer className="site-footer">
        <span>DESKTOP INTERFACE / ORBITAL GRAPH FOUNDATION</span>
        <span>WEBGL MODULE: ACTIVE</span>
      </footer>
    </div>
  );
}
