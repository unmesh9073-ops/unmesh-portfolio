import { createContext, useContext } from 'react';
import type { NeuralVolumeMode, PulseSignal } from '../components/three/types';

export type ChessBoardAngle = 'isometric' | 'horizon';

export interface SpatialWorldInteractionRef {
  /** Index of hovered project/lab card (-1 when none) */
  hoveredWorkIndex: number;
  hoveredLabIndex: number;
  /** True when hovering any social/contact hub action */
  hoveredContactHub: boolean;
}

export interface SpatialWorldContextValue {
  neuralMode: NeuralVolumeMode;
  setNeuralMode: (mode: NeuralVolumeMode) => void;
  pulseSignal: PulseSignal;
  triggerPulse: (origin?: [number, number, number]) => void;
  obstacleSeed: number;
  injectObstacle: () => void;
  resetObstacles: () => void;
  sensorView: boolean;
  toggleSensorView: () => void;
  chessStep: number;
  stepChessSequence: () => void;
  chessAngle: ChessBoardAngle;
  toggleChessAngle: () => void;
  interactionRef: React.RefObject<SpatialWorldInteractionRef>;
}

export const SpatialWorldContext = createContext<SpatialWorldContextValue | null>(null);

export function useSpatialWorld(): SpatialWorldContextValue {
  const ctx = useContext(SpatialWorldContext);
  if (!ctx) {
    throw new Error('useSpatialWorld must be used within a SpatialWorldProvider');
  }
  return ctx;
}
