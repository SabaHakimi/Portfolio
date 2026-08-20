"use client";

import { Html, PresentationControls, useCursor } from "@react-three/drei";
import {
  Canvas,
  type RootState,
  type ThreeEvent,
  useFrame,
  useThree,
} from "@react-three/fiber";
import gsap from "gsap";
import {
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

type SpatialCanvasProps = {
  readonly active: boolean;
  readonly interactive: boolean;
  readonly focusedNodeId: string | null;
  readonly reducedMotion: boolean;
  readonly targetNodeCount: number;
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
const scratchMatrix = new THREE.Matrix4();
const scratchColor = new THREE.Color();

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

function createBackdropPositions(count = 220) {
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

function RenderDriver({ active }: { active: boolean }) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!active) return;

    let frame = 0;
    const render = () => {
      invalidate();
      frame = window.requestAnimationFrame(render);
    };
    frame = window.requestAnimationFrame(render);

    return () => window.cancelAnimationFrame(frame);
  }, [active, invalidate]);

  return null;
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

    const destination = new THREE.Vector3(0, 0, 12.2);
    const target = new THREE.Vector3(0, 0, 0);

    if (focusedNodeId && marker) {
      marker.updateWorldMatrix(true, false);
      marker.getWorldPosition(target);
      const approach = camera.position.clone().sub(target);
      if (approach.lengthSq() < 0.001) approach.set(0, 0, 1);
      approach.normalize();
      destination.copy(target).addScaledVector(approach, 5.15);
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

    const duration = focusedNodeId ? 0.92 : 0.68;
    transitioning.current = true;
    const timeline = gsap.timeline({
      defaults: { duration, ease: "power3.inOut" },
      onUpdate: invalidate,
      onComplete: () => {
        transitioning.current = false;
        invalidate();
        if (focusedNodeId) settledCallback.current(focusedNodeId);
      },
    });

    timeline
      .to(
        camera.position,
        { x: destination.x, y: destination.y, z: destination.z },
        0,
      )
      .to(lookAt.current, { x: target.x, y: target.y, z: target.z }, 0);

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
  graph,
  onMetrics,
}: {
  graph: SpatialGraph;
  onMetrics: SpatialCanvasProps["onMetrics"];
}) {
  const frameCount = useRef(0);
  const sampleStart = useRef(0);
  const callbackRef = useRef(onMetrics);

  useEffect(() => {
    callbackRef.current = onMetrics;
  }, [onMetrics]);

  useFrame((state) => {
    const now = performance.now();
    if (sampleStart.current === 0) {
      sampleStart.current = now;
      return;
    }

    frameCount.current += 1;
    const elapsed = now - sampleStart.current;

    if (elapsed < 750) return;

    callbackRef.current({
      nodeCount: graph.nodes.length,
      drawCalls: state.gl.info.render.calls,
      triangles: state.gl.info.render.triangles,
      fps: Math.round((frameCount.current * 1000) / elapsed),
    });
    frameCount.current = 0;
    sampleStart.current = now;
  });

  return null;
}

function RootNucleus({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!group.current || reducedMotion) return;
    group.current.rotation.x += delta * 0.08;
    group.current.rotation.y -= delta * 0.12;
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[0.46, 1]} />
        <meshBasicMaterial color="#e8ff42" transparent opacity={0.22} />
      </mesh>
      <mesh scale={1.18}>
        <icosahedronGeometry args={[0.46, 1]} />
        <meshBasicMaterial color="#e8ff42" wireframe transparent opacity={0.95} />
      </mesh>
      <pointLight color="#e8ff42" intensity={5} distance={5} />
      <Html center position={[0, -0.72, 0]}>
        <span className="scene-node-label scene-node-label--root">ROOT_NODE</span>
      </Html>
    </group>
  );
}

function NodeInstances({
  nodes,
  hoveredId,
  focusedId,
  interactive,
  onHover,
  onActivate,
  onIntent,
  size,
}: {
  nodes: readonly SpatialNode[];
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
      scratchColor.set(isActive ? accentColors[node.accent] : idleNodeColor);
      mesh.current.setColorAt(index, scratchColor);
    }

    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [focusedId, hoveredId, nodes]);

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
  reducedMotion,
}: {
  focusMarkerRef: RefObject<THREE.Object3D | null>;
  focusedNodeId: string | null;
  graph: SpatialGraph;
  interactive: boolean;
  onNodeActivate: SpatialCanvasProps["onNodeActivate"];
  onNodeIntent: SpatialCanvasProps["onNodeIntent"];
  reducedMotion: boolean;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const ringGeometry = useMemo(() => makeRingGeometry(graph), [graph]);
  const edgeGeometry = useMemo(() => makeEdgeGeometry(graph), [graph]);
  const backdropPositions = useMemo(() => createBackdropPositions(), []);
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

  useCursor(Boolean(hoveredNode?.href) && interactive);

  useEffect(() => () => ringGeometry.dispose(), [ringGeometry]);
  useEffect(() => () => edgeGeometry.dispose(), [edgeGeometry]);
  useEffect(() => () => highlightGeometry.dispose(), [highlightGeometry]);

  return (
    <group
      rotation={[0.18, -0.32, -0.04]}
      onPointerMissed={() => {
        if (interactive) setHoveredId(null);
      }}
    >
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[backdropPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#65808d" size={0.018} transparent opacity={0.42} />
      </points>

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
      <RootNucleus reducedMotion={reducedMotion} />
      <NodeInstances
        nodes={sectionNodes}
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
  reducedMotion,
}: {
  active: boolean;
  focusedNodeId: string | null;
  graph: SpatialGraph;
  interactive: boolean;
  onCameraSettled: SpatialCanvasProps["onCameraSettled"];
  onMetrics: SpatialCanvasProps["onMetrics"];
  onNodeActivate: SpatialCanvasProps["onNodeActivate"];
  onNodeIntent: SpatialCanvasProps["onNodeIntent"];
  reducedMotion: boolean;
}) {
  const focusMarkerRef = useRef<THREE.Object3D>(null);

  return (
    <>
      <RenderDriver active={active} />
      <CameraRig
        focusMarkerRef={focusMarkerRef}
        focusedNodeId={focusedNodeId}
        interactive={interactive}
        onCameraSettled={onCameraSettled}
        reducedMotion={reducedMotion}
      />
      <MetricsSampler graph={graph} onMetrics={onMetrics} />
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
          reducedMotion={reducedMotion}
        />
      </PresentationControls>
    </>
  );
}

export function SpatialCanvas({
  active,
  focusedNodeId,
  interactive,
  onCameraSettled,
  targetNodeCount,
  onMetrics,
  onNodeActivate,
  onNodeIntent,
  reducedMotion,
}: SpatialCanvasProps) {
  const graph = useMemo(
    () => createSpatialGraph(targetNodeCount),
    [targetNodeCount],
  );

  return (
    <Canvas
      camera={{ position: [0, 0, 12.2], fov: 42, near: 0.1, far: 80 }}
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
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
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}
