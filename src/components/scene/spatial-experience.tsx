"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  BASE_SPATIAL_NODE_COUNT,
  getSectionNodeId,
  STRESS_SPATIAL_NODE_COUNT,
  type SpatialNode,
} from "@/lib/spatial-graph";
import { getPortfolioSection } from "@/lib/portfolio-map";

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

type PendingNavigation = {
  readonly nodeId: string;
  readonly href: string;
  readonly label: string;
};

function subscribeToReducedMotion(onChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerReducedMotionSnapshot() {
  return false;
}

export function SpatialExperience() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );
  const routeSection = getPortfolioSection(pathname.slice(1));
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation | null>(null);
  const navigationStartedRef = useRef<string | null>(null);
  const sceneMode =
    pathname === "/"
      ? pendingNavigation
        ? "transition"
        : "explore"
      : routeSection
        ? "panel"
        : "hidden";
  const sceneVisible = sceneMode !== "hidden";
  const sceneInteractive = sceneMode === "explore";
  const focusedNodeId =
    pendingNavigation?.nodeId ??
    (routeSection ? getSectionNodeId(routeSection.slug) : null);
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

  useEffect(() => {
    if (pathname === "/" || !pendingNavigation) return;

    const clearPendingNavigation = window.setTimeout(() => {
      setPendingNavigation(null);
      navigationStartedRef.current = null;
    }, 0);

    return () => window.clearTimeout(clearPendingNavigation);
  }, [pathname, pendingNavigation]);

  function handleNodeIntent(node: SpatialNode) {
    if (!node.href || node.href === "/") return;
    router.prefetch(node.href.split("#")[0]);
  }

  function handleNodeActivate(node: SpatialNode) {
    if (pathname !== "/" || pendingNavigation || !node.href || node.href === "/") {
      return;
    }

    router.prefetch(node.href.split("#")[0]);
    navigationStartedRef.current = null;
    setPendingNavigation({
      nodeId: node.id,
      href: node.href,
      label: node.label,
    });
  }

  function handleCameraSettled(nodeId: string) {
    if (
      !pendingNavigation ||
      pendingNavigation.nodeId !== nodeId ||
      navigationStartedRef.current === pendingNavigation.href
    ) {
      return;
    }

    navigationStartedRef.current = pendingNavigation.href;
    router.push(pendingNavigation.href, {
      scroll: pendingNavigation.href.includes("#"),
    });
  }

  return (
    <div
      aria-hidden={sceneMode === "panel" || sceneMode === "hidden"}
      className="spatial-layer"
      data-active={sceneVisible}
      data-focused-node={focusedNodeId ?? undefined}
      data-mode={sceneMode}
      data-spatial-scene="orbital-filesystem"
    >
      <SpatialCanvas
        active={sceneMode === "explore" || sceneMode === "transition"}
        focusedNodeId={focusedNodeId}
        interactive={sceneInteractive}
        onMetrics={setMetrics}
        onCameraSettled={handleCameraSettled}
        onNodeActivate={handleNodeActivate}
        onNodeIntent={handleNodeIntent}
        reducedMotion={reducedMotion}
        targetNodeCount={targetNodeCount}
      />

      {pendingNavigation ? (
        <div className="scene-transition-status" role="status" aria-live="polite">
          <span>TRAVERSAL_LOCK</span>
          <strong>{pendingNavigation.label.toUpperCase()}</strong>
          <small>{pendingNavigation.href}</small>
        </div>
      ) : null}

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
