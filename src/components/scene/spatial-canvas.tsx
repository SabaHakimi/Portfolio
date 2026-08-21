"use client";

import { Grid, Html, PresentationControls, useCursor } from "@react-three/drei";
import {
  Canvas,
  type RootState,
  type ThreeEvent,
  useFrame,
  useThree,
} from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import gsap from "gsap";
import {
  memo,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import type { SceneMetrics } from "@/components/scene/spatial-experience";
import {
  createSpatialGraph,
  ORBIT_RADIUS,
  type SpatialEdge,
  type SpatialGraph,
  type SpatialNode,
  type Vector3Tuple,
} from "@/lib/spatial-graph";
import type { SectionAccent } from "@/lib/portfolio-map";
import {
  includesEnvironment,
  shouldUseBloom,
  visualQualityProfiles,
  type VisualEffectsMode,
  type VisualQualityProfile,
  type VisualQualityTier,
} from "@/lib/visual-quality";

type SpatialCanvasProps = {
  readonly active: boolean;
  readonly interactive: boolean;
  readonly focusedNodeId: string | null;
  readonly reducedMotion: boolean;
  readonly targetNodeCount: number;
  readonly qualityTier: VisualQualityTier;
  readonly vfxMode: VisualEffectsMode;
  readonly onMetrics: (metrics: SceneMetrics) => void;
  readonly onNodeActivate: (node: SpatialNode) => void;
  readonly onNodeIntent: (node: SpatialNode) => void;
  readonly onCameraSettled: (nodeId: string) => void;
};

const accentColors: Record<SectionAccent | "root", string> = {
  cyan: "#40e6ff",
  yellow: "#e8ff42",
  magenta: "#ff4fd8",
  green: "#61f5a1",
  blue: "#739dff",
  orange: "#ff9f43",
  root: "#edf5f6",
};

const idleNodeColor = new THREE.Color("#516b78");
const idleEdgeColor = new THREE.Color("#263a44");
const rootGlowColor = new THREE.Color("#e8ff42").multiplyScalar(1.7);
const scratchMatrix = new THREE.Matrix4();
const scratchColor = new THREE.Color();
const cameraOrbitAxis = new THREE.Vector3(0, 1, 0);
const CAMERA_FOCUS_DISTANCE = 5.15;
const CAMERA_ORBIT_SWEEP = THREE.MathUtils.degToRad(26);

function vectorToArray(vector: THREE.Vector3): Vector3Tuple {
  return [vector.x, vector.y, vector.z];
}

function makeRingGeometry(graph: SpatialGraph) {
  const positions: number[] = [];
  const colors: number[] = [];
  const segments = 120;

  for (const ring of graph.rings) {
    const color = new THREE.Color(accentColors[ring.accent]);
    for (let index = 0; index < segments; index += 1) {
      const startAngle = (index / segments) * Math.PI * 2;
      const endAngle = ((index + 1) / segments) * Math.PI * 2;
      const start = new THREE.Vector3(
        Math.cos(startAngle) * ORBIT_RADIUS,
        Math.sin(startAngle) * ORBIT_RADIUS,
        0,
      );
      const end = new THREE.Vector3(
        Math.cos(endAngle) * ORBIT_RADIUS,
        Math.sin(endAngle) * ORBIT_RADIUS,
        0,
      );

      if (ring.id === "work") {
        start.set(start.x, 0, start.y);
        end.set(end.x, 0, end.y);
      } else if (ring.id === "knowledge") {
        start.set(0, start.x, start.y);
        end.set(0, end.x, end.y);
      }

      positions.push(...vectorToArray(start), ...vectorToArray(end));
      colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

function makeEdgeGeometry(
  graph: SpatialGraph,
  edges: readonly SpatialEdge[] = graph.edges,
) {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const positions: number[] = [];
  const colors: number[] = [];

  for (const edge of edges) {
    const source = nodeById.get(edge.sourceId);
    const target = nodeById.get(edge.targetId);
    if (!source || !target) continue;

    const color = new THREE.Color(accentColors[edge.accent]);
    positions.push(...source.position, ...target.position);
    colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

function createBackdropPositions(count: number) {
  const positions = new Float32Array(count * 3);
  let seed = 21981;

  const next = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };

  for (let index = 0; index < count; index += 1) {
    const radius = 6.2 + next() * 5.8;
    const azimuth = next() * Math.PI * 2;
    const elevation = Math.acos(2 * next() - 1);
    positions[index * 3] = radius * Math.sin(elevation) * Math.cos(azimuth);
    positions[index * 3 + 1] = radius * Math.cos(elevation);
    positions[index * 3 + 2] = radius * Math.sin(elevation) * Math.sin(azimuth);
  }

  return positions;
}

function CameraRig({
  focusMarkerRef,
  focusedNodeId,
  interactive,
  onCameraSettled,
  reducedMotion,
}: {
  focusMarkerRef: RefObject<THREE.Object3D | null>;
  focusedNodeId: string | null;
  interactive: boolean;
  onCameraSettled: SpatialCanvasProps["onCameraSettled"];
  reducedMotion: boolean;
}) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const lookAt = useRef(new THREE.Vector3(0, 0, 0));
  const transitioning = useRef(false);
  const settledCallback = useRef(onCameraSettled);

  useLayoutEffect(() => {
    settledCallback.current = onCameraSettled;
  }, [onCameraSettled]);

  useLayoutEffect(() => {
    const marker = focusMarkerRef.current;
    if (focusedNodeId && !marker) return;

    const startPosition = camera.position.clone();
    const startTarget = lookAt.current.clone();
    const destination = new THREE.Vector3(0, 0, 12.2);
    const target = new THREE.Vector3(0, 0, 0);

    if (focusedNodeId && marker) {
      marker.updateWorldMatrix(true, false);
      marker.getWorldPosition(target);
      const approach = startPosition.clone().sub(target);
      if (approach.lengthSq() < 0.001) approach.set(0, 0, 1);
      const sweepDirection = target.x >= startTarget.x ? 1 : -1;
      approach
        .normalize()
        .applyAxisAngle(cameraOrbitAxis, CAMERA_ORBIT_SWEEP * sweepDirection);
      destination
        .copy(target)
        .addScaledVector(approach, CAMERA_FOCUS_DISTANCE);
      destination.y += 0.18;
    }

    if (reducedMotion) {
      camera.position.copy(destination);
      lookAt.current.copy(target);
      camera.lookAt(target);
      transitioning.current = false;
      invalidate();

      let cancelled = false;
      if (focusedNodeId) {
        queueMicrotask(() => {
          if (!cancelled) settledCallback.current(focusedNodeId);
        });
      }

      return () => {
        cancelled = true;
      };
    }

    const startOffset = startPosition.clone().sub(startTarget);
    if (startOffset.lengthSq() < 0.001) startOffset.set(0, 0, 1);
    const destinationOffset = destination.clone().sub(target);
    const startRadius = startOffset.length();
    const destinationRadius = destinationOffset.length();
    const startDirection = startOffset.normalize();
    const destinationDirection = destinationOffset.normalize();
    const orbitRotation = new THREE.Quaternion().setFromUnitVectors(
      startDirection,
      destinationDirection,
    );
    const currentRotation = new THREE.Quaternion();
    const currentDirection = new THREE.Vector3();
    const currentTarget = new THREE.Vector3();
    const animationState = { progress: 0 };
    const duration = focusedNodeId ? 0.92 : 0.72;
    transitioning.current = true;
    const timeline = gsap.timeline({
      defaults: { duration, ease: "power3.inOut" },
      onUpdate: () => {
        const progress = animationState.progress;
        currentTarget.lerpVectors(startTarget, target, progress);
        currentRotation.identity().slerp(orbitRotation, progress);
        currentDirection
          .copy(startDirection)
          .applyQuaternion(currentRotation)
          .multiplyScalar(
            THREE.MathUtils.lerp(startRadius, destinationRadius, progress),
          );
        camera.position.copy(currentTarget).add(currentDirection);
        lookAt.current.copy(currentTarget);
        camera.lookAt(currentTarget);
        invalidate();
      },
      onComplete: () => {
        transitioning.current = false;
        invalidate();
        if (focusedNodeId) settledCallback.current(focusedNodeId);
      },
    });

    timeline.to(animationState, { progress: 1 }, 0);

    return () => {
      timeline.kill();
      transitioning.current = false;
    };
  }, [camera, focusMarkerRef, focusedNodeId, invalidate, reducedMotion]);

  useFrame((state, delta) => {
    if (
      interactive &&
      !reducedMotion &&
      !focusedNodeId &&
      !transitioning.current
    ) {
      state.camera.position.x = THREE.MathUtils.damp(
        state.camera.position.x,
        state.pointer.x * 0.42,
        4.5,
        delta,
      );
      state.camera.position.y = THREE.MathUtils.damp(
        state.camera.position.y,
        state.pointer.y * 0.28,
        4.5,
        delta,
      );
    }
    state.camera.lookAt(lookAt.current);
  });

  return null;
}

function MetricsSampler({
  active,
  graph,
  onMetrics,
  qualityTier,
}: {
  active: boolean;
  graph: SpatialGraph;
  onMetrics: SpatialCanvasProps["onMetrics"];
  qualityTier: VisualQualityTier;
}) {
  const frameCount = useRef(0);
  const maxFrameMs = useRef(0);
  const slowFrameCount = useRef(0);
  const sampleStart = useRef(0);
  const lastFrame = useRef(0);
  const warmupUntil = useRef(0);
  const callbackRef = useRef(onMetrics);

  useEffect(() => {
    callbackRef.current = onMetrics;
  }, [onMetrics]);

  useEffect(() => {
    frameCount.current = 0;
    maxFrameMs.current = 0;
    slowFrameCount.current = 0;
    sampleStart.current = 0;
    lastFrame.current = 0;
    warmupUntil.current = performance.now() + 2_500;
  }, [active, graph, qualityTier]);

  useFrame((state) => {
    const now = performance.now();
    if (
      !active ||
      document.visibilityState !== "visible" ||
      now < warmupUntil.current
    ) {
      frameCount.current = 0;
      maxFrameMs.current = 0;
      slowFrameCount.current = 0;
      sampleStart.current = 0;
      lastFrame.current = now;
      return;
    }

    const frameMs = lastFrame.current > 0 ? now - lastFrame.current : 0;
    if (frameMs > 250) {
      frameCount.current = 0;
      maxFrameMs.current = 0;
      slowFrameCount.current = 0;
      sampleStart.current = now;
      lastFrame.current = now;
      return;
    }
    lastFrame.current = now;

    if (sampleStart.current === 0) {
      sampleStart.current = now;
      return;
    }

    frameCount.current += 1;
    maxFrameMs.current = Math.max(maxFrameMs.current, frameMs);
    if (frameMs > 25) slowFrameCount.current += 1;
    const elapsed = now - sampleStart.current;

    if (elapsed < 1_000) return;

    callbackRef.current({
      nodeCount: graph.nodes.length,
      drawCalls: state.gl.info.render.calls,
      triangles: state.gl.info.render.triangles,
      fps: Math.round((frameCount.current * 1000) / elapsed),
      dpr: Number(state.gl.getPixelRatio().toFixed(2)),
      maxFrameMs: Math.round(maxFrameMs.current),
      slowFramePercent: Math.round(
        (slowFrameCount.current / frameCount.current) * 100,
      ),
      antialias:
        state.gl.getContext().getContextAttributes()?.antialias ?? null,
    });
    frameCount.current = 0;
    maxFrameMs.current = 0;
    slowFrameCount.current = 0;
    sampleStart.current = now;
  });

  return null;
}

function AtmosphericParticles({
  count,
  reducedMotion,
}: {
  count: number;
  reducedMotion: boolean;
}) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => createBackdropPositions(count), [count]);

  useFrame((state, delta) => {
    if (!points.current || reducedMotion) return;
    points.current.rotation.y += delta * 0.012;
    points.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.08) * 0.035;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        blending={THREE.AdditiveBlending}
        color="#6b9eab"
        depthWrite={false}
        opacity={0.34}
        size={0.022}
        sizeAttenuation
        transparent
      />
    </points>
  );
}

type DataPulse = {
  readonly accent: SectionAccent;
  readonly phase: number;
  readonly source: THREE.Vector3;
  readonly speed: number;
  readonly target: THREE.Vector3;
};

function DataPulses({
  count,
  graph,
  reducedMotion,
}: {
  count: number;
  graph: SpatialGraph;
  reducedMotion: boolean;
}) {
  const geometry = useRef<THREE.BufferGeometry>(null);
  const pulseData = useMemo<readonly DataPulse[]>(() => {
    const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
    return Array.from({ length: count }, (_, index) => {
      const edge = graph.edges[(index * 7 + 3) % graph.edges.length];
      const source = nodeById.get(edge.sourceId);
      const target = nodeById.get(edge.targetId);
      return {
        accent: edge.accent,
        phase: ((index * 0.381966) % 1 + 1) % 1,
        source: new THREE.Vector3(...(source?.position ?? [0, 0, 0])),
        speed: 0.11 + (index % 5) * 0.018,
        target: new THREE.Vector3(...(target?.position ?? [0, 0, 0])),
      };
    });
  }, [count, graph.edges, graph.nodes]);
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const colors = useMemo(() => {
    const buffer = new Float32Array(count * 3);
    pulseData.forEach((pulse, index) => {
      const color = new THREE.Color(accentColors[pulse.accent]).multiplyScalar(2.4);
      color.toArray(buffer, index * 3);
    });
    return buffer;
  }, [count, pulseData]);

  useFrame((state) => {
    const elapsed = reducedMotion ? 0 : state.clock.elapsedTime;
    pulseData.forEach((pulse, index) => {
      const progress = (pulse.phase + elapsed * pulse.speed) % 1;
      positions[index * 3] = THREE.MathUtils.lerp(
        pulse.source.x,
        pulse.target.x,
        progress,
      );
      positions[index * 3 + 1] = THREE.MathUtils.lerp(
        pulse.source.y,
        pulse.target.y,
        progress,
      );
      positions[index * 3 + 2] = THREE.MathUtils.lerp(
        pulse.source.z,
        pulse.target.z,
        progress,
      );
    });

    const positionAttribute = geometry.current?.getAttribute("position");
    if (positionAttribute) positionAttribute.needsUpdate = true;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geometry}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        blending={THREE.AdditiveBlending}
        depthTest={false}
        depthWrite={false}
        opacity={0.9}
        size={0.045}
        sizeAttenuation
        toneMapped={false}
        transparent
        vertexColors
      />
    </points>
  );
}

function EnvironmentGrid({ qualityTier }: { qualityTier: VisualQualityTier }) {
  return (
    <Grid
      args={[22, 22]}
      cellColor="#173640"
      cellSize={qualityTier === "economy" ? 0.72 : 0.48}
      cellThickness={0.55}
      fadeDistance={18}
      fadeStrength={1.8}
      infiniteGrid
      position={[0, -4.15, 0]}
      sectionColor="#347080"
      sectionSize={2.88}
      sectionThickness={0.85}
    />
  );
}

function BloomPipeline({ profile }: { profile: VisualQualityProfile }) {
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <Bloom
        intensity={profile.bloomIntensity}
        luminanceSmoothing={0.18}
        luminanceThreshold={1.02}
        mipmapBlur
        radius={0.24}
        resolutionScale={profile.bloomResolutionScale}
      />
    </EffectComposer>
  );
}

function RootNucleus({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current || reducedMotion) return;
    group.current.rotation.x += delta * 0.08;
    group.current.rotation.y -= delta * 0.12;
    group.current.scale.setScalar(
      1 + Math.sin(state.clock.elapsedTime * 1.7) * 0.025,
    );
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[0.46, 1]} />
        <meshBasicMaterial
          color={rootGlowColor}
          toneMapped={false}
          transparent
          opacity={0.12}
        />
      </mesh>
      <mesh scale={1.18}>
        <icosahedronGeometry args={[0.46, 1]} />
        <meshBasicMaterial
          color={rootGlowColor}
          toneMapped={false}
          wireframe
          transparent
          opacity={0.95}
        />
      </mesh>
      <Html center position={[0, -0.72, 0]}>
        <span className="scene-node-label scene-node-label--root">ROOT_NODE</span>
      </Html>
    </group>
  );
}

function NodeInstances({
  nodes,
  emissive,
  hoveredId,
  focusedId,
  interactive,
  onHover,
  onActivate,
  onIntent,
  size,
}: {
  nodes: readonly SpatialNode[];
  emissive: boolean;
  hoveredId: string | null;
  focusedId: string | null;
  interactive: boolean;
  onHover: (id: string | null) => void;
  onActivate: (node: SpatialNode) => void;
  onIntent: (node: SpatialNode) => void;
  size: number;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!mesh.current) return;

    for (const [index, node] of nodes.entries()) {
      scratchMatrix.makeTranslation(...node.position);
      mesh.current.setMatrixAt(index, scratchMatrix);
      const isActive = hoveredId === node.id || focusedId === node.id;
      scratchColor.set(
        isActive || (emissive && node.kind === "section")
          ? accentColors[node.accent]
          : idleNodeColor,
      );
      if (emissive) {
        scratchColor.multiplyScalar(
          isActive ? 1.9 : node.kind === "section" ? 1.18 : 0.92,
        );
      }
      mesh.current.setColorAt(index, scratchColor);
    }

    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [emissive, focusedId, hoveredId, nodes]);

  const identifyNode = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const node = event.instanceId === undefined ? undefined : nodes[event.instanceId];
    onHover(node?.id ?? null);
    if (node?.href) onIntent(node);
  };

  const activateNode = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (!interactive || event.delta > 5 || event.instanceId === undefined) return;
    const node = nodes[event.instanceId];
    if (node?.href) onActivate(node);
  };

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, nodes.length]}
      onPointerMove={identifyNode}
      onPointerOver={identifyNode}
      onPointerOut={() => onHover(null)}
      onClick={activateNode}
    >
      <octahedronGeometry args={[size, 0]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

function GraphLabels({
  graph,
  focusedNodeId,
  hoveredNode,
  interactive,
  onActivate,
  onHover,
  onIntent,
}: {
  graph: SpatialGraph;
  focusedNodeId: string | null;
  hoveredNode: SpatialNode | undefined;
  interactive: boolean;
  onActivate: (node: SpatialNode) => void;
  onHover: (id: string | null) => void;
  onIntent: (node: SpatialNode) => void;
}) {
  const sectionNodes = graph.nodes.filter((node) => node.kind === "section");

  return (
    <>
      {sectionNodes.map((node) => (
        <Html
          key={node.id}
          position={[
            node.position[0],
            node.position[1] + (node.sectionSlug === "experience" ? -0.42 : 0.38),
            node.position[2],
          ]}
          center
        >
          <button
            aria-label={`Open ${node.label} node`}
            className="scene-node-label scene-node-label--section"
            data-accent={node.accent}
            data-focused={focusedNodeId === node.id || undefined}
            data-node-id={node.id}
            disabled={!interactive}
            onBlur={() => onHover(null)}
            onClick={(event) => {
              event.stopPropagation();
              onActivate(node);
            }}
            onFocus={() => {
              onHover(node.id);
              onIntent(node);
            }}
            onPointerEnter={() => {
              onHover(node.id);
              onIntent(node);
            }}
            onPointerLeave={() => onHover(null)}
            type="button"
          >
            {node.label.toUpperCase()}
            <small>OPEN</small>
          </button>
        </Html>
      ))}

      {hoveredNode && hoveredNode.kind !== "section" ? (
        <Html
          position={[
            hoveredNode.position[0],
            hoveredNode.position[1] + 0.3,
            hoveredNode.position[2],
          ]}
          center
        >
          <span
            className="scene-node-label scene-node-label--hover"
            data-accent={hoveredNode.accent}
            data-hovered-node={hoveredNode.id}
          >
            {hoveredNode.label.toUpperCase()}
            {hoveredNode.href ? <small>CLICK TO OPEN</small> : null}
          </span>
        </Html>
      ) : null}
    </>
  );
}

function OrbitalGraph({
  focusMarkerRef,
  focusedNodeId,
  graph,
  interactive,
  onNodeActivate,
  onNodeIntent,
  profile,
  qualityTier,
  reducedMotion,
  vfxMode,
}: {
  focusMarkerRef: RefObject<THREE.Object3D | null>;
  focusedNodeId: string | null;
  graph: SpatialGraph;
  interactive: boolean;
  onNodeActivate: SpatialCanvasProps["onNodeActivate"];
  onNodeIntent: SpatialCanvasProps["onNodeIntent"];
  profile: VisualQualityProfile;
  qualityTier: VisualQualityTier;
  reducedMotion: boolean;
  vfxMode: VisualEffectsMode;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const ringGeometry = useMemo(() => makeRingGeometry(graph), [graph]);
  const edgeGeometry = useMemo(() => makeEdgeGeometry(graph), [graph]);
  const sectionNodes = useMemo(
    () => graph.nodes.filter((node) => node.kind === "section"),
    [graph],
  );
  const childNodes = useMemo(
    () => graph.nodes.filter((node) => node.kind !== "root" && node.kind !== "section"),
    [graph],
  );
  const hoveredNode = graph.nodes.find((node) => node.id === hoveredId);
  const focusedNode = graph.nodes.find((node) => node.id === focusedNodeId);
  const activeNode = hoveredNode ?? focusedNode;
  const activeBranch = useMemo(() => {
    if (!activeNode) return [];
    const sectionId = `section:${activeNode.sectionSlug}`;
    return graph.edges.filter(
      (edge) =>
        edge.targetId === activeNode.id ||
        (edge.sourceId === "root" && edge.targetId === sectionId),
    );
  }, [activeNode, graph.edges]);
  const highlightGeometry = useMemo(
    () => makeEdgeGeometry(graph, activeBranch),
    [activeBranch, graph],
  );
  const environmentEnabled = includesEnvironment(vfxMode);
  const bloomEnabled = shouldUseBloom(vfxMode, qualityTier);

  useCursor(Boolean(hoveredNode?.href) && interactive);

  useEffect(() => () => ringGeometry.dispose(), [ringGeometry]);
  useEffect(() => () => edgeGeometry.dispose(), [edgeGeometry]);
  useEffect(() => () => highlightGeometry.dispose(), [highlightGeometry]);

  return (
    <>
      {environmentEnabled ? <EnvironmentGrid qualityTier={qualityTier} /> : null}
      <group
        rotation={[0.18, -0.32, -0.04]}
        onPointerMissed={() => {
          if (interactive) setHoveredId(null);
        }}
      >
      {environmentEnabled ? (
        <>
          <AtmosphericParticles
            count={profile.particleCount}
            reducedMotion={reducedMotion}
          />
          <DataPulses
            count={profile.pulseCount}
            graph={graph}
            reducedMotion={reducedMotion}
          />
        </>
      ) : null}

      <lineSegments geometry={ringGeometry}>
        <lineBasicMaterial vertexColors transparent opacity={0.2} />
      </lineSegments>
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color={idleEdgeColor} transparent opacity={0.52} />
      </lineSegments>
      {activeBranch.length > 0 ? (
        <lineSegments geometry={highlightGeometry}>
          <lineBasicMaterial vertexColors transparent opacity={0.95} />
        </lineSegments>
      ) : null}

      <object3D
        ref={focusMarkerRef}
        position={focusedNode?.position ?? [0, 0, 0]}
        visible={false}
      />
      <RootNucleus reducedMotion={reducedMotion || vfxMode === "off"} />
      <NodeInstances
        nodes={sectionNodes}
        emissive={bloomEnabled}
        hoveredId={hoveredId}
        focusedId={focusedNodeId}
        interactive={interactive}
        onHover={setHoveredId}
        onActivate={onNodeActivate}
        onIntent={onNodeIntent}
        size={0.19}
      />
      <NodeInstances
        nodes={childNodes}
        emissive={bloomEnabled}
        hoveredId={hoveredId}
        focusedId={focusedNodeId}
        interactive={interactive}
        onHover={setHoveredId}
        onActivate={onNodeActivate}
        onIntent={onNodeIntent}
        size={0.085}
      />
      <GraphLabels
        graph={graph}
        focusedNodeId={focusedNodeId}
        hoveredNode={hoveredNode}
        interactive={interactive}
        onActivate={onNodeActivate}
        onHover={setHoveredId}
        onIntent={onNodeIntent}
      />
      </group>
    </>
  );
}

function Scene({
  active,
  focusedNodeId,
  graph,
  interactive,
  onCameraSettled,
  onMetrics,
  onNodeActivate,
  onNodeIntent,
  profile,
  qualityTier,
  reducedMotion,
  vfxMode,
}: {
  active: boolean;
  focusedNodeId: string | null;
  graph: SpatialGraph;
  interactive: boolean;
  onCameraSettled: SpatialCanvasProps["onCameraSettled"];
  onMetrics: SpatialCanvasProps["onMetrics"];
  onNodeActivate: SpatialCanvasProps["onNodeActivate"];
  onNodeIntent: SpatialCanvasProps["onNodeIntent"];
  profile: VisualQualityProfile;
  qualityTier: VisualQualityTier;
  reducedMotion: boolean;
  vfxMode: VisualEffectsMode;
}) {
  const focusMarkerRef = useRef<THREE.Object3D>(null);

  return (
    <>
      <CameraRig
        focusMarkerRef={focusMarkerRef}
        focusedNodeId={focusedNodeId}
        interactive={interactive}
        onCameraSettled={onCameraSettled}
        reducedMotion={reducedMotion}
      />
      <MetricsSampler
        active={active}
        graph={graph}
        onMetrics={onMetrics}
        qualityTier={qualityTier}
      />
      <PresentationControls
        global
        cursor={false}
        enabled={interactive}
        speed={0.72}
        polar={[-0.46, 0.46]}
        azimuth={[-0.72, 0.72]}
      >
        <OrbitalGraph
          focusMarkerRef={focusMarkerRef}
          focusedNodeId={focusedNodeId}
          graph={graph}
          interactive={interactive}
          onNodeActivate={onNodeActivate}
          onNodeIntent={onNodeIntent}
          profile={profile}
          qualityTier={qualityTier}
          reducedMotion={reducedMotion}
          vfxMode={vfxMode}
        />
      </PresentationControls>
      {shouldUseBloom(vfxMode, qualityTier) ? (
        <BloomPipeline profile={profile} />
      ) : null}
    </>
  );
}

export const SpatialCanvas = memo(function SpatialCanvas({
  active,
  focusedNodeId,
  interactive,
  onCameraSettled,
  targetNodeCount,
  onMetrics,
  onNodeActivate,
  onNodeIntent,
  qualityTier,
  reducedMotion,
  vfxMode,
}: SpatialCanvasProps) {
  const graph = useMemo(
    () => createSpatialGraph(targetNodeCount),
    [targetNodeCount],
  );
  const profile = visualQualityProfiles[qualityTier];

  return (
    <Canvas
      camera={{ position: [0, 0, 12.2], fov: 42, near: 0.1, far: 80 }}
      dpr={[...profile.dpr]}
      frameloop={active && !reducedMotion ? "always" : "demand"}
      gl={{
        alpha: true,
        antialias: qualityTier !== "economy",
        powerPreference: "high-performance",
        stencil: false,
      }}
      onCreated={(state: RootState) => {
        state.gl.setClearColor("#05070a", 0);
      }}
    >
      <Scene
        active={active}
        focusedNodeId={focusedNodeId}
        graph={graph}
        interactive={interactive}
        onCameraSettled={onCameraSettled}
        onMetrics={onMetrics}
        onNodeActivate={onNodeActivate}
        onNodeIntent={onNodeIntent}
        profile={profile}
        qualityTier={qualityTier}
        reducedMotion={reducedMotion}
        vfxMode={vfxMode}
      />
    </Canvas>
  );
});
