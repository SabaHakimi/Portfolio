export type ContentMetric = {
  readonly value: string;
  readonly label: string;
};

export type ProjectCaseStudy = {
  readonly id: string;
  readonly name: string;
  readonly descriptor: string;
  readonly timeframe: string;
  readonly role: string;
  readonly summary: string;
  readonly metrics: readonly ContentMetric[];
  readonly problem: string;
  readonly approach: string;
  readonly architecture: readonly string[];
  readonly implementation: readonly string[];
  readonly stack: readonly string[];
};

export type ExperienceRecord = {
  readonly id: string;
  readonly company: string;
  readonly role: string;
  readonly period: string;
  readonly location: string;
  readonly summary: string;
  readonly metrics: readonly ContentMetric[];
  readonly responsibilities: readonly string[];
  readonly systems: readonly string[];
  readonly stack: readonly string[];
};

export type SharedContentBlock = {
  readonly id: string;
  readonly label: string;
  readonly signal: string;
  readonly lead: string;
  readonly points: readonly string[];
  readonly tags: readonly string[];
};

export const sampleContentNotice =
  "Demonstration content is fictional and exists to validate the portfolio template. Replace it with verified personal information before deployment.";

export const projectCaseStudies = [
  {
    id: "relay-mesh",
    name: "Relay Mesh",
    descriptor: "Incident intelligence platform",
    timeframe: "2025 / 12 weeks",
    role: "Lead full-stack engineer",
    summary:
      "A real-time operations workspace that correlates alerts, deploys, service ownership, and runbook context into one incident timeline.",
    metrics: [
      { value: "11M", label: "events processed daily" },
      { value: "42%", label: "faster incident triage" },
      { value: "180ms", label: "timeline query p95" },
    ],
    problem:
      "Responders were switching between six tools to understand whether an alert represented a new failure, a known regression, or harmless noise. Context arrived out of order, ownership was unclear, and the incident log was reconstructed manually after recovery.",
    approach:
      "Model each operational event as an immutable envelope, enrich it asynchronously, and project the result into a responder-focused timeline. The interface favors progressive disclosure: immediate signal first, supporting evidence one interaction away.",
    architecture: [
      "Kafka ingestion pipeline with idempotent consumers and schema-versioned event envelopes.",
      "PostgreSQL source of truth paired with Redis-backed hot timelines and ownership lookups.",
      "Next.js workspace with streamed server content and optimistic incident annotations.",
      "OpenTelemetry traces connecting deploy, alert, and service-health events.",
    ],
    implementation: [
      "Designed a rule evaluator that grouped related alerts without hiding source events.",
      "Built accessible keyboard workflows for acknowledgement, assignment, and timeline filtering.",
      "Added replay fixtures and contract tests for late, duplicated, and reordered events.",
    ],
    stack: ["TypeScript", "Next.js", "Node.js", "Kafka", "PostgreSQL", "Redis", "OpenTelemetry"],
  },
  {
    id: "atlas-query",
    name: "Atlas Query",
    descriptor: "Collaborative data exploration",
    timeframe: "2024 / 16 weeks",
    role: "Product engineer",
    summary:
      "A browser-based query environment for investigating high-volume operational datasets without moving analysts out of their existing warehouse.",
    metrics: [
      { value: "2.4TB", label: "largest interactive scan" },
      { value: "65%", label: "less repeated analysis" },
      { value: "99.95%", label: "workspace availability" },
    ],
    problem:
      "Investigation knowledge lived in private SQL files and disconnected chat threads. Analysts repeated expensive queries, reviewers lacked execution context, and long-running work was easy to lose when browser sessions ended.",
    approach:
      "Treat each investigation as a durable, shareable document. Query execution is separated from document state so collaborators can review intent, results, and lineage without holding a live compute session.",
    architecture: [
      "React editor backed by a typed document model and conflict-aware incremental persistence.",
      "Queue-based execution service with cancellable jobs, result pagination, and warehouse adapters.",
      "Object storage for immutable result snapshots with signed, time-bound access.",
      "Policy layer enforcing workspace roles and column-level redaction before serialization.",
    ],
    implementation: [
      "Created virtualized result tables that remained responsive across million-row result sets.",
      "Introduced reusable parameter blocks and query lineage to reduce repeated warehouse scans.",
      "Instrumented editor latency, execution wait time, and failure recovery as product-level SLOs.",
    ],
    stack: ["React", "TypeScript", "Python", "FastAPI", "PostgreSQL", "S3", "ClickHouse"],
  },
  {
    id: "edgewatch",
    name: "Edgewatch",
    descriptor: "Local-first observability toolkit",
    timeframe: "2024 / open source",
    role: "Creator and maintainer",
    summary:
      "A compact developer toolkit that captures service telemetry locally, identifies dependency regressions, and exports portable diagnostic bundles.",
    metrics: [
      { value: "4", label: "commands to first trace" },
      { value: "22MB", label: "idle memory footprint" },
      { value: "38%", label: "faster local diagnosis" },
    ],
    problem:
      "Reproducing distributed failures locally usually required a full hosted observability stack. That setup was too heavy for short-lived branches, workshops, and privacy-sensitive diagnostic sessions.",
    approach:
      "Package the smallest useful telemetry path into one local binary and make every generated artifact inspectable. Defaults prioritize immediate value while configuration remains explicit and versionable.",
    architecture: [
      "Go collector accepting OTLP traces, metrics, and structured logs over localhost.",
      "Embedded columnar storage with bounded retention and deterministic compaction.",
      "Dependency graph analysis that compares current traces against saved baselines.",
      "Portable HTML diagnostic reports requiring no backend or external assets.",
    ],
    implementation: [
      "Built zero-config instrumentation recipes for Node.js, Python, and containerized services.",
      "Added deterministic fixture generation for benchmarking and regression tests.",
      "Documented failure modes through runnable examples instead of static snippets alone.",
    ],
    stack: ["Go", "OpenTelemetry", "DuckDB", "WebAssembly", "Docker", "GitHub Actions"],
  },
] as const satisfies readonly ProjectCaseStudy[];

export const experienceRecords = [
  {
    id: "northstar-systems",
    company: "Northstar Systems",
    role: "Senior Software Engineer",
    period: "2024 — Present",
    location: "Remote / United States",
    summary:
      "Owns product and platform work for a multi-tenant operations suite used by engineering teams to coordinate high-impact service changes.",
    metrics: [
      { value: "31%", label: "faster release cycle" },
      { value: "46%", label: "fewer support escalations" },
      { value: "8", label: "engineers mentored" },
    ],
    responsibilities: [
      "Led a cross-functional migration from a coupled dashboard to independently deployable product surfaces.",
      "Defined frontend reliability indicators and introduced performance budgets to pull-request checks.",
      "Partnered with design and support to turn recurring operational problems into roadmap work.",
    ],
    systems: [
      "Multi-tenant authorization and audit-log platform",
      "Event-driven notification and workflow engine",
      "Shared React component and accessibility system",
    ],
    stack: ["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "AWS", "Terraform"],
  },
  {
    id: "signal-works",
    company: "Signal Works",
    role: "Software Engineer II",
    period: "2022 — 2024",
    location: "Hybrid / Seattle, WA",
    summary:
      "Built observability and ingestion systems that helped infrastructure teams understand service behavior across rapidly growing event volumes.",
    metrics: [
      { value: "4.2×", label: "ingestion headroom" },
      { value: "27%", label: "lower compute cost" },
      { value: "99.99%", label: "pipeline availability" },
    ],
    responsibilities: [
      "Reworked ingestion partitioning to remove hot shards during regional traffic spikes.",
      "Shipped a trace-exploration interface with saved views and shareable investigation state.",
      "Established load-test scenarios based on production traffic distributions rather than uniform fixtures.",
    ],
    systems: [
      "High-throughput telemetry ingestion pipeline",
      "Trace search and service dependency explorer",
      "Capacity forecasting and load-simulation suite",
    ],
    stack: ["Go", "React", "Kafka", "ClickHouse", "Kubernetes", "gRPC", "Prometheus"],
  },
  {
    id: "studio-labs",
    company: "Studio Labs",
    role: "Software Engineer",
    period: "2020 — 2022",
    location: "On-site / Portland, OR",
    summary:
      "Delivered customer-facing web products in a small engineering group where product discovery, implementation, release, and support were shared responsibilities.",
    metrics: [
      { value: "3", label: "products launched" },
      { value: "18%", label: "higher activation" },
      { value: "54%", label: "faster CI feedback" },
    ],
    responsibilities: [
      "Implemented onboarding, billing, and account-management workflows from product prototypes.",
      "Introduced component-level testing and visual review to stabilize weekly releases.",
      "Reduced build latency by separating cacheable compilation from integration-test environments.",
    ],
    systems: [
      "Subscription and account-management portal",
      "Experimentation and product analytics pipeline",
      "Continuous integration and preview deployment workflow",
    ],
    stack: ["JavaScript", "React", "Node.js", "Ruby on Rails", "PostgreSQL", "Docker"],
  },
] as const satisfies readonly ExperienceRecord[];

export const sharedSectionContent = {
  about: [
    {
      id: "overview",
      label: "Overview",
      signal: "PROFILE / 01",
      lead: "A product-minded software engineer focused on dependable systems, clear interfaces, and the engineering details that make software feel deliberate.",
      points: [
        "Works across product interfaces, application architecture, and platform concerns.",
        "Prefers measurable outcomes, explicit tradeoffs, and small reversible decisions.",
        "Communicates technical constraints in language shared by engineering, design, and product.",
      ],
      tags: ["Product engineering", "Systems thinking", "User experience"],
    },
    {
      id: "principles",
      label: "Principles",
      signal: "OPERATING MODEL / 02",
      lead: "Strong engineering is a sequence of well-framed decisions rather than a single clever implementation.",
      points: [
        "Make the correct behavior easy to understand and difficult to misuse.",
        "Instrument important paths before optimizing them.",
        "Treat accessibility, failure recovery, and maintenance as product capabilities.",
      ],
      tags: ["Clarity", "Reliability", "Iteration"],
    },
    {
      id: "interests",
      label: "Interests",
      signal: "RESEARCH QUEUE / 03",
      lead: "Current areas of exploration connect interactive software with robust distributed infrastructure.",
      points: [
        "Spatial interfaces and GPU-accelerated interaction models.",
        "Observability systems that reduce diagnosis time instead of merely collecting data.",
        "Developer tooling that preserves context across complex workflows.",
      ],
      tags: ["WebGL", "Observability", "Developer tools"],
    },
  ],
  education: [
    {
      id: "degree",
      label: "Degree",
      signal: "ACADEMIC RECORD / 01",
      lead: "Bachelor of Science in Computer Science — Sample University, 2020.",
      points: [
        "Concentration in distributed systems and human-computer interaction.",
        "Capstone focused on resilient coordination for intermittently connected devices.",
        "Teaching assistant for data structures and introductory systems programming.",
      ],
      tags: ["Computer Science", "2020", "Sample record"],
    },
    {
      id: "coursework",
      label: "Coursework",
      signal: "KNOWLEDGE INDEX / 02",
      lead: "Technical foundations selected for relevance to production software engineering.",
      points: [
        "Algorithms, operating systems, networks, database systems, and compilers.",
        "Distributed computing, computer graphics, and interface design.",
        "Applied statistics and experimentation for product decision-making.",
      ],
      tags: ["Systems", "Graphics", "Data"],
    },
    {
      id: "continued-learning",
      label: "Continued learning",
      signal: "ACTIVE STUDY / 03",
      lead: "Ongoing study is organized around runnable experiments and written technical notes.",
      points: [
        "GPU rendering pipelines and shader fundamentals.",
        "Production observability and service-level objective design.",
        "Advanced TypeScript modeling and modern React architecture.",
      ],
      tags: ["Independent study", "Labs", "Technical writing"],
    },
  ],
  skills: [
    {
      id: "languages",
      label: "Languages",
      signal: "CAPABILITY SET / 01",
      lead: "Languages used to ship product interfaces, backend services, automation, and performance-sensitive tooling.",
      points: [
        "TypeScript and JavaScript for full-stack product development.",
        "Go and Python for services, data pipelines, and developer tooling.",
        "SQL for application data modeling, analysis, and operational diagnosis.",
      ],
      tags: ["TypeScript", "Go", "Python", "SQL"],
    },
    {
      id: "frameworks",
      label: "Frameworks",
      signal: "CAPABILITY SET / 02",
      lead: "Application frameworks selected according to product constraints rather than habit.",
      points: [
        "React and Next.js for accessible, server-aware product interfaces.",
        "Node.js, FastAPI, and lightweight Go services for backend systems.",
        "Three.js and React Three Fiber for purposeful spatial interaction.",
      ],
      tags: ["React", "Next.js", "Node.js", "FastAPI", "Three.js"],
    },
    {
      id: "platforms",
      label: "Platforms & tooling",
      signal: "CAPABILITY SET / 03",
      lead: "Infrastructure and engineering practices supporting observable, repeatable delivery.",
      points: [
        "PostgreSQL, Redis, Kafka, and ClickHouse for application and event workloads.",
        "Docker, Kubernetes, AWS, Terraform, and GitHub Actions for delivery.",
        "Playwright, Vitest, OpenTelemetry, and performance budgets for quality control.",
      ],
      tags: ["AWS", "PostgreSQL", "Kafka", "Docker", "Playwright"],
    },
  ],
  contact: [
    {
      id: "email",
      label: "Email",
      signal: "PRIMARY CHANNEL / 01",
      lead: "The preferred channel for roles, collaborations, and detailed technical conversations.",
      points: [
        "Replace hello@example.dev with the final professional address.",
        "Typical response window: one to two business days.",
        "Include role context and relevant links when possible.",
      ],
      tags: ["hello@example.dev", "Preferred"],
    },
    {
      id: "profiles",
      label: "Professional profiles",
      signal: "EXTERNAL LINKS / 02",
      lead: "Public engineering work and professional history will be linked from this record.",
      points: [
        "GitHub placeholder for source code and technical experiments.",
        "LinkedIn placeholder for employment history and professional contact.",
        "Optional writing archive for technical notes and project retrospectives.",
      ],
      tags: ["GitHub", "LinkedIn", "Writing"],
    },
    {
      id: "resume",
      label: "Résumé",
      signal: "DOCUMENT LINK / 03",
      lead: "A concise résumé artifact will be available as a conventional downloadable document.",
      points: [
        "PDF optimized for recruiter and hiring-manager review.",
        "Content synchronized with the production Experience and Projects records.",
        "Text-first formatting suitable for applicant tracking systems.",
      ],
      tags: ["PDF placeholder", "ATS-ready"],
    },
  ],
} as const satisfies Record<string, readonly SharedContentBlock[]>;
