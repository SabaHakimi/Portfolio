import { Suspense, type ReactNode } from "react";
import { SpatialExperience } from "@/components/scene/spatial-experience";

type PortfolioShellProps = {
  children: ReactNode;
};

export function PortfolioShell({ children }: PortfolioShellProps) {
  return (
    <div className="site-shell" data-phase="cyberpunk-vfx">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div aria-hidden="true" className="site-grid" />
      <div aria-hidden="true" className="system-vfx">
        <span className="system-vfx__scan" />
        <span className="system-vfx__noise" />
        <span className="system-vfx__corners" />
      </div>
      <Suspense fallback={null}>
        <SpatialExperience />
      </Suspense>

      <main className="site-main" id="main-content">
        {children}
      </main>

      <footer className="site-footer">
        <span>DESKTOP INTERFACE / ADAPTIVE RENDER PIPELINE</span>
        <span>HUD + VISUAL EFFECTS SYSTEM: ACTIVE</span>
      </footer>
    </div>
  );
}
