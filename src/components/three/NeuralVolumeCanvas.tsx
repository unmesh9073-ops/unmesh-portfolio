import { OrbitControls } from '@react-three/drei';
import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { ThemeMode } from '../../config/profile.config';
import type { NeuralVolumeMode, PulseSignal } from './types';

export interface NeuralVolumeCanvasProps {
  theme: ThemeMode;
  mode: NeuralVolumeMode;
  pulseSignal: PulseSignal;
  isActive: boolean;
  prefersReducedMotion: boolean;
  interactive?: boolean;
  onPulseOrigin?: (origin: [number, number, number]) => void;
  onContextLost?: () => void;
}

interface ThemeTargets {
  nodePrimary: THREE.Color;
  nodeSecondary: THREE.Color;
  edgeBase: THREE.Color;
  pulseAccent: THREE.Color;
  pulseCore: THREE.Color;
  tensorCore: THREE.Color;
  tensorWire: THREE.Color;
  edgeRestAlpha: number;
  latentAlpha: number;
}

const DARK_TARGETS: ThemeTargets = {
  nodePrimary: new THREE.Color('#E5E7EB'),
  nodeSecondary: new THREE.Color('#8E8E93'),
  edgeBase: new THREE.Color('#CBD5E1'),
  pulseAccent: new THREE.Color('#B8C7D9'),
  pulseCore: new THREE.Color('#FFFFFF'),
  tensorCore: new THREE.Color('#272C35'),
  tensorWire: new THREE.Color('#D1D8E2'),
  edgeRestAlpha: 0.22,
  latentAlpha: 0.78,
};

const LIGHT_TARGETS: ThemeTargets = {
  nodePrimary: new THREE.Color('#1D1D20'),
  nodeSecondary: new THREE.Color('#52525B'),
  edgeBase: new THREE.Color('#27272A'),
  pulseAccent: new THREE.Color('#475B70'),
  pulseCore: new THREE.Color('#111113'),
  tensorCore: new THREE.Color('#CBD5E1'),
  tensorWire: new THREE.Color('#27272A'),
  edgeRestAlpha: 0.19,
  latentAlpha: 0.76,
};

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface PaletteState {
  nodePrimary: THREE.Color;
  nodeSecondary: THREE.Color;
  edgeBase: THREE.Color;
  pulseAccent: THREE.Color;
  pulseCore: THREE.Color;
  tensorCore: THREE.Color;
  tensorWire: THREE.Color;
  edgeRestAlpha: number;
  latentAlpha: number;
}

interface SharedSceneRef {
  elapsed: number;
  pointerLocal: THREE.Vector3;
  pointerInside: boolean;
  pulseOrigin: THREE.Vector3;
  pulseRadius: number;
  pulseStrength: number;
  palette: PaletteState;
  weights: {
    synapse: number;
    latent: number;
    tensor: number;
  };
}

// ---------------------------------------------------------------------------
// Shaders
// ---------------------------------------------------------------------------

const SYNAPSE_NODE_VERT = /* glsl */ `
  attribute float aEnergy;
  attribute float aLayer;
  uniform float uPixelRatio;
  uniform float uModeWeight;
  varying float vEnergy;
  varying float vLayer;

  void main() {
    vEnergy = aEnergy;
    vLayer = aLayer;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float baseSize = mix(11.0, 17.0, aLayer);
    float pulseBoost = 1.0 + aEnergy * 0.58;
    float scaleFactor = mix(0.92, 1.0, uModeWeight);
    gl_PointSize = baseSize * pulseBoost * scaleFactor * uPixelRatio * (4.6 / max(-mvPosition.z, 1.0));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const SYNAPSE_NODE_FRAG = /* glsl */ `
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;
  uniform vec3 uPulseColor;
  uniform vec3 uPulseCoreColor;
  uniform float uOpacity;
  varying float vEnergy;
  varying float vLayer;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float coreMask = smoothstep(0.32, 0.08, dist);
    float haloMask = smoothstep(0.5, 0.16, dist) * 0.42;
    float alpha = clamp(coreMask + haloMask * (0.45 + vEnergy * 0.8), 0.0, 1.0) * uOpacity;

    vec3 restCol = mix(uSecondaryColor, uPrimaryColor, vLayer);
    vec3 waveCol = mix(uPulseColor, uPulseCoreColor, clamp(vEnergy * 1.1, 0.0, 1.0));
    vec3 finalCol = mix(restCol, waveCol, clamp(vEnergy, 0.0, 1.0));

    gl_FragColor = vec4(finalCol, alpha);
    #include <colorspace_fragment>
  }
`;

const SYNAPSE_EDGE_VERT = /* glsl */ `
  attribute float aEnergy;
  varying float vEnergy;

  void main() {
    vEnergy = aEnergy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SYNAPSE_EDGE_FRAG = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uPulseColor;
  uniform float uRestAlpha;
  uniform float uOpacity;
  varying float vEnergy;

  void main() {
    float alpha = (uRestAlpha + vEnergy * 0.58) * uOpacity;
    vec3 col = mix(uBaseColor, uPulseColor, clamp(vEnergy * 1.15, 0.0, 1.0));
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

const LATENT_VERT = /* glsl */ `
  attribute float aSeed;
  attribute float aLayer;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uModeWeight;
  uniform vec3 uPointerLocal;
  uniform float uPointerActive;
  uniform vec3 uPulseOrigin;
  uniform float uPulseRadius;
  uniform float uPulseStrength;
  varying float vEnergy;
  varying float vLayer;

  void main() {
    vLayer = aLayer;
    vec3 pos = position;

    float angle = uTime * (0.16 + aLayer * 0.08) + aSeed * 6.28318;
    float cs = cos(angle * 0.22);
    float sn = sin(angle * 0.22);
    vec3 drifted = vec3(
      pos.x * cs - pos.z * sn,
      pos.y + sin(uTime * 0.65 + aSeed * 12.566) * 0.035,
      pos.x * sn + pos.z * cs
    );

    vec3 toParticle = drifted - uPointerLocal;
    float pDist = length(toParticle);
    float pInfluence = smoothstep(0.95, 0.0, pDist) * uPointerActive;
    vec3 pDir = pDist > 0.001 ? toParticle / pDist : vec3(0.0, 1.0, 0.0);
    vec3 swirl = cross(pDir, vec3(0.0, 0.0, 1.0));
    drifted += (pDir * 0.12 + swirl * 0.08) * pInfluence;

    vec3 fromPulse = drifted - uPulseOrigin;
    float pulseDist = length(fromPulse);
    float shell = exp(-pow((pulseDist - uPulseRadius) / 0.34, 2.0)) * uPulseStrength;
    vec3 pulseDir = pulseDist > 0.001 ? fromPulse / pulseDist : vec3(0.0, 1.0, 0.0);
    drifted += pulseDir * (shell * 0.09);

    vEnergy = clamp(pInfluence * 0.72 + shell * 1.05, 0.0, 1.0);

    vec4 mvPosition = modelViewMatrix * vec4(drifted, 1.0);
    float ptSize = mix(6.5, 11.0, aLayer) * (1.0 + vEnergy * 0.55) * mix(0.92, 1.0, uModeWeight);
    gl_PointSize = ptSize * uPixelRatio * (4.2 / max(-mvPosition.z, 1.0));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const LATENT_FRAG = /* glsl */ `
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;
  uniform vec3 uPulseColor;
  uniform vec3 uPulseCoreColor;
  uniform float uOpacity;
  varying float vEnergy;
  varying float vLayer;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.14, dist) * mix(0.58, 0.92, vLayer) * uOpacity;
    alpha = clamp(alpha + vEnergy * 0.28 * uOpacity, 0.0, 1.0);

    vec3 baseCol = mix(uSecondaryColor, uPrimaryColor, vLayer);
    vec3 waveCol = mix(uPulseColor, uPulseCoreColor, clamp(vEnergy * 1.1, 0.0, 1.0));
    vec3 finalCol = mix(baseCol, waveCol, vEnergy);

    gl_FragColor = vec4(finalCol, alpha);
    #include <colorspace_fragment>
  }
`;

const TENSOR_WIRE_VERT = /* glsl */ `
  varying vec3 vLocalPos;

  void main() {
    vLocalPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const TENSOR_WIRE_FRAG = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uPulseColor;
  uniform vec3 uPulseOrigin;
  uniform float uPulseRadius;
  uniform float uPulseStrength;
  uniform float uRestAlpha;
  uniform float uOpacity;
  varying vec3 vLocalPos;

  void main() {
    float d = length(vLocalPos - uPulseOrigin);
    float wave = exp(-pow((d - uPulseRadius) / 0.36, 2.0)) * uPulseStrength;
    vec3 col = mix(uBaseColor, uPulseColor, clamp(wave * 1.2, 0.0, 1.0));
    float alpha = (uRestAlpha + wave * 0.58) * uOpacity;
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

// ---------------------------------------------------------------------------
// Mode 1: Synapse (168 nodes + distance-thresholded synaptic lines)
// ---------------------------------------------------------------------------

function buildSynapseTopology() {
  const rand = mulberry32(1337);
  const shells = [
    { count: 32, rMin: 0.62, rMax: 0.74, layer: 0.25 },
    { count: 64, rMin: 1.02, rMax: 1.18, layer: 0.6 },
    { count: 72, rMin: 1.38, rMax: 1.54, layer: 1.0 },
  ];

  const totalNodes = shells.reduce((sum, s) => sum + s.count, 0);
  const basePositions = new Float32Array(totalNodes * 3);
  const nodePhases = new Float32Array(totalNodes);
  const nodeLayers = new Float32Array(totalNodes);

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  let cursor = 0;

  for (const shell of shells) {
    for (let i = 0; i < shell.count; i++) {
      const y = 1 - ((i + 0.5) / shell.count) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i + (rand() - 0.5) * 0.28;
      const r = shell.rMin + rand() * (shell.rMax - shell.rMin);

      const x = Math.cos(theta) * radiusAtY * r;
      const py = y * r;
      const z = Math.sin(theta) * radiusAtY * r;

      basePositions[cursor * 3] = x;
      basePositions[cursor * 3 + 1] = py;
      basePositions[cursor * 3 + 2] = z;

      nodePhases[cursor] = rand() * Math.PI * 2;
      nodeLayers[cursor] = shell.layer;
      cursor++;
    }
  }

  const edgePairs: number[] = [];
  const pairSeen = new Set<number>();
  const maxDistSq = 0.78 * 0.78;
  const neighborLimit = 4;

  for (let i = 0; i < totalNodes; i++) {
    const ix = basePositions[i * 3];
    const iy = basePositions[i * 3 + 1];
    const iz = basePositions[i * 3 + 2];

    const candidates: Array<{ j: number; distSq: number }> = [];
    for (let j = 0; j < totalNodes; j++) {
      if (i === j) continue;
      const dx = basePositions[j * 3] - ix;
      const dy = basePositions[j * 3 + 1] - iy;
      const dz = basePositions[j * 3 + 2] - iz;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq <= maxDistSq) {
        candidates.push({ j, distSq });
      }
    }

    candidates.sort((a, b) => a.distSq - b.distSq);
    const pickCount = Math.min(neighborLimit, candidates.length);
    for (let k = 0; k < pickCount; k++) {
      const j = candidates[k].j;
      const a = Math.min(i, j);
      const b = Math.max(i, j);
      const key = a * totalNodes + b;
      if (!pairSeen.has(key)) {
        pairSeen.add(key);
        edgePairs.push(a, b);
      }
    }
  }

  const edgeCount = edgePairs.length / 2;
  const edgePositions = new Float32Array(edgeCount * 2 * 3);

  for (let e = 0; e < edgeCount; e++) {
    const a = edgePairs[e * 2];
    const b = edgePairs[e * 2 + 1];
    edgePositions[e * 6] = basePositions[a * 3];
    edgePositions[e * 6 + 1] = basePositions[a * 3 + 1];
    edgePositions[e * 6 + 2] = basePositions[a * 3 + 2];
    edgePositions[e * 6 + 3] = basePositions[b * 3];
    edgePositions[e * 6 + 4] = basePositions[b * 3 + 1];
    edgePositions[e * 6 + 5] = basePositions[b * 3 + 2];
  }

  return {
    totalNodes,
    basePositions,
    nodePhases,
    nodeLayers,
    edgePairs: new Uint16Array(edgePairs),
    edgeCount,
    initialEdgePositions: edgePositions,
  };
}

function SynapseVolume({ shared }: { shared: React.RefObject<SharedSceneRef> }) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const pointsMatRef = useRef<THREE.ShaderMaterial>(null);
  const linesMatRef = useRef<THREE.ShaderMaterial>(null);
  const gl = useThree((s) => s.gl);

  const staticTopo = useMemo(() => buildSynapseTopology(), []);

  const geometries = useMemo(() => {
    const livePositions = new Float32Array(staticTopo.basePositions);
    const nodeEnergies = new Float32Array(staticTopo.totalNodes);
    const edgePositions = new Float32Array(staticTopo.initialEdgePositions);
    const edgeEnergies = new Float32Array(staticTopo.edgeCount * 2);

    const pointsGeo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(livePositions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    const energyAttr = new THREE.BufferAttribute(nodeEnergies, 1);
    energyAttr.setUsage(THREE.DynamicDrawUsage);
    pointsGeo.setAttribute('position', posAttr);
    pointsGeo.setAttribute('aEnergy', energyAttr);
    pointsGeo.setAttribute('aLayer', new THREE.BufferAttribute(staticTopo.nodeLayers, 1));

    const linesGeo = new THREE.BufferGeometry();
    const linePosAttr = new THREE.BufferAttribute(edgePositions, 3);
    linePosAttr.setUsage(THREE.DynamicDrawUsage);
    const lineEnergyAttr = new THREE.BufferAttribute(edgeEnergies, 1);
    lineEnergyAttr.setUsage(THREE.DynamicDrawUsage);
    linesGeo.setAttribute('position', linePosAttr);
    linesGeo.setAttribute('aEnergy', lineEnergyAttr);

    return {
      pointsGeo,
      linesGeo,
    };
  }, [staticTopo]);

  useEffect(() => {
    return () => {
      geometries.pointsGeo.dispose();
      geometries.linesGeo.dispose();
    };
  }, [geometries]);

  const pointsUniforms = useMemo(
    () => ({
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
      uModeWeight: { value: 1 },
      uPrimaryColor: { value: DARK_TARGETS.nodePrimary.clone() },
      uSecondaryColor: { value: DARK_TARGETS.nodeSecondary.clone() },
      uPulseColor: { value: DARK_TARGETS.pulseAccent.clone() },
      uPulseCoreColor: { value: DARK_TARGETS.pulseCore.clone() },
      uOpacity: { value: 1 },
    }),
    [gl],
  );

  const linesUniforms = useMemo(
    () => ({
      uBaseColor: { value: DARK_TARGETS.edgeBase.clone() },
      uPulseColor: { value: DARK_TARGETS.pulseAccent.clone() },
      uRestAlpha: { value: DARK_TARGETS.edgeRestAlpha },
      uOpacity: { value: 1 },
    }),
    [],
  );

  useFrame((_, delta) => {
    const s = shared.current;
    const weight = s.weights.synapse;
    const group = groupRef.current;
    const pointsObj = pointsRef.current;
    const linesObj = linesRef.current;
    const pointsMat = pointsMatRef.current;
    const linesMat = linesMatRef.current;
    if (!group || !pointsObj || !linesObj || !pointsMat || !linesMat) return;

    group.visible = weight > 0.004;
    if (!group.visible) return;

    const scale = 0.94 + 0.06 * weight;
    group.scale.setScalar(scale);

    if (s.elapsed > 0) {
      group.rotation.y = s.elapsed * 0.06;
    }

    const posAttr = pointsObj.geometry.getAttribute('position') as THREE.BufferAttribute;
    const energyAttr = pointsObj.geometry.getAttribute('aEnergy') as THREE.BufferAttribute;
    const linePosAttr = linesObj.geometry.getAttribute('position') as THREE.BufferAttribute;
    const lineEnergyAttr = linesObj.geometry.getAttribute('aEnergy') as THREE.BufferAttribute;

    const livePositions = posAttr.array as Float32Array;
    const nodeEnergies = energyAttr.array as Float32Array;
    const edgePositions = linePosAttr.array as Float32Array;
    const edgeEnergies = lineEnergyAttr.array as Float32Array;

    const { totalNodes, basePositions, nodePhases, edgePairs, edgeCount } = staticTopo;

    const ptr = s.pointerLocal;
    const ptrActive = s.pointerInside ? 1 : 0;
    const pulseOrigin = s.pulseOrigin;
    const pulseR = s.pulseRadius;
    const pulseStrength = s.pulseStrength;
    const t = s.elapsed;
    const smoothLerp = 1 - Math.exp(-Math.min(delta, 0.05) * 10);

    for (let i = 0; i < totalNodes; i++) {
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2];

      const breathe = 1 + Math.sin(t * 0.9 + nodePhases[i]) * 0.022;
      let tx = bx * breathe;
      let ty = by * breathe;
      let tz = bz * breathe;

      let hoverGlow = 0;
      if (ptrActive > 0) {
        const dx = ptr.x - tx;
        const dy = ptr.y - ty;
        const dz = ptr.z - tz;
        const dSq = dx * dx + dy * dy + dz * dz;
        if (dSq < 1.1) {
          const d = Math.sqrt(dSq);
          const influence = 1 - d / 1.05;
          const pull = influence * 0.075;
          tx += dx * pull;
          ty += dy * pull;
          tz += dz * pull;
          hoverGlow = influence * 0.65;
        }
      }

      let pulseGlow = 0;
      if (pulseStrength > 0.002) {
        const px = tx - pulseOrigin.x;
        const py = ty - pulseOrigin.y;
        const pz = tz - pulseOrigin.z;
        const pDist = Math.sqrt(px * px + py * py + pz * pz);
        const diff = (pDist - pulseR) / 0.38;
        pulseGlow = Math.exp(-diff * diff) * pulseStrength;
      }

      livePositions[i * 3] += (tx - livePositions[i * 3]) * smoothLerp;
      livePositions[i * 3 + 1] += (ty - livePositions[i * 3 + 1]) * smoothLerp;
      livePositions[i * 3 + 2] += (tz - livePositions[i * 3 + 2]) * smoothLerp;

      const targetEnergy = Math.min(1, hoverGlow + pulseGlow);
      nodeEnergies[i] += (targetEnergy - nodeEnergies[i]) * smoothLerp;
    }

    for (let e = 0; e < edgeCount; e++) {
      const a = edgePairs[e * 2];
      const b = edgePairs[e * 2 + 1];
      edgePositions[e * 6] = livePositions[a * 3];
      edgePositions[e * 6 + 1] = livePositions[a * 3 + 1];
      edgePositions[e * 6 + 2] = livePositions[a * 3 + 2];
      edgePositions[e * 6 + 3] = livePositions[b * 3];
      edgePositions[e * 6 + 4] = livePositions[b * 3 + 1];
      edgePositions[e * 6 + 5] = livePositions[b * 3 + 2];

      edgeEnergies[e * 2] = nodeEnergies[a];
      edgeEnergies[e * 2 + 1] = nodeEnergies[b];
    }

    posAttr.needsUpdate = true;
    energyAttr.needsUpdate = true;
    linePosAttr.needsUpdate = true;
    lineEnergyAttr.needsUpdate = true;

    pointsMat.uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 2);
    pointsMat.uniforms.uModeWeight.value = weight;
    pointsMat.uniforms.uOpacity.value = weight;
    pointsMat.uniforms.uPrimaryColor.value.copy(s.palette.nodePrimary);
    pointsMat.uniforms.uSecondaryColor.value.copy(s.palette.nodeSecondary);
    pointsMat.uniforms.uPulseColor.value.copy(s.palette.pulseAccent);
    pointsMat.uniforms.uPulseCoreColor.value.copy(s.palette.pulseCore);

    linesMat.uniforms.uOpacity.value = weight;
    linesMat.uniforms.uBaseColor.value.copy(s.palette.edgeBase);
    linesMat.uniforms.uPulseColor.value.copy(s.palette.pulseAccent);
    linesMat.uniforms.uRestAlpha.value = s.palette.edgeRestAlpha;
  });

  return (
    <group ref={groupRef}>
      <lineSegments ref={linesRef} geometry={geometries.linesGeo}>
        <shaderMaterial
          ref={linesMatRef}
          vertexShader={SYNAPSE_EDGE_VERT}
          fragmentShader={SYNAPSE_EDGE_FRAG}
          transparent
          depthWrite={false}
          uniforms={linesUniforms}
        />
      </lineSegments>
      <points ref={pointsRef} geometry={geometries.pointsGeo}>
        <shaderMaterial
          ref={pointsMatRef}
          vertexShader={SYNAPSE_NODE_VERT}
          fragmentShader={SYNAPSE_NODE_FRAG}
          transparent
          depthWrite={false}
          uniforms={pointsUniforms}
        />
      </points>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Mode 2: Latent (1,200 GPU embedding particles)
// ---------------------------------------------------------------------------

function LatentVolume({ shared }: { shared: React.RefObject<SharedSceneRef> }) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const pointerActiveSmooth = useRef(0);
  const gl = useThree((s) => s.gl);

  const geometry = useMemo(() => {
    const count = 1200;
    const rand = mulberry32(8421);
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const layers = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const u = rand() * Math.PI * 2;
      const v = rand() * Math.PI * 2;
      const majorR = 1.02 + Math.sin(u * 2) * 0.14;
      const minorR = 0.36 + (rand() - 0.5) * 0.24;

      const x = (majorR + minorR * Math.cos(v)) * Math.cos(u);
      const y = minorR * Math.sin(v) + Math.sin(u * 3) * 0.12;
      const z = (majorR + minorR * Math.cos(v)) * Math.sin(u);

      const jitter = (rand() - 0.5) * 0.16;
      positions[i * 3] = x + jitter;
      positions[i * 3 + 1] = y + (rand() - 0.5) * 0.16;
      positions[i * 3 + 2] = z + (rand() - 0.5) * 0.16;

      seeds[i] = rand();
      layers[i] = rand();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute('aLayer', new THREE.BufferAttribute(layers, 1));
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
      uModeWeight: { value: 0 },
      uPointerLocal: { value: new THREE.Vector3() },
      uPointerActive: { value: 0 },
      uPulseOrigin: { value: new THREE.Vector3() },
      uPulseRadius: { value: 0 },
      uPulseStrength: { value: 0 },
      uPrimaryColor: { value: DARK_TARGETS.nodePrimary.clone() },
      uSecondaryColor: { value: DARK_TARGETS.nodeSecondary.clone() },
      uPulseColor: { value: DARK_TARGETS.pulseAccent.clone() },
      uPulseCoreColor: { value: DARK_TARGETS.pulseCore.clone() },
      uOpacity: { value: 0 },
    }),
    [gl],
  );

  useFrame((_, delta) => {
    const s = shared.current;
    const weight = s.weights.latent;
    const group = groupRef.current;
    const mat = matRef.current;
    if (!group || !mat) return;

    group.visible = weight > 0.004;
    if (!group.visible) return;

    const scale = 0.94 + 0.06 * weight;
    group.scale.setScalar(scale);
    group.rotation.x = 0.42;
    group.rotation.y = s.elapsed * 0.04;
    group.rotation.z = -0.18;

    pointerActiveSmooth.current = THREE.MathUtils.damp(
      pointerActiveSmooth.current,
      s.pointerInside ? 1 : 0,
      7,
      Math.min(delta, 0.05),
    );

    const u = mat.uniforms;
    u.uTime.value = s.elapsed;
    u.uPixelRatio.value = Math.min(gl.getPixelRatio(), 2);
    u.uModeWeight.value = weight;
    u.uPointerLocal.value.copy(s.pointerLocal);
    u.uPointerActive.value = pointerActiveSmooth.current;
    u.uPulseOrigin.value.copy(s.pulseOrigin);
    u.uPulseRadius.value = s.pulseRadius;
    u.uPulseStrength.value = s.pulseStrength;
    u.uOpacity.value = weight * s.palette.latentAlpha;
    u.uPrimaryColor.value.copy(s.palette.nodePrimary);
    u.uSecondaryColor.value.copy(s.palette.nodeSecondary);
    u.uPulseColor.value.copy(s.palette.pulseAccent);
    u.uPulseCoreColor.value.copy(s.palette.pulseCore);
  });

  return (
    <group ref={groupRef} visible={false}>
      <points geometry={geometry}>
        <shaderMaterial
          ref={matRef}
          vertexShader={LATENT_VERT}
          fragmentShader={LATENT_FRAG}
          transparent
          depthWrite={false}
          uniforms={uniforms}
        />
      </points>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Mode 3: Tensor (Nested architectural polyhedron + frosted core + 36 nodes)
// ---------------------------------------------------------------------------

const ORBIT_TILT_ANGLES: ReadonlyArray<[number, number, number]> = [
  [0.48, 0.2, 0.15],
  [-0.72, 0.45, -0.32],
  [1.18, -0.35, 0.55],
];

const ORBIT_RADII = [1.18, 1.32, 1.46] as const;

function TensorVolume({ shared }: { shared: React.RefObject<SharedSceneRef> }) {
  const groupRef = useRef<THREE.Group>(null);
  const outerShellRef = useRef<THREE.LineSegments>(null);
  const midShellRef = useRef<THREE.LineSegments>(null);
  const coreMeshRef = useRef<THREE.Mesh>(null);
  const instancedNodesRef = useRef<THREE.InstancedMesh>(null);

  const outerWireMatRef = useRef<THREE.ShaderMaterial>(null);
  const midWireMatRef = useRef<THREE.ShaderMaterial>(null);
  const coreMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const coreCageMatRef = useRef<THREE.LineBasicMaterial>(null);
  const ringMatRef = useRef<THREE.LineBasicMaterial>(null);
  const nodeMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const geos = useMemo(() => {
    const outerIco = new THREE.IcosahedronGeometry(1.42, 1);
    const outerEdges = new THREE.EdgesGeometry(outerIco);
    outerIco.dispose();

    const midOct = new THREE.OctahedronGeometry(0.98, 0);
    const midEdges = new THREE.EdgesGeometry(midOct);
    midOct.dispose();

    const coreGeo = new THREE.IcosahedronGeometry(0.62, 1);
    const coreWireEdges = new THREE.EdgesGeometry(coreGeo);

    const ringGeometries = ORBIT_RADII.map((radius) => {
      const segments = 96;
      const pts: number[] = [];
      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        pts.push(Math.cos(theta) * radius, 0, Math.sin(theta) * radius);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      return g;
    });

    const nodeGeo = new THREE.OctahedronGeometry(0.032, 0);

    const orbitalNodes: Array<{
      ringIdx: number;
      angleOffset: number;
      speed: number;
      euler: THREE.Euler;
    }> = [];
    for (let r = 0; r < ORBIT_RADII.length; r++) {
      const euler = new THREE.Euler(
        ORBIT_TILT_ANGLES[r][0],
        ORBIT_TILT_ANGLES[r][1],
        ORBIT_TILT_ANGLES[r][2],
      );
      for (let k = 0; k < 12; k++) {
        orbitalNodes.push({
          ringIdx: r,
          angleOffset: (k / 12) * Math.PI * 2,
          speed: (r % 2 === 0 ? 1 : -1) * (0.22 + r * 0.06),
          euler,
        });
      }
    }

    return {
      outerEdges,
      midEdges,
      coreGeo,
      coreWireEdges,
      ringGeometries,
      nodeGeo,
      orbitalNodes,
    };
  }, []);

  useEffect(() => {
    return () => {
      geos.outerEdges.dispose();
      geos.midEdges.dispose();
      geos.coreGeo.dispose();
      geos.coreWireEdges.dispose();
      geos.ringGeometries.forEach((g) => g.dispose());
      geos.nodeGeo.dispose();
    };
  }, [geos]);

  const outerUniforms = useMemo(
    () => ({
      uBaseColor: { value: DARK_TARGETS.tensorWire.clone() },
      uPulseColor: { value: DARK_TARGETS.pulseAccent.clone() },
      uPulseOrigin: { value: new THREE.Vector3() },
      uPulseRadius: { value: 0 },
      uPulseStrength: { value: 0 },
      uRestAlpha: { value: 0.34 },
      uOpacity: { value: 0 },
    }),
    [],
  );

  const midUniforms = useMemo(
    () => ({
      uBaseColor: { value: DARK_TARGETS.pulseAccent.clone() },
      uPulseColor: { value: DARK_TARGETS.pulseCore.clone() },
      uPulseOrigin: { value: new THREE.Vector3() },
      uPulseRadius: { value: 0 },
      uPulseStrength: { value: 0 },
      uRestAlpha: { value: 0.42 },
      uOpacity: { value: 0 },
    }),
    [],
  );

  const ringMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: DARK_TARGETS.edgeBase.clone(),
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
    [],
  );

  useEffect(() => {
    ringMatRef.current = ringMat;
    return () => {
      ringMat.dispose();
    };
  }, [ringMat]);

  const scratchRef = useRef({
    dummy: new THREE.Object3D(),
    pos: new THREE.Vector3(),
    color: new THREE.Color(),
  });

  useLayoutEffect(() => {
    const instanced = instancedNodesRef.current;
    if (!instanced) return;
    const { dummy } = scratchRef.current;
    for (let i = 0; i < geos.orbitalNodes.length; i++) {
      dummy.position.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
      instanced.setColorAt(i, DARK_TARGETS.nodePrimary);
    }
    instanced.instanceMatrix.needsUpdate = true;
    if (instanced.instanceColor) {
      instanced.instanceColor.needsUpdate = true;
    }
  }, [geos.orbitalNodes.length]);

  useFrame(() => {
    const s = shared.current;
    const weight = s.weights.tensor;
    const group = groupRef.current;
    if (!group) return;

    group.visible = weight > 0.004;
    if (!group.visible) return;

    const scale = 0.94 + 0.06 * weight;
    group.scale.setScalar(scale);

    const t = s.elapsed;
    if (outerShellRef.current) {
      outerShellRef.current.rotation.y = t * 0.09;
      outerShellRef.current.rotation.x = t * 0.04;
    }
    if (midShellRef.current) {
      midShellRef.current.rotation.y = -t * 0.14;
      midShellRef.current.rotation.z = t * 0.06;
    }
    if (coreMeshRef.current) {
      coreMeshRef.current.rotation.y = t * 0.12;
      coreMeshRef.current.rotation.x = -t * 0.05;
    }

    const outerMat = outerWireMatRef.current;
    if (outerMat) {
      outerMat.uniforms.uOpacity.value = weight;
      outerMat.uniforms.uBaseColor.value.copy(s.palette.tensorWire);
      outerMat.uniforms.uPulseColor.value.copy(s.palette.pulseAccent);
      outerMat.uniforms.uPulseOrigin.value.copy(s.pulseOrigin);
      outerMat.uniforms.uPulseRadius.value = s.pulseRadius;
      outerMat.uniforms.uPulseStrength.value = s.pulseStrength;
    }

    const midMat = midWireMatRef.current;
    if (midMat) {
      midMat.uniforms.uOpacity.value = weight;
      midMat.uniforms.uBaseColor.value.copy(s.palette.pulseAccent);
      midMat.uniforms.uPulseColor.value.copy(s.palette.pulseCore);
      midMat.uniforms.uPulseOrigin.value.copy(s.pulseOrigin);
      midMat.uniforms.uPulseRadius.value = s.pulseRadius;
      midMat.uniforms.uPulseStrength.value = s.pulseStrength;
    }

    const centerPulse =
      s.pulseStrength > 0.002
        ? Math.exp(-Math.pow(s.pulseRadius / 0.65, 2)) * s.pulseStrength
        : 0;

    const coreMat = coreMatRef.current;
    if (coreMat) {
      coreMat.color.copy(s.palette.tensorCore);
      coreMat.emissive.copy(s.palette.pulseAccent);
      coreMat.emissiveIntensity = centerPulse * 0.45;
      coreMat.opacity = (0.56 + centerPulse * 0.18) * weight;
    }

    const coreCageMat = coreCageMatRef.current;
    if (coreCageMat) {
      coreCageMat.color.copy(s.palette.tensorWire);
      coreCageMat.opacity = (0.34 + centerPulse * 0.42) * weight;
    }

    if (ringMatRef.current) {
      ringMatRef.current.color.copy(s.palette.edgeBase);
      ringMatRef.current.opacity = 0.2 * weight;
    }

    if (nodeMatRef.current) {
      nodeMatRef.current.opacity = 0.92 * weight;
    }

    const instanced = instancedNodesRef.current;
    if (instanced) {
      const { dummy, pos, color } = scratchRef.current;
      for (let i = 0; i < geos.orbitalNodes.length; i++) {
        const node = geos.orbitalNodes[i];
        const radius = ORBIT_RADII[node.ringIdx];
        const theta = node.angleOffset + t * node.speed;

        pos.set(Math.cos(theta) * radius, 0, Math.sin(theta) * radius);
        pos.applyEuler(node.euler);

        const dPulse = pos.distanceTo(s.pulseOrigin);
        const wave =
          s.pulseStrength > 0.002
            ? Math.exp(-Math.pow((dPulse - s.pulseRadius) / 0.36, 2)) * s.pulseStrength
            : 0;

        const dPtr = s.pointerInside ? pos.distanceTo(s.pointerLocal) : 99;
        const hover = dPtr < 0.95 ? (1 - dPtr / 0.95) * 0.6 : 0;
        const energy = Math.min(1, wave + hover);

        dummy.position.copy(pos);
        dummy.rotation.set(t + i, theta, 0);
        dummy.scale.setScalar(1 + energy * 0.65);
        dummy.updateMatrix();
        instanced.setMatrixAt(i, dummy.matrix);

        color.copy(s.palette.nodePrimary).lerp(s.palette.pulseCore, energy);
        instanced.setColorAt(i, color);
      }

      instanced.instanceMatrix.needsUpdate = true;
      if (instanced.instanceColor) {
        instanced.instanceColor.needsUpdate = true;
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <lineSegments ref={outerShellRef} geometry={geos.outerEdges}>
        <shaderMaterial
          ref={outerWireMatRef}
          vertexShader={TENSOR_WIRE_VERT}
          fragmentShader={TENSOR_WIRE_FRAG}
          transparent
          depthWrite={false}
          uniforms={outerUniforms}
        />
      </lineSegments>

      <lineSegments ref={midShellRef} geometry={geos.midEdges}>
        <shaderMaterial
          ref={midWireMatRef}
          vertexShader={TENSOR_WIRE_VERT}
          fragmentShader={TENSOR_WIRE_FRAG}
          transparent
          depthWrite={false}
          uniforms={midUniforms}
        />
      </lineSegments>

      <mesh ref={coreMeshRef} geometry={geos.coreGeo}>
        <meshPhysicalMaterial
          ref={coreMatRef}
          color="#272C35"
          roughness={0.3}
          metalness={0.48}
          clearcoat={0.72}
          clearcoatRoughness={0.24}
          flatShading
          transparent
          opacity={0.58}
        />
        <lineSegments geometry={geos.coreWireEdges}>
          <lineBasicMaterial
            ref={coreCageMatRef}
            color="#D1D8E2"
            transparent
            opacity={0.36}
            depthWrite={false}
          />
        </lineSegments>
      </mesh>

      {geos.ringGeometries.map((ringGeo, idx) => (
        <lineLoop
          key={ORBIT_RADII[idx]}
          geometry={ringGeo}
          material={ringMat}
          rotation={ORBIT_TILT_ANGLES[idx]}
        />
      ))}

      <instancedMesh
        ref={instancedNodesRef}
        args={[geos.nodeGeo, undefined, geos.orbitalNodes.length]}
      >
        <meshBasicMaterial
          ref={nodeMatRef}
          color="#ffffff"
          transparent
          opacity={0.92}
        />
      </instancedMesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene Root Orchestrator
// ---------------------------------------------------------------------------

interface SceneContentProps {
  theme: ThemeMode;
  mode: NeuralVolumeMode;
  pulseSignal: PulseSignal;
  isActive: boolean;
  prefersReducedMotion: boolean;
  interactive: boolean;
  onPulseOrigin?: (origin: [number, number, number]) => void;
}

function NeuralVolumeScene({
  theme,
  mode,
  pulseSignal,
  isActive,
  prefersReducedMotion,
  interactive,
  onPulseOrigin,
}: SceneContentProps) {
  const { invalidate } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const tiltGroupRef = useRef<THREE.Group>(null);
  const lastPulseIdRef = useRef(0);

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
      synapse: mode === 'synapse' ? 1 : 0,
      latent: mode === 'latent' ? 1 : 0,
      tensor: mode === 'tensor' ? 1 : 0,
    },
  });

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (controls.domElement) {
      controls.domElement.style.touchAction = 'pan-y';
    }
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

      s.weights.synapse = mode === 'synapse' ? 1 : 0;
      s.weights.latent = mode === 'latent' ? 1 : 0;
      s.weights.tensor = mode === 'tensor' ? 1 : 0;
    }
    invalidate();
  }, [theme, mode, prefersReducedMotion, invalidate]);

  const rayScratchRef = useRef({
    rayOrigin: new THREE.Vector3(),
    plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    cameraDir: new THREE.Vector3(),
    invQuat: new THREE.Quaternion(),
  });

  useFrame((state, delta) => {
    const s = sharedRef.current;
    const dt = Math.min(delta, 0.05);

    if (isActive && !prefersReducedMotion) {
      s.elapsed += dt;
    }

    const target = theme === 'dark' ? DARK_TARGETS : LIGHT_TARGETS;
    const colorSpeed = prefersReducedMotion ? 100 : 8;
    s.palette.nodePrimary.lerp(target.nodePrimary, 1 - Math.exp(-dt * colorSpeed));
    s.palette.nodeSecondary.lerp(target.nodeSecondary, 1 - Math.exp(-dt * colorSpeed));
    s.palette.edgeBase.lerp(target.edgeBase, 1 - Math.exp(-dt * colorSpeed));
    s.palette.pulseAccent.lerp(target.pulseAccent, 1 - Math.exp(-dt * colorSpeed));
    s.palette.pulseCore.lerp(target.pulseCore, 1 - Math.exp(-dt * colorSpeed));
    s.palette.tensorCore.lerp(target.tensorCore, 1 - Math.exp(-dt * colorSpeed));
    s.palette.tensorWire.lerp(target.tensorWire, 1 - Math.exp(-dt * colorSpeed));
    s.palette.edgeRestAlpha = THREE.MathUtils.damp(
      s.palette.edgeRestAlpha,
      target.edgeRestAlpha,
      colorSpeed,
      dt,
    );
    s.palette.latentAlpha = THREE.MathUtils.damp(
      s.palette.latentAlpha,
      target.latentAlpha,
      colorSpeed,
      dt,
    );

    const modeSpeed = prefersReducedMotion ? 100 : 10;
    s.weights.synapse = THREE.MathUtils.damp(
      s.weights.synapse,
      mode === 'synapse' ? 1 : 0,
      modeSpeed,
      dt,
    );
    s.weights.latent = THREE.MathUtils.damp(
      s.weights.latent,
      mode === 'latent' ? 1 : 0,
      modeSpeed,
      dt,
    );
    s.weights.tensor = THREE.MathUtils.damp(
      s.weights.tensor,
      mode === 'tensor' ? 1 : 0,
      modeSpeed,
      dt,
    );

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

    const tiltGroup = tiltGroupRef.current;
    if (tiltGroup) {
      if (interactive && !prefersReducedMotion) {
        const targetRotX = s.pointerInside ? -state.pointer.y * 0.14 : 0;
        const targetRotY = s.pointerInside ? state.pointer.x * 0.16 : 0;
        tiltGroup.rotation.x = THREE.MathUtils.damp(tiltGroup.rotation.x, targetRotX, 6, dt);
        tiltGroup.rotation.y = THREE.MathUtils.damp(tiltGroup.rotation.y, targetRotY, 6, dt);
      }

      const { rayOrigin, plane, cameraDir, invQuat } = rayScratchRef.current;
      state.camera.getWorldDirection(cameraDir);
      plane.setFromNormalAndCoplanarPoint(cameraDir.negate(), rayOrigin.set(0, 0, 0));
      state.raycaster.setFromCamera(state.pointer, state.camera);
      if (state.raycaster.ray.intersectPlane(plane, s.pointerLocal)) {
        tiltGroup.getWorldQuaternion(invQuat).invert();
        s.pointerLocal.applyQuaternion(invQuat);
      }
    }
  });

  const fireLocalPulse = useCallback(
    (worldPoint: THREE.Vector3) => {
      const s = sharedRef.current;
      const localPt = worldPoint.clone();
      if (tiltGroupRef.current) {
        tiltGroupRef.current.worldToLocal(localPt);
      }
      if (localPt.length() > 1.55) {
        localPt.setLength(1.45);
      }
      s.pulseOrigin.copy(localPt);
      s.pulseRadius = 0;
      s.pulseStrength = 1;
      onPulseOrigin?.([localPt.x, localPt.y, localPt.z]);
      invalidate();
    },
    [invalidate, onPulseOrigin],
  );

  const handleHitSphereClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (event.delta > 5) return;
      event.stopPropagation();
      fireLocalPulse(event.point);
    },
    [fireLocalPulse],
  );

  return (
    <>
      <ambientLight intensity={theme === 'dark' ? 0.55 : 0.78} />
      <directionalLight
        position={[4, 5, 4]}
        intensity={theme === 'dark' ? 1.4 : 1.1}
        color="#F8FAFC"
      />
      <directionalLight
        position={[-4, -3, -2]}
        intensity={theme === 'dark' ? 0.75 : 0.45}
        color={theme === 'dark' ? '#B8C7D9' : '#475B70'}
      />

      <group
        ref={tiltGroupRef}
        onPointerOver={() => {
          sharedRef.current.pointerInside = true;
        }}
        onPointerMove={() => {
          sharedRef.current.pointerInside = true;
        }}
        onPointerOut={() => {
          sharedRef.current.pointerInside = false;
        }}
      >
        <mesh onClick={handleHitSphereClick}>
          <sphereGeometry args={[1.65, 16, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>

        <SynapseVolume shared={sharedRef} />
        <LatentVolume shared={sharedRef} />
        <TensorVolume shared={sharedRef} />
      </group>

      {interactive && (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.05}
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.65}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Exported Lazy Canvas Component
// ---------------------------------------------------------------------------

export function NeuralVolumeCanvas({
  theme,
  mode,
  pulseSignal,
  isActive,
  prefersReducedMotion,
  interactive = true,
  onPulseOrigin,
  onContextLost,
}: NeuralVolumeCanvasProps) {
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
      data-volume-canvas=""
      className="h-full w-full cursor-grab active:cursor-grabbing"
    >
      <Canvas
        dpr={[1, 2]}
        frameloop={frameloop}
        camera={{ position: [0, 0, 5.1], fov: 42, near: 0.1, far: 50 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        }}
        style={{ touchAction: 'pan-y' }}
        onCreated={(state) => {
          state.gl.setClearColor(0x000000, 0);
          canvasDomRef.current = state.gl.domElement;
          state.gl.domElement.style.touchAction = 'pan-y';
        }}
      >
        <NeuralVolumeScene
          theme={theme}
          mode={mode}
          pulseSignal={pulseSignal}
          isActive={isActive}
          prefersReducedMotion={prefersReducedMotion}
          interactive={interactive}
          onPulseOrigin={onPulseOrigin}
        />
      </Canvas>
    </div>
  );
}

export default NeuralVolumeCanvas;
