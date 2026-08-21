import {
  experienceRecords,
  projectCaseStudies,
  sampleContentNotice,
  sharedSectionContent,
  type ContentMetric,
} from "@/lib/portfolio-content";
import type { PortfolioSection } from "@/lib/portfolio-map";

function ContentNotice() {
  return (
    <aside className="content-notice" aria-label="Template content notice">
      <span>SAMPLE_DATA</span>
      <p>{sampleContentNotice}</p>
    </aside>
  );
}

function MetricGrid({ metrics }: { metrics: readonly ContentMetric[] }) {
  return (
    <dl className="content-metrics">
      {metrics.map((metric) => (
        <div key={`${metric.value}-${metric.label}`}>
          <dt>{metric.label}</dt>
          <dd>{metric.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TagList({ tags }: { tags: readonly string[] }) {
  return (
    <ul className="content-tags" aria-label="Technologies and topics">
      {tags.map((tag) => (
        <li key={tag}>{tag}</li>
      ))}
    </ul>
  );
}

function ProjectsContent() {
  return (
    <div className="content-record-stack" data-content-template="projects">
      <ContentNotice />
      {projectCaseStudies.map((project, index) => (
        <article
          aria-labelledby={`${project.id}-title`}
          className="case-study"
          id={project.id}
          key={project.id}
        >
          <header className="case-study__header">
            <div className="record-index" aria-hidden="true">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <i />
            </div>
            <div>
              <p className="record-kicker">{project.descriptor}</p>
              <h2 id={`${project.id}-title`}>{project.name}</h2>
              <p className="record-summary">{project.summary}</p>
            </div>
            <dl className="record-meta">
              <div>
                <dt>Period</dt>
                <dd>{project.timeframe}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{project.role}</dd>
              </div>
              <div>
                <dt>Record</dt>
                <dd>Fictional template</dd>
              </div>
            </dl>
          </header>

          <MetricGrid metrics={project.metrics} />

          <div className="content-narrative-grid">
            <section>
              <p className="content-label">01 / Problem</p>
              <h3>Context and constraint</h3>
              <p>{project.problem}</p>
            </section>
            <section>
              <p className="content-label">02 / Approach</p>
              <h3>Product and system strategy</h3>
              <p>{project.approach}</p>
            </section>
          </div>

          <div className="technical-record-grid">
            <section>
              <p className="content-label">03 / Architecture</p>
              <h3>System topology</h3>
              <ol className="indexed-list">
                {project.architecture.map((item, itemIndex) => (
                  <li key={item}>
                    <span>{String(itemIndex + 1).padStart(2, "0")}</span>
                    <p>{item}</p>
                  </li>
                ))}
              </ol>
            </section>
            <section>
              <p className="content-label">04 / Implementation</p>
              <h3>Engineering decisions</h3>
              <ul className="signal-list">
                {project.implementation.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>

          <footer className="record-footer">
            <div>
              <p className="content-label">05 / Technology stack</p>
              <TagList tags={project.stack} />
            </div>
            <span className="record-link-placeholder" aria-disabled="true">
              CASE STUDY LINK / PENDING
            </span>
          </footer>
        </article>
      ))}
    </div>
  );
}

function ExperienceContent() {
  return (
    <div className="content-record-stack" data-content-template="experience">
      <ContentNotice />
      {experienceRecords.map((record, index) => (
        <article
          aria-labelledby={`${record.id}-title`}
          className="experience-record"
          id={record.id}
          key={record.id}
        >
          <header className="experience-record__header">
            <div className="experience-record__timeline" aria-hidden="true">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <i />
            </div>
            <div className="experience-record__identity">
              <p className="record-kicker">{record.company}</p>
              <h2 id={`${record.id}-title`}>{record.role}</h2>
              <p className="record-summary">{record.summary}</p>
            </div>
            <dl className="record-meta">
              <div>
                <dt>Period</dt>
                <dd>{record.period}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{record.location}</dd>
              </div>
              <div>
                <dt>Record</dt>
                <dd>Fictional template</dd>
              </div>
            </dl>
          </header>

          <MetricGrid metrics={record.metrics} />

          <div className="experience-record__body">
            <section>
              <p className="content-label">Responsibilities</p>
              <h3>Scope and contribution</h3>
              <ul className="signal-list signal-list--large">
                {record.responsibilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section>
              <p className="content-label">Systems</p>
              <h3>Selected ownership</h3>
              <ol className="indexed-list">
                {record.systems.map((system, systemIndex) => (
                  <li key={system}>
                    <span>{String(systemIndex + 1).padStart(2, "0")}</span>
                    <p>{system}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <footer className="record-footer">
            <div>
              <p className="content-label">Working stack</p>
              <TagList tags={record.stack} />
            </div>
          </footer>
        </article>
      ))}
    </div>
  );
}

type SharedSectionSlug = keyof typeof sharedSectionContent;

function isSharedSectionSlug(slug: string): slug is SharedSectionSlug {
  return slug in sharedSectionContent;
}

function SharedSectionContent({ section }: { section: PortfolioSection }) {
  if (!isSharedSectionSlug(section.slug)) return null;

  return (
    <div className="shared-content-grid" data-content-template="shared">
      <ContentNotice />
      {sharedSectionContent[section.slug].map((block, index) => (
        <section
          aria-labelledby={`${block.id}-title`}
          className="shared-content-block"
          id={block.id}
          key={block.id}
        >
          <header>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p className="record-kicker">{block.signal}</p>
            <h2 id={`${block.id}-title`}>{block.label}</h2>
          </header>
          <p className="shared-content-block__lead">{block.lead}</p>
          <ul className="signal-list">
            {block.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <TagList tags={block.tags} />
        </section>
      ))}
    </div>
  );
}

export function SectionContent({ section }: { section: PortfolioSection }) {
  if (section.slug === "projects") return <ProjectsContent />;
  if (section.slug === "experience") return <ExperienceContent />;
  return <SharedSectionContent section={section} />;
}
