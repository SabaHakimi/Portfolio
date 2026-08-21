export type SectionAccent =
  | "cyan"
  | "yellow"
  | "magenta"
  | "green"
  | "blue"
  | "orange";

export type PortfolioSubsection = {
  readonly id: string;
  readonly label: string;
  readonly summary: string;
};

export type PortfolioSection = {
  readonly index: string;
  readonly slug: string;
  readonly href: `/${string}`;
  readonly title: string;
  readonly shortLabel: string;
  readonly eyebrow: string;
  readonly summary: string;
  readonly systemPath: string;
  readonly accent: SectionAccent;
  readonly subsections: readonly PortfolioSubsection[];
};

export const portfolioSections = [
  {
    index: "01",
    slug: "about",
    href: "/about",
    title: "About",
    shortLabel: "Identity",
    eyebrow: "Profile axis / identity record",
    summary:
      "A concise introduction, working principles, and the context behind the engineer.",
    systemPath: "/portfolio/profile/about/",
    accent: "cyan",
    subsections: [
      {
        id: "overview",
        label: "Overview",
        summary: "Placeholder for the short professional biography.",
      },
      {
        id: "principles",
        label: "Principles",
        summary: "Placeholder for engineering values and working style.",
      },
      {
        id: "interests",
        label: "Interests",
        summary: "Placeholder for technical interests outside current work.",
      },
    ],
  },
  {
    index: "02",
    slug: "experience",
    href: "/experience",
    title: "Experience",
    shortLabel: "Work log",
    eyebrow: "Work axis / execution history",
    summary:
      "Roles, responsibilities, decisions, and measurable outcomes across a professional timeline.",
    systemPath: "/portfolio/work/experience/",
    accent: "yellow",
    subsections: [
      {
        id: "northstar-systems",
        label: "Northstar Systems",
        summary: "Senior product engineering and platform ownership.",
      },
      {
        id: "signal-works",
        label: "Signal Works",
        summary: "Distributed systems and observability infrastructure.",
      },
      {
        id: "studio-labs",
        label: "Studio Labs",
        summary: "Full-stack product delivery in an early-stage environment.",
      },
    ],
  },
  {
    index: "03",
    slug: "projects",
    href: "/projects",
    title: "Projects",
    shortLabel: "Build archive",
    eyebrow: "Work axis / selected artifacts",
    summary:
      "Selected software projects presented through their problem, approach, implementation, and result.",
    systemPath: "/portfolio/work/projects/",
    accent: "magenta",
    subsections: [
      {
        id: "relay-mesh",
        label: "Relay Mesh",
        summary: "Event-driven incident intelligence for engineering teams.",
      },
      {
        id: "atlas-query",
        label: "Atlas Query",
        summary: "Collaborative exploration for high-volume operational data.",
      },
      {
        id: "edgewatch",
        label: "Edgewatch",
        summary: "A local-first observability toolkit for distributed services.",
      },
    ],
  },
  {
    index: "04",
    slug: "education",
    href: "/education",
    title: "Education",
    shortLabel: "Knowledge archive",
    eyebrow: "Knowledge axis / formal study",
    summary:
      "Academic background, relevant coursework, and continuing technical study.",
    systemPath: "/portfolio/knowledge/education/",
    accent: "blue",
    subsections: [
      {
        id: "degree",
        label: "Degree",
        summary: "Placeholder for degree, institution, and timeline.",
      },
      {
        id: "coursework",
        label: "Coursework",
        summary: "Placeholder for relevant technical coursework.",
      },
      {
        id: "continued-learning",
        label: "Continued learning",
        summary: "Placeholder for certifications and independent study.",
      },
    ],
  },
  {
    index: "05",
    slug: "skills",
    href: "/skills",
    title: "Skills",
    shortLabel: "Capability matrix",
    eyebrow: "Knowledge axis / technical systems",
    summary:
      "Languages, frameworks, infrastructure, tooling, and engineering practices grouped by use.",
    systemPath: "/portfolio/knowledge/skills/",
    accent: "green",
    subsections: [
      {
        id: "languages",
        label: "Languages",
        summary: "Placeholder for programming language proficiency.",
      },
      {
        id: "frameworks",
        label: "Frameworks",
        summary: "Placeholder for application and interface frameworks.",
      },
      {
        id: "platforms",
        label: "Platforms & tooling",
        summary: "Placeholder for infrastructure, data, and developer tools.",
      },
    ],
  },
  {
    index: "06",
    slug: "contact",
    href: "/contact",
    title: "Contact",
    shortLabel: "Open channel",
    eyebrow: "Profile axis / communication link",
    summary:
      "A direct route to email, professional profiles, and résumé access.",
    systemPath: "/portfolio/profile/contact/",
    accent: "orange",
    subsections: [
      {
        id: "email",
        label: "Email",
        summary: "Placeholder for the preferred contact address.",
      },
      {
        id: "profiles",
        label: "Professional profiles",
        summary: "Placeholder for GitHub and professional network links.",
      },
      {
        id: "resume",
        label: "Résumé",
        summary: "Placeholder for a downloadable résumé.",
      },
    ],
  },
] as const satisfies readonly PortfolioSection[];

export type PortfolioSlug = (typeof portfolioSections)[number]["slug"];

export function getPortfolioSection(slug: string) {
  return portfolioSections.find((section) => section.slug === slug);
}

export function getSectionHref(
  section: PortfolioSection,
  subsection: PortfolioSubsection,
) {
  return `${section.href}#${subsection.id}` as const;
}
