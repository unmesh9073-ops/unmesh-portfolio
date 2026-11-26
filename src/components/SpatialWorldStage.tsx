import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getRouteChapterIndex } from '../config/routes';
import { useSpatialWorld } from '../context/useSpatialWorld';
import { useTheme } from '../context/ThemeContext';
import { isWebGLAvailable } from '../lib/webgl';
import { WebGLErrorBoundary } from './WebGLErrorBoundary';

const LazySpatialWorldCanvas = lazy(() => import('./three/SpatialWorldCanvas'));

function AmbientFallbackBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div
        className="absolute -top-32 right-[-10%] h-[520px] w-[520px] rounded-full opacity-60"
        style={{
          background:
            'radial-gradient(circle, var(--radial-field) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-[45%] left-[-12%] h-[460px] w-[460px] rounded-full opacity-45"
        style={{
          background:
            'radial-gradient(circle, var(--radial-field) 0%, transparent 72%)',
        }}
      />
    </div>
  );
}

export function SpatialWorldStage() {
  const { pathname } = useLocation();
  const activeChapter = getRouteChapterIndex(pathname);
  const { theme } = useTheme();
  const {
    neuralMode,
    pulseSignal,
    obstacleSeed,
    sensorView,
    chessStep,
    chessAngle,
    interactionRef,
  } = useSpatialWorld();

  const [webglSupported] = useState<boolean>(() => isWebGLAvailable());
  const [contextLost, setContextLost] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(() =>
    typeof document === 'undefined' ? true : document.visibilityState === 'visible',
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibility = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  if (!webglSupported || contextLost) {
    return <AmbientFallbackBackdrop />;
  }

  return (
    <WebGLErrorBoundary
      fallback={<AmbientFallbackBackdrop />}
      onError={() => setContextLost(true)}
    >
      <Suspense fallback={<AmbientFallbackBackdrop />}>
        <LazySpatialWorldCanvas
          theme={theme}
          activeChapter={activeChapter}
          neuralMode={neuralMode}
          pulseSignal={pulseSignal}
          obstacleSeed={obstacleSeed}
          sensorView={sensorView}
          chessStep={chessStep}
          chessAngle={chessAngle}
          isActive={isTabVisible}
          prefersReducedMotion={prefersReducedMotion}
          interactionRef={interactionRef}
          onContextLost={() => setContextLost(true)}
        />
      </Suspense>
    </WebGLErrorBoundary>
  );
}
