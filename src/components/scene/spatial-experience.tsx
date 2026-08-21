"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
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
import {
  lowerVisualQuality,
  parseVisualEffectsMode,
  parseVisualQualityTier,
  raiseVisualQuality,
  recommendVisualQuality,
  shouldShowPerformanceDiagnostics,
  shouldUseBloom,
  type VisualEffectsMode,
  type VisualQualityTier,
} from "@/lib/visual-quality";

export type SceneMetrics = {
  readonly nodeCount: number;
  readonly drawCalls: number;
  readonly triangles: number;
  readonly fps: number;
  readonly dpr: number;
  readonly maxFrameMs: number;
  readonly slowFramePercent: number;
  readonly antialias: boolean | null;
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
  dpr: 0,
  maxFrameMs: 0,
  slowFramePercent: 0,
  antialias: null,
};

type PendingNavigation = {
  readonly nodeId: string;
  readonly href: string;
  readonly label: string;
};

type NavigatorWithDeviceMemory = Navigator & {
  readonly deviceMemory?: number;
};

const debugQualityOptions = [null, "high", "balanced", "economy"] as const;
const debugVfxOptions = ["full", "bloom", "environment", "off"] as const;

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

function subscribeToDeviceQuality() {
  return () => undefined;
}

function getDeviceQualitySnapshot() {
  const navigatorWithMemory = navigator as NavigatorWithDeviceMemory;
  return recommendVisualQuality({
    deviceMemory: navigatorWithMemory.deviceMemory,
    devicePixelRatio: window.devicePixelRatio,
    hardwareConcurrency: navigator.hardwareConcurrency || 4,
  });
}

function getServerDeviceQualitySnapshot(): VisualQualityTier {
  return "balanced";
}

function subscribeToPageVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function getPageVisibilitySnapshot() {
  return document.visibilityState === "visible";
}

function getServerPageVisibilitySnapshot() {
  return true;
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
  const hardwareQuality = useSyncExternalStore(
    subscribeToDeviceQuality,
    getDeviceQualitySnapshot,
    getServerDeviceQualitySnapshot,
  );
  const pageVisible = useSyncExternalStore(
    subscribeToPageVisibility,
    getPageVisibilitySnapshot,
    getServerPageVisibilitySnapshot,
  );
  const routeSection = getPortfolioSection(pathname.slice(1));
  const diagnosticsEnabled = shouldShowPerformanceDiagnostics(
    searchParams.get("debugPerformance"),
    process.env.NODE_ENV === "development",
  );
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
      if (!diagnosticsEnabled) {
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
    [diagnosticsEnabled, searchParams],
  );
  const [metrics, setMetrics] = useState(initialMetrics);
  const [adaptedQuality, setAdaptedQuality] =
    useState<VisualQualityTier | null>(null);
  const autoQuality = adaptedQuality ?? hardwareQuality;
  const lowFpsSamples = useRef(0);
  const highFpsSamples = useRef(0);
  const debugQuality = useMemo(
    () =>
      diagnosticsEnabled
        ? parseVisualQualityTier(searchParams.get("debugQuality"))
        : null,
    [diagnosticsEnabled, searchParams],
  );
  const vfxMode = useMemo<VisualEffectsMode>(
    () =>
      diagnosticsEnabled
        ? (parseVisualEffectsMode(searchParams.get("debugVfx")) ?? "full")
        : "full",
    [diagnosticsEnabled, searchParams],
  );
  const qualityTier = debugQuality ?? autoQuality;
  const sceneRenderingActive =
    pageVisible && (sceneMode === "explore" || sceneMode === "transition");

  const handleMetrics = useCallback(
    (nextMetrics: SceneMetrics) => {
      if (diagnosticsEnabled) {
        setMetrics(nextMetrics);
      }

      if (
        debugQuality ||
        reducedMotion ||
        sceneMode !== "explore" ||
        nextMetrics.fps <= 0
      ) {
        lowFpsSamples.current = 0;
        highFpsSamples.current = 0;
        return;
      }

      const downgradeThreshold = autoQuality === "high" ? 50 : 40;
      if (
        autoQuality !== "economy" &&
        nextMetrics.fps < downgradeThreshold
      ) {
        lowFpsSamples.current += 1;
        highFpsSamples.current = 0;
      } else if (autoQuality !== "high" && nextMetrics.fps >= 58) {
        highFpsSamples.current += 1;
        lowFpsSamples.current = 0;
      } else {
        lowFpsSamples.current = 0;
        highFpsSamples.current = 0;
      }

      if (lowFpsSamples.current >= 3) {
        setAdaptedQuality((current) =>
          lowerVisualQuality(current ?? hardwareQuality),
        );
        lowFpsSamples.current = 0;
        highFpsSamples.current = 0;
      } else if (highFpsSamples.current >= 8) {
        setAdaptedQuality((current) =>
          raiseVisualQuality(current ?? hardwareQuality),
        );
        lowFpsSamples.current = 0;
        highFpsSamples.current = 0;
      }
    }, [
      autoQuality,
      debugQuality,
      diagnosticsEnabled,
      hardwareQuality,
      reducedMotion,
      sceneMode,
    ],
  );

  useEffect(() => {
    lowFpsSamples.current = 0;
    highFpsSamples.current = 0;
  }, [pageVisible, sceneMode]);

  const setDebugParameter = useCallback(
    (
      name: "debugPerformance" | "debugQuality" | "debugVfx",
      value: string | null,
    ) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());
      if (value) nextSearchParams.set(name, value);
      else nextSearchParams.delete(name);
      const query = nextSearchParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  function cycleDebugQuality() {
    const currentIndex = debugQualityOptions.indexOf(debugQuality);
    const next = debugQualityOptions[(currentIndex + 1) % debugQualityOptions.length];
    setDebugParameter("debugQuality", next);
  }

  function cycleDebugVfx() {
    const currentIndex = debugVfxOptions.indexOf(vfxMode);
    const next = debugVfxOptions[(currentIndex + 1) % debugVfxOptions.length];
    setDebugParameter("debugVfx", next);
  }

  function hideDiagnostics() {
    setDebugParameter(
      "debugPerformance",
      process.env.NODE_ENV === "development" ? "0" : null,
    );
  }

  useEffect(() => {
    if (pathname === "/" || !pendingNavigation) return;

    const clearPendingNavigation = window.setTimeout(() => {
      setPendingNavigation(null);
      navigationStartedRef.current = null;
    }, 0);

    return () => window.clearTimeout(clearPendingNavigation);
  }, [pathname, pendingNavigation]);

  useEffect(() => {
    if (!pendingNavigation) return;

    const fallbackNavigation = window.setTimeout(
      () => {
        if (navigationStartedRef.current === pendingNavigation.href) return;

        navigationStartedRef.current = pendingNavigation.href;
        router.push(pendingNavigation.href, {
          scroll: pendingNavigation.href.includes("#"),
        });
      },
      reducedMotion ? 0 : 1_600,
    );

    return () => window.clearTimeout(fallbackNavigation);
  }, [pendingNavigation, reducedMotion, router]);

  const handleNodeIntent = useCallback(
    (node: SpatialNode) => {
      if (!node.href || node.href === "/") return;
      router.prefetch(node.href.split("#")[0]);
    },
    [router],
  );

  const handleNodeActivate = useCallback(
    (node: SpatialNode) => {
      if (
        pathname !== "/" ||
        pendingNavigation ||
        !node.href ||
        node.href === "/"
      ) {
        return;
      }

      router.prefetch(node.href.split("#")[0]);
      navigationStartedRef.current = null;
      setPendingNavigation({
        nodeId: node.id,
        href: node.href,
        label: node.label,
      });
    },
    [pathname, pendingNavigation, router, setPendingNavigation],
  );

  const handleCameraSettled = useCallback(
    (nodeId: string) => {
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
    },
    [pendingNavigation, router],
  );

  return (
    <>
      <div
        aria-hidden={sceneMode === "panel" || sceneMode === "hidden"}
        className="spatial-layer"
        data-active={sceneVisible}
        data-bloom={shouldUseBloom(vfxMode, qualityTier)}
        data-debug-performance={diagnosticsEnabled}
        data-focused-node={focusedNodeId ?? undefined}
        data-mode={sceneMode}
        data-quality={qualityTier}
        data-render-loop={sceneRenderingActive ? "continuous" : "demand"}
        data-spatial-scene="orbital-filesystem"
        data-vfx={vfxMode}
      >
        <SpatialCanvas
          active={sceneRenderingActive}
          focusedNodeId={focusedNodeId}
          interactive={sceneInteractive}
          onMetrics={handleMetrics}
          onCameraSettled={handleCameraSettled}
          onNodeActivate={handleNodeActivate}
          onNodeIntent={handleNodeIntent}
          reducedMotion={reducedMotion}
          targetNodeCount={targetNodeCount}
          qualityTier={qualityTier}
          vfxMode={vfxMode}
        />

        {pendingNavigation ? (
          <>
            <div aria-hidden="true" className="scene-transition-wipe" />
            <div
              className="scene-transition-status"
              role="status"
              aria-live="polite"
            >
              <span>TRAVERSAL_LOCK</span>
              <strong>{pendingNavigation.label.toUpperCase()}</strong>
              <small>{pendingNavigation.href}</small>
            </div>
          </>
        ) : null}
      </div>

      {diagnosticsEnabled && sceneMode === "explore" ? (
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
          <span>
            <strong>{qualityTier.toUpperCase()}</strong> QUALITY
          </span>
          <span>
            <strong>{metrics.dpr || "--"}</strong> DPR
          </span>
          <span>
            <strong>{metrics.maxFrameMs || "--"}</strong> MAX_MS
          </span>
          <span>
            <strong>{metrics.slowFramePercent}%</strong> &gt;25MS
          </span>
          <span>
            <strong>
              {metrics.antialias === null
                ? "--"
                : metrics.antialias
                  ? "ON"
                  : "OFF"}
            </strong>{" "}
            MSAA
          </span>
        </output>
      ) : null}

      {diagnosticsEnabled && sceneMode === "explore" ? (
        <div className="scene-debug-controls" aria-label="Visual effects controls">
          <span>VFX_DIAGNOSTICS</span>
          <button onClick={cycleDebugQuality} type="button">
            QUALITY <strong>{debugQuality?.toUpperCase() ?? `AUTO:${qualityTier.toUpperCase()}`}</strong>
          </button>
          <button onClick={cycleDebugVfx} type="button">
            EFFECTS <strong>{vfxMode.toUpperCase()}</strong>
          </button>
          <button
            aria-label="Hide performance diagnostics"
            className="scene-debug-controls__close"
            onClick={hideDiagnostics}
            type="button"
          >
            CLOSE
          </button>
        </div>
      ) : null}
    </>
  );
}
