import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ThemeMode } from '../../config/profile.config';
import type {
  ChessBoardAngle,
  SpatialWorldInteractionRef,
} from '../../context/useSpatialWorld';
import { AutonomousRoadScene } from './AutonomousRoadScene';
import { ChessScene } from './ChessScene';
import {
  LatentVolume,
  type SharedSceneRef,
  SynapseVolume,
  TensorVolume,
} from './NeuralVolumeCanvas';
import { DARK_TARGETS, LIGHT_TARGETS } from './themeTargets';
import type { NeuralVolumeMode, PulseSignal } from './types';

export interface SpatialWorldCanvasProps {
  theme: ThemeMode;
  neuralMode: NeuralVolumeMode;
  pulseSignal: PulseSignal;
  obstacleSeed: number;
  sensorView: boolean;
  chessStep: number;
  chessAngle: ChessBoardAngle;
  isActive: boolean;
  prefersReducedMotion: boolean;
  interactionRef: React.RefObject<SpatialWorldInteractionRef>;
  onContextLost?: () => void;
}

interface ChapterKeyframes {
  camPos: [number, number, number];
  lookAt: [number, number, number];
}

const CHAPTER_KEYFRAMES: ReadonlyArray<ChapterKeyframes> = [
  // 0: Hero (#top)
  { camPos: [0, 0, 5.4], lookAt: [0, 0, 0] },
  // 1: SIH 2026 Flagship (#sih)
  { camPos: [0.15, -7.25, 6.2], lookAt: [0.3, -8.65, 0] },
  // 2: Selected Work (#work)
  { camPos: [-0.2, -16.4, 6.4], lookAt: [0, -17.0, 0] },
  // 3: AI/ML Lab (#lab)
  { camPos: [0.2, -24.5, 6.2], lookAt: [0, -25.0, 0] },
  // 4: Foundations (#foundations)
  { camPos: [0, -32.2, 6.5], lookAt: [0, -33.2, -0.4] },
  // 5: Chess Hobby (#chess)
  { camPos: [0.25, -40.2, 6.1], lookAt: [0.35, -41.6, 0] },
  // 6: Contact & LinkedIn Identity Hub (#contact)
  { camPos: [0, -49.1, 6.3], lookAt: [0, -50.0, -0.4] },
];

const CHAPTER_SECTION_IDS = [
  'top',
  'sih',
  'work',
  'lab',
  'foundations',
  'chess',
  'contact',
] as const;

function AmbientDepthParticles({
  theme,
  prefersReducedMotion,
  isActive,
}: {
  theme: ThemeMode;
  prefersReducedMotion: boolean;
  isActive: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 160;
    const arr = new Float32Array(count * 3);
    let seed = 4242;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * 14;
      arr[i * 3 + 1] = 4 - rand() * 58;
      arr[i * 3 + 2] = -1.5 - rand() * 7;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current || prefersReducedMotion || !isActive) return;
    pointsRef.current.rotation.y += Math.min(delta, 0.05) * 0.015;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color={theme === 'dark' ? '#B8C7D9' : '#475B70'}
        transparent
        opacity={theme === 'dark' ? 0.32 : 0.25}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function WorkMonoliths({
  theme,
  prefersReducedMotion,
  isActive,
  interactionRef,
}: {
  theme: ThemeMode;
  prefersReducedMotion: boolean;
  isActive: boolean;
  interactionRef: React.RefObject<SpatialWorldInteractionRef>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const monolithRefs = useRef<Array<THREE.Group | null>>([]);
  const wireEdges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
    [],
  );

  useEffect(() => () => wireEdges.dispose(), [wireEdges]);

  const specs = useMemo(
    () => [
      { pos: [-2.6, 0.3, -1.4] as [number, number, number], size: [0.9, 2.8, 0.35] as [number, number, number], rot: 0.25 },
      { pos: [-0.85, -0.4, -2.1] as [number, number, number], size: [0.75, 2.2, 0.3] as [number, number, number], rot: -0.18 },
      { pos: [1.35, 0.2, -1.6] as [number, number, number], size: [1.05, 3.1, 0.4] as [number, number, number], rot: -0.32 },
      { pos: [2.75, -0.5, -2.3] as [number, number, number], size: [0.7, 2.0, 0.3] as [number, number, number], rot: 0.15 },
    ],
    [],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const hoveredIdx = interactionRef.current?.hoveredWorkIndex ?? -1;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < specs.length; i++) {
      const m = monolithRefs.current[i];
      if (!m) continue;
      const isHovered = hoveredIdx === i || (hoveredIdx >= 0 && i === hoveredIdx % specs.length);
      const baseRot = specs[i].rot;
      const targetRotY = prefersReducedMotion
        ? baseRot
        : baseRot + Math.sin(t * 0.25 + i) * 0.08 + (isHovered ? 0.35 : 0);
      const targetY = specs[i].pos[1] + (isHovered && !prefersReducedMotion ? 0.22 : 0);

      m.rotation.y = THREE.MathUtils.damp(m.rotation.y, targetRotY, 5, dt);
      if (isActive && !prefersReducedMotion) {
        m.position.y = THREE.MathUtils.damp(m.position.y, targetY, 5, dt);
      }
    }
  });

  const isDark = theme === 'dark';

  return (
    <group ref={groupRef} position={[0, -17.0, 0]}>
      {specs.map((spec, idx) => (
        <group
          key={idx}
          ref={(el) => {
            monolithRefs.current[idx] = el;
          }}
          position={spec.pos}
          scale={spec.size}
          rotation={[0.08, spec.rot, 0]}
        >
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshPhysicalMaterial
              color={isDark ? '#181A20' : '#E5E7EB'}
              roughness={0.22}
              metalness={0.35}
              transparent
              opacity={isDark ? 0.42 : 0.38}
            />
          </mesh>
          <lineSegments geometry={wireEdges}>
            <lineBasicMaterial
              color={isDark ? '#B8C7D9' : '#475B70'}
              transparent
              opacity={isDark ? 0.34 : 0.28}
            />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}

function LabOrbitalRings({
  theme,
  prefersReducedMotion,
  isActive,
  interactionRef,
}: {
  theme: ThemeMode;
  prefersReducedMotion: boolean;
  isActive: boolean;
  interactionRef: React.RefObject<SpatialWorldInteractionRef>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRefs = useRef<Array<THREE.Mesh | null>>([]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!isActive || prefersReducedMotion) return;
    const hoveredIdx = interactionRef.current?.hoveredLabIndex ?? -1;
    const speedBoost = hoveredIdx >= 0 ? 1.85 : 1;

    for (let i = 0; i < ringRefs.current.length; i++) {
      const r = ringRefs.current[i];
      if (!r) continue;
      r.rotation.z += dt * (0.14 + i * 0.06) * speedBoost * (i % 2 === 0 ? 1 : -1);
      r.rotation.x += dt * 0.04 * speedBoost;
    }
  });

  const isDark = theme === 'dark';
  const radii = [1.45, 1.95, 2.45];

  return (
    <group ref={groupRef} position={[1.15, -25.0, -1.2]} rotation={[0.42, -0.28, 0]}>
      {radii.map((radius, idx) => (
        <mesh
          key={radius}
          ref={(el) => {
            ringRefs.current[idx] = el;
          }}
          rotation={[idx * 0.55, idx * 0.4, 0]}
        >
          <torusGeometry args={[radius, 0.012, 12, 96]} />
          <meshBasicMaterial
            color={isDark ? '#B8C7D9' : '#475B70'}
            transparent
            opacity={isDark ? 0.36 - idx * 0.06 : 0.3 - idx * 0.05}
          />
        </mesh>
      ))}
    </group>
  );
}

function FoundationsLattice({
  theme,
  prefersReducedMotion,
}: {
  theme: ThemeMode;
  prefersReducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const isDark = theme === 'dark';

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!groupRef.current || prefersReducedMotion) return;
    const targetRotY = state.pointer.x * 0.08;
    const targetRotX = -state.pointer.y * 0.05;
    groupRef.current.rotation.y = THREE.MathUtils.damp(
      groupRef.current.rotation.y,
      targetRotY,
      4,
      dt,
    );
    groupRef.current.rotation.x = THREE.MathUtils.damp(
      groupRef.current.rotation.x,
      targetRotX,
      4,
      dt,
    );
  });

  return (
    <group ref={groupRef} position={[0, -33.2, -0.8]}>
      {/* Calm horizon grid */}
      <gridHelper
        args={[16, 24, isDark ? '#3A4250' : '#94A3B8', isDark ? '#1A1D24' : '#CBD5E1']}
        position={[0, -1.1, -1.2]}
      />
      {/* Sculptural wireframe icosahedron */}
      <mesh position={[0, 0.25, -1.4]}>
        <icosahedronGeometry args={[1.45, 1]} />
        <meshBasicMaterial
          color={isDark ? '#B8C7D9' : '#475B70'}
          wireframe
          transparent
          opacity={isDark ? 0.22 : 0.18}
        />
      </mesh>
    </group>
  );
}

function ContactConstellation({
  theme,
  prefersReducedMotion,
  isActive,
  interactionRef,
}: {
  theme: ThemeMode;
  prefersReducedMotion: boolean;
  isActive: boolean;
  interactionRef: React.RefObject<SpatialWorldInteractionRef>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lineMatRef = useRef<THREE.LineBasicMaterial>(null);

  const { nodes, lineGeo } = useMemo(() => {
    const pts: Array<[number, number, number]> = [
      [0, 0.35, -0.6],
      [-1.75, 0.85, -1.1],
      [1.8, 0.9, -1.0],
      [-1.35, -0.55, -1.3],
      [1.55, -0.45, -1.2],
      [0.45, 1.35, -1.5],
      [-0.5, -1.05, -0.9],
    ];
    const pairs = [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 5],
      [0, 6],
      [1, 5],
      [2, 5],
      [3, 6],
      [4, 6],
    ];
    const linePos = new Float32Array(pairs.length * 6);
    for (let i = 0; i < pairs.length; i++) {
      const a = pts[pairs[i][0]];
      const b = pts[pairs[i][1]];
      linePos[i * 6] = a[0];
      linePos[i * 6 + 1] = a[1];
      linePos[i * 6 + 2] = a[2];
      linePos[i * 6 + 3] = b[0];
      linePos[i * 6 + 4] = b[1];
      linePos[i * 6 + 5] = b[2];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    return { nodes: pts, lineGeo: geo };
  }, []);

  useEffect(() => () => lineGeo.dispose(), [lineGeo]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const hovered = interactionRef.current?.hoveredContactHub ?? false;
    if (groupRef.current) {
      const targetScale = hovered && !prefersReducedMotion ? 1.06 : 1;
      const nextScale = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 5, dt);
      groupRef.current.scale.setScalar(nextScale);
      if (isActive && !prefersReducedMotion) {
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.22) * 0.12;
      }
    }
    if (lineMatRef.current) {
      const targetOpacity = hovered ? 0.52 : theme === 'dark' ? 0.26 : 0.22;
      lineMatRef.current.opacity = THREE.MathUtils.damp(
        lineMatRef.current.opacity,
        targetOpacity,
        6,
        dt,
      );
    }
  });

  const isDark = theme === 'dark';

  return (
    <group ref={groupRef} position={[0, -50.0, -0.5]}>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial
          ref={lineMatRef}
          color={isDark ? '#B8C7D9' : '#475B70'}
          transparent
          opacity={isDark ? 0.26 : 0.22}
        />
      </lineSegments>
      {nodes.map((pt, idx) => (
        <mesh key={idx} position={pt}>
          <sphereGeometry args={[idx === 0 ? 0.095 : 0.055, 16, 12]} />
          <meshBasicMaterial
            color={isDark ? '#E5E7EB' : '#1E293B'}
            transparent
            opacity={idx === 0 ? 0.88 : 0.62}
          />
        </mesh>
      ))}
    </group>
  );
}

function SpatialWorldScene({
  theme,
  neuralMode,
  pulseSignal,
  obstacleSeed,
  sensorView,
  chessStep,
  chessAngle,
  isActive,
  prefersReducedMotion,
  interactionRef,
}: Omit<SpatialWorldCanvasProps, 'onContextLost'>) {
  const { camera, scene, size, invalidate } = useThree();
  const isDesktop = size.width >= 1024;

  const heroGroupRef = useRef<THREE.Group>(null);
  const lastPulseIdRef = useRef(0);
  const scrollChapterRef = useRef(0);
  const smoothedChapterRef = useRef(0);

  const fogColorRef = useRef(
    new THREE.Color(theme === 'dark' ? '#060608' : '#F5F5F7'),
  );

  const sharedRef = useRef<SharedSceneRef>({
    elapsed: 0,
    pointerLocal: new THREE.Vector3(),
    pointerInside: false,
    pulseOrigin: new THREE.Vector3(0, 0, 0),
    pulseRadius: 0,
    pulseStrength: 0,
    palette: {
      nodePrimary: DARK_TARGETS.nodePrimary.clone(),
      nodeSecondary: DARK_TARGETS.nodeSecondary.clone(),
      edgeBase: DARK_TARGETS.edgeBase.clone(),
      pulseAccent: DARK_TARGETS.pulseAccent.clone(),
      pulseCore: DARK_TARGETS.pulseCore.clone(),
      tensorCore: DARK_TARGETS.tensorCore.clone(),
      tensorWire: DARK_TARGETS.tensorWire.clone(),
      edgeRestAlpha: DARK_TARGETS.edgeRestAlpha,
      latentAlpha: DARK_TARGETS.latentAlpha,
    },
    weights: {
      synapse: neuralMode === 'synapse' ? 1 : 0,
      latent: neuralMode === 'latent' ? 1 : 0,
      tensor: neuralMode === 'tensor' ? 1 : 0,
    },
  });

  // Track section offsets without React re-renders
  const sectionAnchorsRef = useRef<number[]>([0, 800, 1600, 2400, 3200, 4000, 4800]);

  useEffect(() => {
    const measureSections = () => {
      const anchors = CHAPTER_SECTION_IDS.map((id, idx) => {
        if (id === 'top') return 0;
        const el = document.getElementById(id);
        if (!el) return idx * window.innerHeight;
        const rect = el.getBoundingClientRect();
        return Math.max(0, rect.top + window.scrollY - window.innerHeight * 0.25);
      });
      sectionAnchorsRef.current = anchors;
    };

    const updateScrollChapter = () => {
      const y = window.scrollY;
      const anchors = sectionAnchorsRef.current;
      if (y <= anchors[0]) {
        scrollChapterRef.current = 0;
      } else if (y >= anchors[anchors.length - 1]) {
        scrollChapterRef.current = anchors.length - 1;
      } else {
        for (let i = 0; i < anchors.length - 1; i++) {
          const start = anchors[i];
          const end = anchors[i + 1];
          if (y >= start && y <= end) {
            const span = Math.max(1, end - start);
            scrollChapterRef.current = i + (y - start) / span;
            break;
          }
        }
      }
      if (prefersReducedMotion) {
        invalidate();
      }
    };

    measureSections();
    updateScrollChapter();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            measureSections();
            updateScrollChapter();
          })
        : null;
    if (resizeObserver) {
      resizeObserver.observe(document.body);
    }

    window.addEventListener('scroll', updateScrollChapter, { passive: true });
    window.addEventListener('resize', measureSections, { passive: true });

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', updateScrollChapter);
      window.removeEventListener('resize', measureSections);
    };
  }, [prefersReducedMotion, invalidate]);

  // Global pointer tracking for subtle parallax even over foreground cards
  const windowPointerRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      windowPointerRef.current.x = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      windowPointerRef.current.y = -((e.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  useEffect(() => {
    if (pulseSignal.id > lastPulseIdRef.current) {
      lastPulseIdRef.current = pulseSignal.id;
      const s = sharedRef.current;
      s.pulseOrigin.set(
        pulseSignal.origin[0],
        pulseSignal.origin[1],
        pulseSignal.origin[2],
      );
      s.pulseRadius = 0;
      s.pulseStrength = 1;
      invalidate();
    }
  }, [pulseSignal, invalidate]);

  useEffect(() => {
    if (prefersReducedMotion) {
      const s = sharedRef.current;
      const targetPalette = theme === 'dark' ? DARK_TARGETS : LIGHT_TARGETS;
      s.palette.nodePrimary.copy(targetPalette.nodePrimary);
      s.palette.nodeSecondary.copy(targetPalette.nodeSecondary);
      s.palette.edgeBase.copy(targetPalette.edgeBase);
      s.palette.pulseAccent.copy(targetPalette.pulseAccent);
      s.palette.pulseCore.copy(targetPalette.pulseCore);
      s.palette.tensorCore.copy(targetPalette.tensorCore);
      s.palette.tensorWire.copy(targetPalette.tensorWire);
      s.palette.edgeRestAlpha = targetPalette.edgeRestAlpha;
      s.palette.latentAlpha = targetPalette.latentAlpha;
      s.weights.synapse = neuralMode === 'synapse' ? 1 : 0;
      s.weights.latent = neuralMode === 'latent' ? 1 : 0;
      s.weights.tensor = neuralMode === 'tensor' ? 1 : 0;
    }
    invalidate();
  }, [theme, neuralMode, obstacleSeed, sensorView, prefersReducedMotion, invalidate]);

  const camScratchRef = useRef({
    targetPos: new THREE.Vector3(),
    targetLook: new THREE.Vector3(),
    currentLook: new THREE.Vector3(0, 0, 0),
    targetFog: new THREE.Color(),
  });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = sharedRef.current;

    if (isActive && !prefersReducedMotion) {
      s.elapsed += dt;
    }

    // Smooth theme palette & fog interpolation
    const target = theme === 'dark' ? DARK_TARGETS : LIGHT_TARGETS;
    const colorSpeed = prefersReducedMotion ? 100 : 8;
    s.palette.nodePrimary.lerp(target.nodePrimary, 1 - Math.exp(-dt * colorSpeed));
    s.palette.nodeSecondary.lerp(target.nodeSecondary, 1 - Math.exp(-dt * colorSpeed));
    s.palette.edgeBase.lerp(target.edgeBase, 1 - Math.exp(-dt * colorSpeed));
    s.palette.pulseAccent.lerp(target.pulseAccent, 1 - Math.exp(-dt * colorSpeed));
    s.palette.pulseCore.lerp(target.pulseCore, 1 - Math.exp(-dt * colorSpeed));
    s.palette.tensorCore.lerp(target.tensorCore, 1 - Math.exp(-dt * colorSpeed));
    s.palette.tensorWire.lerp(target.tensorWire, 1 - Math.exp(-dt * colorSpeed));
    s.palette.edgeRestAlpha = THREE.MathUtils.damp(s.palette.edgeRestAlpha, target.edgeRestAlpha, colorSpeed, dt);
    s.palette.latentAlpha = THREE.MathUtils.damp(s.palette.latentAlpha, target.latentAlpha, colorSpeed, dt);

    const cs = camScratchRef.current;
    cs.targetFog.set(theme === 'dark' ? '#060608' : '#F5F5F7');
    fogColorRef.current.lerp(cs.targetFog, 1 - Math.exp(-dt * colorSpeed));
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(fogColorRef.current);
    }

    // Neural mode weights
    const modeSpeed = prefersReducedMotion ? 100 : 10;
    s.weights.synapse = THREE.MathUtils.damp(s.weights.synapse, neuralMode === 'synapse' ? 1 : 0, modeSpeed, dt);
    s.weights.latent = THREE.MathUtils.damp(s.weights.latent, neuralMode === 'latent' ? 1 : 0, modeSpeed, dt);
    s.weights.tensor = THREE.MathUtils.damp(s.weights.tensor, neuralMode === 'tensor' ? 1 : 0, modeSpeed, dt);

    if (s.pulseStrength > 0.001) {
      if (prefersReducedMotion) {
        s.pulseRadius = 0.85;
        s.pulseStrength = THREE.MathUtils.damp(s.pulseStrength, 0, 4, dt);
        if (s.pulseStrength > 0.02) invalidate();
      } else {
        s.pulseRadius += dt * 2.55;
        s.pulseStrength = Math.max(0, 1 - s.pulseRadius / 3.2);
      }
    }

    // Scroll-choreographed camera interpolation (horizon-aligned for vestibular comfort)
    smoothedChapterRef.current = prefersReducedMotion
      ? scrollChapterRef.current
      : THREE.MathUtils.damp(smoothedChapterRef.current, scrollChapterRef.current, 5.5, dt);

    const ch = THREE.MathUtils.clamp(
      smoothedChapterRef.current,
      0,
      CHAPTER_KEYFRAMES.length - 1,
    );
    const idxA = Math.floor(ch);
    const idxB = Math.min(idxA + 1, CHAPTER_KEYFRAMES.length - 1);
    const alpha = ch - idxA;
    // Smoothstep easing between chapters
    const smoothAlpha = alpha * alpha * (3 - 2 * alpha);

    const kfA = CHAPTER_KEYFRAMES[idxA];
    const kfB = CHAPTER_KEYFRAMES[idxB];

    const parallaxX = prefersReducedMotion ? 0 : windowPointerRef.current.x * 0.22;
    const parallaxY = prefersReducedMotion ? 0 : windowPointerRef.current.y * 0.14;

    cs.targetPos.set(
      THREE.MathUtils.lerp(kfA.camPos[0], kfB.camPos[0], smoothAlpha) + parallaxX,
      THREE.MathUtils.lerp(kfA.camPos[1], kfB.camPos[1], smoothAlpha) + parallaxY,
      THREE.MathUtils.lerp(kfA.camPos[2], kfB.camPos[2], smoothAlpha),
    );
    cs.targetLook.set(
      THREE.MathUtils.lerp(kfA.lookAt[0], kfB.lookAt[0], smoothAlpha),
      THREE.MathUtils.lerp(kfA.lookAt[1], kfB.lookAt[1], smoothAlpha),
      THREE.MathUtils.lerp(kfA.lookAt[2], kfB.lookAt[2], smoothAlpha),
    );

    camera.position.copy(cs.targetPos);
    cs.currentLook.copy(cs.targetLook);
    camera.lookAt(cs.currentLook);

    // Subtle Hero Neural Volume cursor tilt
    if (heroGroupRef.current && !prefersReducedMotion) {
      heroGroupRef.current.rotation.x = THREE.MathUtils.damp(
        heroGroupRef.current.rotation.x,
        -windowPointerRef.current.y * 0.12,
        5,
        dt,
      );
      heroGroupRef.current.rotation.y = THREE.MathUtils.damp(
        heroGroupRef.current.rotation.y,
        windowPointerRef.current.x * 0.16,
        5,
        dt,
      );
    }
  });

  return (
    <>
      <fogExp2
        attach="fog"
        args={[theme === 'dark' ? '#060608' : '#F5F5F7', 0.055]}
      />

      <ambientLight intensity={theme === 'dark' ? 0.55 : 0.8} />
      <directionalLight
        position={[4, 5, 5]}
        intensity={theme === 'dark' ? 1.35 : 1.05}
        color="#F8FAFC"
      />
      <directionalLight
        position={[-4, -3, -2]}
        intensity={theme === 'dark' ? 0.7 : 0.45}
        color={theme === 'dark' ? '#B8C7D9' : '#475B70'}
      />

      {/* Global ambient depth particles */}
      <AmbientDepthParticles
        theme={theme}
        prefersReducedMotion={prefersReducedMotion}
        isActive={isActive}
      />

      {/* Chapter 0: Hero Neural Volume */}
      <group
        ref={heroGroupRef}
        position={isDesktop ? [1.55, 0.05, 0] : [0, 0.45, -0.8]}
        scale={isDesktop ? 0.96 : 0.72}
      >
        <SynapseVolume shared={sharedRef} />
        <LatentVolume shared={sharedRef} />
        <TensorVolume shared={sharedRef} />
      </group>

      {/* Chapter 1: SIH 2026 Autonomous Path-Planning & Collision-Avoidance */}
      <AutonomousRoadScene
        theme={theme}
        obstacleSeed={obstacleSeed}
        sensorView={sensorView}
        isActive={isActive}
        prefersReducedMotion={prefersReducedMotion}
        position={isDesktop ? [1.4, -8.65, -0.35] : [0, -8.5, -1.1]}
        scale={isDesktop ? 0.92 : 0.7}
      />

      {/* Chapter 2: Selected Work Architectural Monoliths */}
      <WorkMonoliths
        theme={theme}
        prefersReducedMotion={prefersReducedMotion}
        isActive={isActive}
        interactionRef={interactionRef}
      />

      {/* Chapter 3: AI/ML Lab Orbital Data Rings */}
      <LabOrbitalRings
        theme={theme}
        prefersReducedMotion={prefersReducedMotion}
        isActive={isActive}
        interactionRef={interactionRef}
      />

      {/* Chapter 4: Foundations Geometric Lattice */}
      <FoundationsLattice
        theme={theme}
        prefersReducedMotion={prefersReducedMotion}
      />

      {/* Chapter 5: Chess.com Sculptural Board */}
      <ChessScene
        theme={theme}
        chessStep={chessStep}
        chessAngle={chessAngle}
        isActive={isActive}
        prefersReducedMotion={prefersReducedMotion}
        position={isDesktop ? [1.45, -41.65, -0.35] : [0, -41.5, -1.0]}
        scale={isDesktop ? 0.94 : 0.72}
      />

      {/* Chapter 6: Contact & LinkedIn Spatial Network Constellation */}
      <ContactConstellation
        theme={theme}
        prefersReducedMotion={prefersReducedMotion}
        isActive={isActive}
        interactionRef={interactionRef}
      />
    </>
  );
}

export function SpatialWorldCanvas({
  theme,
  neuralMode,
  pulseSignal,
  obstacleSeed,
  sensorView,
  chessStep,
  chessAngle,
  isActive,
  prefersReducedMotion,
  interactionRef,
  onContextLost,
}: SpatialWorldCanvasProps) {
  const canvasDomRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvasEl = canvasDomRef.current;
    if (!canvasEl) return;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      onContextLost?.();
    };

    canvasEl.addEventListener('webglcontextlost', handleContextLost);
    return () => {
      canvasEl.removeEventListener('webglcontextlost', handleContextLost);
    };
  }, [onContextLost]);

  const frameloop = isActive && !prefersReducedMotion ? 'always' : 'demand';

  return (
    <div
      data-spatial-world=""
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    >
      <Canvas
        dpr={[1, 2]}
        frameloop={frameloop}
        camera={{ position: [0, 0, 5.4], fov: 42, near: 0.1, far: 60 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        }}
        style={{ pointerEvents: 'none', touchAction: 'pan-y' }}
        onCreated={(state) => {
          state.gl.setClearColor(0x000000, 0);
          canvasDomRef.current = state.gl.domElement;
          state.gl.domElement.style.touchAction = 'pan-y';
          state.gl.domElement.style.pointerEvents = 'none';
        }}
      >
        <SpatialWorldScene
          theme={theme}
          neuralMode={neuralMode}
          pulseSignal={pulseSignal}
          obstacleSeed={obstacleSeed}
          sensorView={sensorView}
          chessStep={chessStep}
          chessAngle={chessAngle}
          isActive={isActive}
          prefersReducedMotion={prefersReducedMotion}
          interactionRef={interactionRef}
        />
      </Canvas>
    </div>
  );
}

export default SpatialWorldCanvas;
