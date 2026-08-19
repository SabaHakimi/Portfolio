"use client";

import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BASE_SPATIAL_NODE_COUNT,
  STRESS_SPATIAL_NODE_COUNT,
} from "@/lib/spatial-graph";

export type SceneMetrics = {
  readonly nodeCount: number;
  readonly drawCalls: number;
  readonly triangles: number;
  readonly fps: number;
};

const SpatialCanvas = dynamic(
  () => import("@/components/scene/spatial-canvas").then((module) => module.SpatialCanvas),
  { ssr: false },
);

const initialMetrics: SceneMetrics = {
  nodeCount: BASE_SPATIAL_NODE_COUNT,
  drawCalls: 0,
  triangles: 0,
  fps: 0,
};

export function SpatialExperience() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = pathname === "/";
  const targetNodeCount = useMemo(
    () => {
      if (process.env.NODE_ENV !== "development") {
        return BASE_SPATIAL_NODE_COUNT;
      }

      const requestedCount = Number(searchParams.get("debugNodes"));
      if (!Number.isFinite(requestedCount) || requestedCount <= 0) {
        return BASE_SPATIAL_NODE_COUNT;
      }

      return Math.max(
        BASE_SPATIAL_NODE_COUNT,
        Math.min(STRESS_SPATIAL_NODE_COUNT, Math.round(requestedCount)),
      );
    },
    [searchParams],
  );
  const [metrics, setMetrics] = useState(initialMetrics);

  return (
    <div
      aria-hidden={!active}
      className="spatial-layer"
      data-active={active}
      data-spatial-scene="orbital-filesystem"
    >
      <SpatialCanvas
        active={active}
        onMetrics={setMetrics}
        targetNodeCount={targetNodeCount}
      />

      {process.env.NODE_ENV === "development" ? (
        <output className="scene-metrics" aria-label="Spatial scene metrics">
          <span>
            <strong>{metrics.nodeCount}</strong> NODES
          </span>
          <span>
            <strong>{metrics.drawCalls}</strong> DRAW
          </span>
          <span>
            <strong>{metrics.fps}</strong> FPS
          </span>
          <span>
            <strong>{metrics.triangles}</strong> TRIS
          </span>
        </output>
      ) : null}
    </div>
  );
}
