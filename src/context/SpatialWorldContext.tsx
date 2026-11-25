import {
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { NeuralVolumeMode, PulseSignal } from '../components/three/types';
import {
  type ChessBoardAngle,
  SpatialWorldContext,
  type SpatialWorldContextValue,
  type SpatialWorldInteractionRef,
} from './useSpatialWorld';

export function SpatialWorldProvider({ children }: { children: ReactNode }) {
  const [neuralMode, setNeuralMode] = useState<NeuralVolumeMode>('synapse');
  const [pulseSignal, setPulseSignal] = useState<PulseSignal>({
    id: 0,
    origin: [0, 0, 0],
  });
  const [obstacleSeed, setObstacleSeed] = useState(0);
  const [sensorView, setSensorView] = useState(true);
  const [chessStep, setChessStep] = useState(0);
  const [chessAngle, setChessAngle] = useState<ChessBoardAngle>('isometric');

  const interactionRef = useRef<SpatialWorldInteractionRef>({
    hoveredWorkIndex: -1,
    hoveredLabIndex: -1,
    hoveredContactHub: false,
  });

  const triggerPulse = useCallback((origin: [number, number, number] = [0, 0, 0]) => {
    setPulseSignal((prev) => ({
      id: prev.id + 1,
      origin,
    }));
  }, []);

  const injectObstacle = useCallback(() => {
    setObstacleSeed((prev) => prev + 1);
  }, []);

  const resetObstacles = useCallback(() => {
    setObstacleSeed(0);
  }, []);

  const toggleSensorView = useCallback(() => {
    setSensorView((prev) => !prev);
  }, []);

  const stepChessSequence = useCallback(() => {
    setChessStep((prev) => (prev + 1) % 4);
  }, []);

  const toggleChessAngle = useCallback(() => {
    setChessAngle((prev) => (prev === 'isometric' ? 'horizon' : 'isometric'));
  }, []);

  const value = useMemo<SpatialWorldContextValue>(
    () => ({
      neuralMode,
      setNeuralMode,
      pulseSignal,
      triggerPulse,
      obstacleSeed,
      injectObstacle,
      resetObstacles,
      sensorView,
      toggleSensorView,
      chessStep,
      stepChessSequence,
      chessAngle,
      toggleChessAngle,
      interactionRef,
    }),
    [
      neuralMode,
      pulseSignal,
      triggerPulse,
      obstacleSeed,
      injectObstacle,
      resetObstacles,
      sensorView,
      toggleSensorView,
      chessStep,
      stepChessSequence,
      chessAngle,
      toggleChessAngle,
    ],
  );

  return (
    <SpatialWorldContext.Provider value={value}>
      {children}
    </SpatialWorldContext.Provider>
  );
}
