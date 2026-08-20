import {
  getSectionHref,
  portfolioSections,
  type PortfolioSection,
  type SectionAccent,
} from "@/lib/portfolio-map";

export type Vector3Tuple = readonly [number, number, number];

export type SpatialNode = {
  readonly id: string;
  readonly label: string;
  readonly kind: "root" | "section" | "subsection" | "synthetic";
  readonly position: Vector3Tuple;
  readonly accent: SectionAccent | "root";
  readonly sectionSlug?: PortfolioSection["slug"];
  readonly href?: string;
};

export type SpatialEdge = {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly accent: SectionAccent;
};

export type SpatialRing = {
  readonly id: "profile" | "work" | "knowledge";
  readonly label: string;
  readonly normal: Vector3Tuple;
  readonly accent: SectionAccent;
};

export type SpatialGraph = {
  readonly nodes: readonly SpatialNode[];
  readonly edges: readonly SpatialEdge[];
  readonly rings: readonly SpatialRing[];
};

export const BASE_SPATIAL_NODE_COUNT = 25;
export const STRESS_SPATIAL_NODE_COUNT = 50;
export const ORBIT_RADIUS = 4.15;

const rootNode: SpatialNode = {
  id: "root",
  label: "Portfolio root",
  kind: "root",
  position: [0, 0, 0],
  accent: "root",
  href: "/",
};

export const spatialRings = [
  {
    id: "profile",
    label: "Profile axis",
    normal: [0, 0, 1],
    accent: "cyan",
  },
  {
    id: "work",
    label: "Work axis",
    normal: [0, 1, 0],
    accent: "magenta",
  },
  {
    id: "knowledge",
    label: "Knowledge axis",
    normal: [1, 0, 0],
    accent: "green",
  },
] as const satisfies readonly SpatialRing[];

type SectionPlacement = {
  readonly ringId: SpatialRing["id"];
  readonly angle: number;
};

const sectionPlacements: Record<PortfolioSection["slug"], SectionPlacement> = {
  about: { ringId: "profile", angle: 28 },
  contact: { ringId: "profile", angle: 208 },
  experience: { ringId: "work", angle: 100 },
  projects: { ringId: "work", angle: 280 },
  education: { ringId: "knowledge", angle: 62 },
  skills: { ringId: "knowledge", angle: 242 },
};

function add(a: Vector3Tuple, b: Vector3Tuple): Vector3Tuple {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale(vector: Vector3Tuple, amount: number): Vector3Tuple {
  return [vector[0] * amount, vector[1] * amount, vector[2] * amount];
}

function positionOnRing(
  ringId: SpatialRing["id"],
  angleInDegrees: number,
): Vector3Tuple {
  const angle = (angleInDegrees * Math.PI) / 180;
  const x = Math.cos(angle) * ORBIT_RADIUS;
  const y = Math.sin(angle) * ORBIT_RADIUS;

  if (ringId === "profile") return [x, y, 0];
  if (ringId === "work") return [x, 0, y];
  return [0, x, y];
}

function tangentForRing(
  ringId: SpatialRing["id"],
  angleInDegrees: number,
): Vector3Tuple {
  const angle = (angleInDegrees * Math.PI) / 180;
  const x = -Math.sin(angle);
  const y = Math.cos(angle);

  if (ringId === "profile") return [x, y, 0];
  if (ringId === "work") return [x, 0, y];
  return [0, x, y];
}

function flowerPosition(
  hubPosition: Vector3Tuple,
  placement: SectionPlacement,
  childIndex: number,
): Vector3Tuple {
  const ring = spatialRings.find(({ id }) => id === placement.ringId);
  if (!ring) return hubPosition;

  const bloomAngle = -0.78 + childIndex * 0.78;
  const bloomRadius = 0.72 + (childIndex % 3) * 0.09;
  const tangent = tangentForRing(placement.ringId, placement.angle);
  const outOfPlane = ring.normal;
  const tangentOffset = scale(tangent, Math.cos(bloomAngle) * bloomRadius);
  const planeOffset = scale(outOfPlane, Math.sin(bloomAngle) * bloomRadius);
  const outwardOffset = scale(hubPosition, 0.035 + (childIndex % 2) * 0.018);

  return add(add(add(hubPosition, tangentOffset), planeOffset), outwardOffset);
}

function clampTargetNodeCount(targetNodeCount: number) {
  return Math.max(
    BASE_SPATIAL_NODE_COUNT,
    Math.min(STRESS_SPATIAL_NODE_COUNT, Math.round(targetNodeCount)),
  );
}

export function createSpatialGraph(
  targetNodeCount = BASE_SPATIAL_NODE_COUNT,
): SpatialGraph {
  const nodes: SpatialNode[] = [rootNode];
  const edges: SpatialEdge[] = [];
  const sectionRecords: Array<{
    section: PortfolioSection;
    placement: SectionPlacement;
    hubPosition: Vector3Tuple;
  }> = [];

  for (const section of portfolioSections) {
    const placement = sectionPlacements[section.slug];
    const hubPosition = positionOnRing(placement.ringId, placement.angle);
    const hubId = getSectionNodeId(section.slug);

    nodes.push({
      id: hubId,
      label: section.title,
      kind: "section",
      position: hubPosition,
      accent: section.accent,
      sectionSlug: section.slug,
      href: section.href,
    });
    edges.push({
      id: `edge:root:${section.slug}`,
      sourceId: rootNode.id,
      targetId: hubId,
      accent: section.accent,
    });
    sectionRecords.push({ section, placement, hubPosition });
  }

  for (const { section, placement, hubPosition } of sectionRecords) {
    for (const [subsectionIndex, subsection] of section.subsections.entries()) {
      const nodeId = `subsection:${section.slug}:${subsection.id}`;
      nodes.push({
        id: nodeId,
        label: subsection.label,
        kind: "subsection",
        position: flowerPosition(hubPosition, placement, subsectionIndex),
        accent: section.accent,
        sectionSlug: section.slug,
        href: getSectionHref(section, subsection),
      });
      edges.push({
        id: `edge:${section.slug}:${subsection.id}`,
        sourceId: getSectionNodeId(section.slug),
        targetId: nodeId,
        accent: section.accent,
      });
    }
  }

  const finalNodeCount = clampTargetNodeCount(targetNodeCount);
  let syntheticIndex = 0;

  while (nodes.length < finalNodeCount) {
    const record = sectionRecords[syntheticIndex % sectionRecords.length];
    const childIndex = record.section.subsections.length + Math.floor(
      syntheticIndex / sectionRecords.length,
    );
    const nodeId = `synthetic:${record.section.slug}:${syntheticIndex + 1}`;

    nodes.push({
      id: nodeId,
      label: `Trace ${String(syntheticIndex + 1).padStart(2, "0")}`,
      kind: "synthetic",
      position: flowerPosition(record.hubPosition, record.placement, childIndex),
      accent: record.section.accent,
      sectionSlug: record.section.slug,
    });
    edges.push({
      id: `edge:${nodeId}`,
      sourceId: getSectionNodeId(record.section.slug),
      targetId: nodeId,
      accent: record.section.accent,
    });
    syntheticIndex += 1;
  }

  return { nodes, edges, rings: spatialRings };
}

export function getSectionNodeId(sectionSlug: string) {
  return `section:${sectionSlug}`;
}
