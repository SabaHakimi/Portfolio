import Link from "next/link";
import {
  getSectionHref,
  type PortfolioSection,
} from "@/lib/portfolio-map";

type SectionPageProps = {
  section: PortfolioSection;
};

export function SectionPage({ section }: SectionPageProps) {
  return (
    <article className="section-screen" data-accent={section.accent}>
      <header className="section-hero">
        <div className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">root</Link>
          <span aria-hidden="true">/</span>
          <span>{section.slug}</span>
        </div>

        <div className="section-hero__meta">
          <span>NODE_{section.index}</span>
          <span>STATUS: PLACEHOLDER</span>
        </div>

        <p className="eyebrow">{section.eyebrow}</p>
        <h1>{section.title}</h1>
        <p className="section-hero__summary">{section.summary}</p>
        <code className="system-path">{section.systemPath}</code>
      </header>

      <section aria-labelledby="subsection-index" className="subsection-index">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Subsection registry</p>
            <h2 id="subsection-index">Content nodes</h2>
          </div>
          <span>{String(section.subsections.length).padStart(2, "0")} entries</span>
        </div>

        <div className="subsection-grid">
          {section.subsections.map((subsection, index) => (
            <section
              className="subsection-card"
              id={subsection.id}
              key={subsection.id}
            >
              <div className="subsection-card__header">
                <span>{section.index}.{index + 1}</span>
                <Link href={getSectionHref(section, subsection)}>
                  #{subsection.id}
                </Link>
              </div>
              <h3>{subsection.label}</h3>
              <p>{subsection.summary}</p>
              <span className="subsection-card__state">AWAITING CONTENT</span>
            </section>
          ))}
        </div>
      </section>

      <div className="section-screen__footer">
        <Link className="text-link" href="/">
          <span aria-hidden="true">←</span> Return to root
        </Link>
        <p>Detailed content treatment is reserved for Phase 3.</p>
      </div>
    </article>
  );
}
