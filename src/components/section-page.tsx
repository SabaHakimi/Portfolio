import Link from "next/link";
import { RoutePanelControls } from "@/components/route-panel-controls";
import { SectionContent } from "@/components/section-content";
import {
  getSectionHref,
  portfolioSections,
  type PortfolioSection,
} from "@/lib/portfolio-map";

type SectionPageProps = {
  section: PortfolioSection;
};

export function SectionPage({ section }: SectionPageProps) {
  const sectionIndex = portfolioSections.findIndex(
    (candidate) => candidate.slug === section.slug,
  );
  const previousSection = portfolioSections[sectionIndex - 1];
  const nextSection = portfolioSections[sectionIndex + 1];

  return (
    <article
      className="section-screen route-panel"
      data-accent={section.accent}
      data-route-panel={section.slug}
    >
      <RoutePanelControls />

      <div className="route-panel__chrome">
        <div>
          <span aria-hidden="true" className="route-panel__signal" />
          <span>FOCUSED_NODE / {section.index}</span>
          <code>{section.systemPath}</code>
        </div>
        <Link
          aria-label={`Close ${section.title} and return to root`}
          className="route-panel__close"
          href="/"
          scroll={false}
        >
          <span>RETURN TO ROOT</span>
          <strong aria-hidden="true">×</strong>
        </Link>
      </div>

      <nav className="route-panel__route-switcher" aria-label="HUD section navigator">
        {portfolioSections.map((candidate) => (
          <Link
            aria-current={candidate.slug === section.slug ? "page" : undefined}
            data-accent={candidate.accent}
            href={candidate.href}
            key={candidate.slug}
            scroll={false}
          >
            <span>{candidate.index}</span>
            {candidate.title}
          </Link>
        ))}
      </nav>

      <div className="route-panel__viewport">
        <div className="route-panel__content-layout">
          <aside className="route-panel__local-nav">
            <div>
              <p>LOCAL INDEX</p>
              <strong>{section.shortLabel}</strong>
            </div>
            <nav aria-label={`${section.title} contents`}>
              <ol>
                {section.subsections.map((subsection, index) => (
                  <li key={subsection.id}>
                    <Link href={getSectionHref(section, subsection)}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <span>{subsection.label}</span>
                      <small>#{subsection.id}</small>
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="route-panel__local-controls">
              <Link href={previousSection?.href ?? "/"} scroll={false}>
                <span>PREVIOUS</span>
                <strong>{previousSection?.title ?? "Root"}</strong>
              </Link>
              <Link href={nextSection?.href ?? "/"} scroll={false}>
                <span>NEXT</span>
                <strong>{nextSection?.title ?? "Root"}</strong>
              </Link>
            </div>
          </aside>

          <div className="route-panel__document">
            <header className="section-hero">
              <div className="breadcrumb" aria-label="Breadcrumb">
                <Link href="/">root</Link>
                <span aria-hidden="true">/</span>
                <span>portfolio</span>
                <span aria-hidden="true">/</span>
                <span>{section.slug}</span>
              </div>

              <div className="section-hero__meta">
                <span>NODE_{section.index}</span>
                <span>STATUS: TEMPLATE ONLINE</span>
                <span>
                  {String(section.subsections.length).padStart(2, "0")} CONTENT RECORDS
                </span>
              </div>

              <p className="eyebrow">{section.eyebrow}</p>
              <h1>{section.title}</h1>
              <p className="section-hero__summary">{section.summary}</p>
              <code className="system-path">{section.systemPath}</code>
            </header>

            <SectionContent section={section} />

            <footer className="section-screen__footer route-panel__pager">
              <div>
                <p>END OF {section.title.toUpperCase()} RECORD</p>
                <span>Use the HUD index or conventional route controls to continue.</span>
              </div>
              <nav aria-label="Adjacent portfolio sections">
                <Link href={previousSection?.href ?? "/"} scroll={false}>
                  <span aria-hidden="true">←</span>
                  {previousSection?.title ?? "Root"}
                </Link>
                <Link href={nextSection?.href ?? "/"} scroll={false}>
                  {nextSection?.title ?? "Root"}
                  <span aria-hidden="true">→</span>
                </Link>
              </nav>
            </footer>
          </div>
        </div>
      </div>
    </article>
  );
}
