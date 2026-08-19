import { describe, expect, it } from "vitest";
import {
  BASE_SPATIAL_NODE_COUNT,
  createSpatialGraph,
  STRESS_SPATIAL_NODE_COUNT,
} from "@/lib/spatial-graph";

describe("spatial graph", () => {
  it("creates the approved root, section, and subsection hierarchy", () => {
    const graph = createSpatialGraph();

    expect(graph.nodes).toHaveLength(BASE_SPATIAL_NODE_COUNT);
    expect(graph.edges).toHaveLength(BASE_SPATIAL_NODE_COUNT - 1);
    expect(graph.nodes.filter(({ kind }) => kind === "root")).toHaveLength(1);
    expect(graph.nodes.filter(({ kind }) => kind === "section")).toHaveLength(6);
    expect(graph.nodes.filter(({ kind }) => kind === "subsection")).toHaveLength(18);
    expect(graph.rings.map(({ id }) => id)).toEqual([
      "profile",
      "work",
      "knowledge",
    ]);
  });

  it("is deterministic and contains only finite positions", () => {
    const firstGraph = createSpatialGraph();
    const secondGraph = createSpatialGraph();

    expect(firstGraph).toEqual(secondGraph);
    expect(
      firstGraph.nodes.every(({ position }) =>
        position.every((coordinate) => Number.isFinite(coordinate)),
      ),
    ).toBe(true);
    expect(new Set(firstGraph.nodes.map(({ id }) => id)).size).toBe(
      firstGraph.nodes.length,
    );
  });

  it("supports a clamped deterministic 50-node stress fixture", () => {
    const graph = createSpatialGraph(500);

    expect(graph.nodes).toHaveLength(STRESS_SPATIAL_NODE_COUNT);
    expect(graph.edges).toHaveLength(STRESS_SPATIAL_NODE_COUNT - 1);
    expect(graph.nodes.filter(({ kind }) => kind === "synthetic")).toHaveLength(
      STRESS_SPATIAL_NODE_COUNT - BASE_SPATIAL_NODE_COUNT,
    );
  });
});
