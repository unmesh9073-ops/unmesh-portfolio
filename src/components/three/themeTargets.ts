import * as THREE from 'three';

export interface ThemeTargets {
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

export const DARK_TARGETS: ThemeTargets = {
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

export const LIGHT_TARGETS: ThemeTargets = {
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
