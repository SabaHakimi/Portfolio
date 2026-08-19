import Link from "next/link";
import { portfolioSections } from "@/lib/portfolio-map";

export default function Home() {
  return (
    <div className="home-spatial-hud">
      <section
        className="home-hud-panel home-hud-intro"
        aria-labelledby="home-title"
      >
        <p className="eyebrow">Software engineering portfolio / root node</p>
        <h1 id="home-title">
          Orbital{" "}
          <span>filesystem.</span>
        </h1>
        <p>
          A spatial index of selected work, experience, education, and
          engineering capabilities. Placeholder identity record active.
        </p>
        <Link className="primary-action" href="/projects">
          Explore projects <span aria-hidden="true">↗</span>
        </Link>
      </section>

      <section
        className="home-hud-panel home-hud-directory"
        aria-labelledby="directory-title"
      >
        <div className="home-hud-directory__header">
          <div>
            <p className="eyebrow">Fallback route registry</p>
            <h2 id="directory-title">Directories</h2>
          </div>
          <span>06 / ONLINE</span>
        </div>

        <ol>
          {portfolioSections.map((section) => (
            <li data-accent={section.accent} key={section.slug}>
              <Link href={section.href} aria-label={section.title}>
                <span>{section.index}</span>
                <strong>{section.title}</strong>
                <small>{section.subsections.length} nodes</small>
                <span aria-hidden="true">↗</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <aside className="home-hud-panel home-hud-guide" aria-label="Scene controls">
        <span>INSPECTION CONTROLS</span>
        <dl>
          <div>
            <dt>Drag</dt>
            <dd>Rotate graph</dd>
          </div>
          <div>
            <dt>Move</dt>
            <dd>Shift camera</dd>
          </div>
          <div>
            <dt>Hover</dt>
            <dd>Trace branch</dd>
          </div>
        </dl>
        <p>Node route activation enters service in Phase 2.</p>
      </aside>

      <div className="home-hud-coordinate" aria-hidden="true">
        <span>ROOT / 00.000</span>
        <span>25 VISIBLE NODES</span>
      </div>
    </div>
  );
}
