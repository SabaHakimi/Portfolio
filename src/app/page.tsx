import Link from "next/link";
import {
  getSectionHref,
  portfolioSections,
} from "@/lib/portfolio-map";

export default function Home() {
  return (
    <div className="home-screen">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__status">
          <span>ROOT_NODE</span>
          <span>6 DIRECTORIES</span>
          <span>18 CONTENT NODES</span>
        </div>

        <p className="eyebrow">Software engineering portfolio / template</p>
        <h1 id="home-title">
          Engineering systems.
          <span>Building clear interfaces.</span>
        </h1>
        <p className="home-hero__summary">
          Placeholder copy for a software engineer focused on thoughtful
          systems, high-quality implementation, and interfaces that make
          complex work easier to understand.
        </p>

        <div className="home-hero__actions">
          <Link className="primary-action" href="/projects">
            Explore projects <span aria-hidden="true">↗</span>
          </Link>
          <Link className="secondary-action" href="/experience">
            View experience
          </Link>
        </div>

        <div className="phase-notice">
          <span className="phase-notice__index">00</span>
          <div>
            <strong>Route foundation active</strong>
            <p>
              The spatial renderer and graph interaction are intentionally
              reserved for Phase 1.
            </p>
          </div>
        </div>
      </section>

      <section className="directory-panel" aria-labelledby="directory-title">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Filesystem index</p>
            <h2 id="directory-title">Available directories</h2>
          </div>
          <span>SELECT ROUTE</span>
        </div>

        <div className="directory-grid">
          {portfolioSections.map((section) => (
            <article
              className="directory-card"
              data-accent={section.accent}
              key={section.slug}
            >
              <div className="directory-card__header">
                <span>{section.index}</span>
                <span>{section.shortLabel}</span>
              </div>
              <h3>
                <Link href={section.href}>{section.title}</Link>
              </h3>
              <p>{section.summary}</p>
              <ul aria-label={`${section.title} subsections`}>
                {section.subsections.map((subsection) => (
                  <li key={subsection.id}>
                    <Link href={getSectionHref(section, subsection)}>
                      {subsection.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link className="directory-card__open" href={section.href}>
                Open directory <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
