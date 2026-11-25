import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ThemeMode } from '../../config/profile.config';

export interface AutonomousRoadSceneProps {
  theme: ThemeMode;
  obstacleSeed: number;
  sensorView: boolean;
  isActive: boolean;
  prefersReducedMotion: boolean;
  position?: [number, number, number];
  scale?: number;
}

interface ObstacleSpec {
  id: number;
  baseX: number;
  baseZ: number;
  width: number;
  height: number;
  depth: number;
  speedZ: number;
  isInjected: boolean;
}

const ROAD_WIDTH = 3.6;
const ROAD_LENGTH = 8.8;
const SPLINE_SEGMENTS = 56;
const PATH_HALF_WIDTH = 0.065;

const INJECTED_PRESETS: ReadonlyArray<{ x: number; z: number; w: number; h: number; d: number }> = [
  { x: 0.08, z: 0.25, w: 0.56, h: 0.42, d: 0.72 },
  { x: -0.34, z: -0.55, w: 0.48, h: 0.36, d: 0.58 },
  { x: 0.42, z: -1.15, w: 0.52, h: 0.46, d: 0.66 },
];

export function AutonomousRoadScene({
  theme,
  obstacleSeed,
  sensorView,
  isActive,
  prefersReducedMotion,
  position = [0, 0, 0],
  scale = 1,
}: AutonomousRoadSceneProps) {
  const rootRef = useRef<THREE.Group>(null);
  const egoGroupRef = useRef<THREE.Group>(null);
  const obstacleGroupRefs = useRef<Array<THREE.Group | null>>([]);
  const roadMarkRefs = useRef<Array<THREE.Mesh | null>>([]);
  const lidarRingRefs = useRef<Array<THREE.Mesh | null>>([]);
  const sensorGroupRef = useRef<THREE.Group>(null);

  const elapsedRef = useRef(0);
  const egoXRef = useRef(0);
  const sensorAlphaRef = useRef(sensorView ? 1 : 0);

  // Materials refs for smooth dark/light theme interpolation
  const roadMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const shoulderMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const egoBodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const egoAccentMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const pathMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const obstacleFillMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const obstacleWireMatRef = useRef<THREE.LineBasicMaterial>(null);

  // Active obstacles: 2 ambient mixed-traffic hazards + up to 3 injected obstacles
  const obstacles = useMemo<ObstacleSpec[]>(() => {
    const base: ObstacleSpec[] = [
      {
        id: 0,
        baseX: -0.82,
        baseZ: -0.95,
        width: 0.46,
        height: 0.36,
        depth: 0.68,
        speedZ: 0.55,
        isInjected: false,
      },
      {
        id: 1,
        baseX: 0.88,
        baseZ: -2.2,
        width: 0.42,
        height: 0.32,
        depth: 0.54,
        speedZ: 0.38,
        isInjected: false,
      },
    ];

    const injectedCount = obstacleSeed === 0 ? 0 : ((obstacleSeed - 1) % 3) + 1;
    const shift = obstacleSeed > 3 ? ((obstacleSeed - 1) * 0.17) % 0.5 - 0.25 : 0;

    for (let i = 0; i < injectedCount; i++) {
      const preset = INJECTED_PRESETS[i];
      const x = THREE.MathUtils.clamp(
        preset.x + (i === 0 ? shift : -shift * 0.6),
        -1.15,
        1.15,
      );
      base.push({
        id: 10 + i,
        baseX: x,
        baseZ: preset.z,
        width: preset.w,
        height: preset.h,
        depth: preset.d,
        speedZ: 0,
        isInjected: true,
      });
    }
    return base;
  }, [obstacleSeed]);

  // Pre-allocated spline ribbon geometry (zero per-frame allocations)
  const pathGeometry = useMemo(() => {
    const vertexCount = (SPLINE_SEGMENTS + 1) * 2;
    const positions = new Float32Array(vertexCount * 3);
    const indices: number[] = [];
    for (let i = 0; i < SPLINE_SEGMENTS; i++) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, b, c, b, d, c);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(indices);
    return geo;
  }, []);

  // Pre-allocated wireframe edges for obstacle boxes
  const unitBoxEdges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
    [],
  );

  useEffect(() => {
    return () => {
      pathGeometry.dispose();
      unitBoxEdges.dispose();
    };
  }, [pathGeometry, unitBoxEdges]);

  // Scratch math objects for useFrame
  const scratchRef = useRef({
    controlPoints: Array.from({ length: 7 }, () => new THREE.Vector3()),
    curve: new THREE.CatmullRomCurve3(
      Array.from({ length: 7 }, () => new THREE.Vector3()),
      false,
      'catmullrom',
      0.5,
    ),
    pt: new THREE.Vector3(),
    tan: new THREE.Vector3(),
    left: new THREE.Vector3(),
    targetOffsets: new Float32Array(7),
    dampedOffsets: new Float32Array(7),
    colorA: new THREE.Color(),
    colorB: new THREE.Color(),
  });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (isActive && !prefersReducedMotion) {
      elapsedRef.current += dt;
    }
    const t = elapsedRef.current;

    // Theme-synced monochrome palette
    const isDark = theme === 'dark';
    const c = scratchRef.current;

    if (roadMatRef.current) {
      c.colorA.set(isDark ? '#111216' : '#E2E4E9');
      roadMatRef.current.color.lerp(c.colorA, 1 - Math.exp(-dt * 8));
    }
    if (shoulderMatRef.current) {
      c.colorA.set(isDark ? '#3F4450' : '#9CA3AF');
      shoulderMatRef.current.color.lerp(c.colorA, 1 - Math.exp(-dt * 8));
    }
    if (egoBodyMatRef.current) {
      c.colorA.set(isDark ? '#E5E7EB' : '#18181B');
      egoBodyMatRef.current.color.lerp(c.colorA, 1 - Math.exp(-dt * 8));
    }
    if (egoAccentMatRef.current) {
      c.colorA.set(isDark ? '#B8C7D9' : '#475B70');
      egoAccentMatRef.current.color.lerp(c.colorA, 1 - Math.exp(-dt * 8));
    }
    if (pathMatRef.current) {
      c.colorA.set(isDark ? '#DCE6F2' : '#2E4054');
      pathMatRef.current.color.lerp(c.colorA, 1 - Math.exp(-dt * 8));
    }
    if (obstacleFillMatRef.current) {
      c.colorA.set(isDark ? '#272930' : '#CBD5E1');
      obstacleFillMatRef.current.color.lerp(c.colorA, 1 - Math.exp(-dt * 8));
    }
    if (obstacleWireMatRef.current) {
      c.colorA.set(isDark ? '#B8C7D9' : '#334155');
      obstacleWireMatRef.current.color.lerp(c.colorA, 1 - Math.exp(-dt * 8));
    }

    // Scroll road shoulder markers to convey forward motion
    const markerCount = roadMarkRefs.current.length;
    for (let i = 0; i < markerCount; i++) {
      const m = roadMarkRefs.current[i];
      if (!m) continue;
      const side = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 2);
      const spacing = ROAD_LENGTH / 6;
      const zTravel = prefersReducedMotion ? 0 : (t * 1.9) % spacing;
      const z = -ROAD_LENGTH / 2 + row * spacing + zTravel;
      const wrappedZ = z > ROAD_LENGTH / 2 ? z - ROAD_LENGTH : z;
      // Unstructured irregular road edge jitter
      const edgeJitter = Math.sin(row * 1.9 + side * 2.1) * 0.14;
      m.position.set(side * (ROAD_WIDTH * 0.46 + edgeJitter), 0.015, wrappedZ);
    }

    // Update obstacle positions (ambient moving + injected static/shifted)
    const activePositions: Array<{ x: number; z: number; w: number; d: number }> = [];
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      const grp = obstacleGroupRefs.current[i];
      let z = obs.baseZ;
      if (!obs.isInjected && !prefersReducedMotion) {
        const span = 6.8;
        z = ((obs.baseZ + t * obs.speedZ + 3.8) % span) - 3.8;
      }
      const x = obs.baseX;
      if (grp) {
        grp.position.x = THREE.MathUtils.damp(grp.position.x, x, 9, dt);
        grp.position.z = obs.isInjected
          ? THREE.MathUtils.damp(grp.position.z, z, 9, dt)
          : z;
        grp.position.y = obs.height * 0.5 + 0.02;
      }
      activePositions.push({ x, z, w: obs.width, d: obs.depth });
    }

    // Compute adaptive collision-avoidance spline waypoints from z = +2.15 (ego) to z = -3.35
    const zSteps = [2.15, 1.25, 0.35, -0.55, -1.45, -2.4, -3.35];
    for (let k = 0; k < zSteps.length; k++) {
      const zk = zSteps[k];
      let desiredX = 0;
      if (k > 0) {
        // Repulsion field from nearby obstacles
        for (const obs of activePositions) {
          const dz = zk - obs.z;
          const longitudinalRange = obs.d * 0.85 + 0.95;
          if (Math.abs(dz) < longitudinalRange) {
            const weight = Math.cos((dz / longitudinalRange) * (Math.PI * 0.5));
            const lateralClearance = obs.w * 0.5 + 0.62;
            const dx = desiredX - obs.x;
            if (Math.abs(dx) < lateralClearance) {
              const pushDir = obs.x >= 0 ? -1 : 1;
              desiredX += pushDir * (lateralClearance - Math.abs(dx)) * weight * 1.15;
            }
          }
        }
        desiredX = THREE.MathUtils.clamp(desiredX, -1.18, 1.18);
      }
      c.targetOffsets[k] = desiredX;
      c.dampedOffsets[k] = THREE.MathUtils.damp(
        c.dampedOffsets[k],
        c.targetOffsets[k],
        prefersReducedMotion ? 60 : 7.5,
        dt,
      );
      c.controlPoints[k].set(c.dampedOffsets[k], 0.055, zk);
      c.curve.points[k].copy(c.controlPoints[k]);
    }

    // Ego vehicle subtly tracks the immediate forward tangent
    const targetEgoX = c.dampedOffsets[1] * 0.38;
    egoXRef.current = THREE.MathUtils.damp(egoXRef.current, targetEgoX, 6, dt);
    if (egoGroupRef.current) {
      egoGroupRef.current.position.x = egoXRef.current;
      egoGroupRef.current.rotation.y = (egoXRef.current - c.dampedOffsets[2]) * 0.22;
      egoGroupRef.current.rotation.z = -(egoXRef.current - targetEgoX) * 0.18;
    }
    // Anchor start of spline cleanly to ego front
    c.curve.points[0].set(egoXRef.current, 0.055, 2.15);

    // Update spline ribbon vertices in-place
    const posAttr = pathGeometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i <= SPLINE_SEGMENTS; i++) {
      const u = i / SPLINE_SEGMENTS;
      c.curve.getPointAt(u, c.pt);
      c.curve.getTangentAt(u, c.tan);
      c.left.set(-c.tan.z, 0, c.tan.x).normalize().multiplyScalar(PATH_HALF_WIDTH);
      const baseIdx = i * 6;
      arr[baseIdx] = c.pt.x - c.left.x;
      arr[baseIdx + 1] = c.pt.y;
      arr[baseIdx + 2] = c.pt.z - c.left.z;
      arr[baseIdx + 3] = c.pt.x + c.left.x;
      arr[baseIdx + 4] = c.pt.y;
      arr[baseIdx + 5] = c.pt.z + c.left.z;
    }
    posAttr.needsUpdate = true;

    // LiDAR sensor rings pulse
    sensorAlphaRef.current = THREE.MathUtils.damp(
      sensorAlphaRef.current,
      sensorView ? 1 : 0,
      8,
      dt,
    );
    if (sensorGroupRef.current) {
      sensorGroupRef.current.visible = sensorAlphaRef.current > 0.02;
    }
    for (let i = 0; i < lidarRingRefs.current.length; i++) {
      const ring = lidarRingRefs.current[i];
      if (!ring) continue;
      const phase = prefersReducedMotion ? i * 0.33 : ((t * 0.55 + i * 0.33) % 1);
      const rScale = 0.4 + phase * 2.1;
      ring.scale.set(rScale, rScale, 1);
      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - phase) * 0.42 * sensorAlphaRef.current;
      mat.color.set(isDark ? '#B8C7D9' : '#475B70');
    }
  });

  return (
    <group
      ref={rootRef}
      position={position}
      scale={scale}
      rotation={[0.26, -0.34, 0]}
    >
      {/* Unstructured Road Ribbon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.5]}>
        <planeGeometry args={[ROAD_WIDTH, ROAD_LENGTH]} />
        <meshStandardMaterial
          ref={roadMatRef}
          color={theme === 'dark' ? '#111216' : '#E2E4E9'}
          roughness={0.85}
          metalness={0.12}
          transparent
          opacity={0.86}
        />
      </mesh>

      {/* Subtle unstructured road shoulder markers */}
      {Array.from({ length: 12 }).map((_, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            roadMarkRefs.current[idx] = el;
          }}
          position={[0, 0.015, 0]}
        >
          <boxGeometry args={[0.05, 0.015, 0.36]} />
          <meshBasicMaterial
            ref={idx === 0 ? shoulderMatRef : undefined}
            color={theme === 'dark' ? '#3F4450' : '#9CA3AF'}
            transparent
            opacity={0.55}
          />
        </mesh>
      ))}

      {/* Adaptive Spline Trajectory Ribbon */}
      <mesh geometry={pathGeometry} frustumCulled={false}>
        <meshBasicMaterial
          ref={pathMatRef}
          color={theme === 'dark' ? '#DCE6F2' : '#2E4054'}
          side={THREE.DoubleSide}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Ego Vehicle + LiDAR Sensor Rings */}
      <group ref={egoGroupRef} position={[0, 0.16, 2.45]}>
        {/* Main chassis */}
        <mesh>
          <boxGeometry args={[0.56, 0.2, 1.05]} />
          <meshStandardMaterial
            ref={egoBodyMatRef}
            color={theme === 'dark' ? '#E5E7EB' : '#18181B'}
            roughness={0.28}
            metalness={0.65}
          />
        </mesh>
        {/* Cabin canopy */}
        <mesh position={[0, 0.14, 0.05]}>
          <boxGeometry args={[0.42, 0.12, 0.54]} />
          <meshStandardMaterial
            color={theme === 'dark' ? '#1E222A' : '#3F3F46'}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        {/* Roof LiDAR puck */}
        <mesh position={[0, 0.23, 0.02]}>
          <cylinderGeometry args={[0.075, 0.085, 0.06, 16]} />
          <meshBasicMaterial
            ref={egoAccentMatRef}
            color={theme === 'dark' ? '#B8C7D9' : '#475B70'}
          />
        </mesh>
        {/* Forward light bar */}
        <mesh position={[0, 0.02, -0.53]}>
          <boxGeometry args={[0.46, 0.035, 0.02]} />
          <meshBasicMaterial color={theme === 'dark' ? '#F5F5F7' : '#475B70'} />
        </mesh>

        {/* LiDAR Perception Arcs */}
        <group ref={sensorGroupRef} position={[0, -0.1, -0.15]}>
          {[0, 1, 2].map((ringIdx) => (
            <mesh
              key={ringIdx}
              ref={(el) => {
                lidarRingRefs.current[ringIdx] = el;
              }}
              rotation={[-Math.PI / 2, 0, Math.PI * 0.18]}
            >
              <ringGeometry args={[0.88, 0.92, 40, 1, 0, Math.PI * 0.64]} />
              <meshBasicMaterial
                color={theme === 'dark' ? '#B8C7D9' : '#475B70'}
                transparent
                opacity={0.35}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      </group>

      {/* Dynamic & Injected Obstacle Bounding Volumes */}
      {obstacles.map((obs, idx) => (
        <group
          key={obs.id}
          ref={(el) => {
            obstacleGroupRefs.current[idx] = el;
          }}
          position={[obs.baseX, obs.height * 0.5 + 0.02, obs.baseZ]}
          scale={[obs.width, obs.height, obs.depth]}
        >
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              ref={idx === 0 ? obstacleFillMatRef : undefined}
              color={theme === 'dark' ? '#272930' : '#CBD5E1'}
              roughness={0.45}
              metalness={0.35}
              transparent
              opacity={obs.isInjected ? 0.92 : 0.72}
            />
          </mesh>
          <lineSegments geometry={unitBoxEdges}>
            <lineBasicMaterial
              ref={idx === 0 ? obstacleWireMatRef : undefined}
              color={theme === 'dark' ? '#B8C7D9' : '#334155'}
              transparent
              opacity={obs.isInjected ? 0.9 : 0.55}
            />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}
