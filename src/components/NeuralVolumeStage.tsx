import {
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ThemeMode } from '../config/profile.config';
import { NeuralControlsPill } from './NeuralControlsPill';
import type { NeuralVolumeMode, PulseSignal } from './three/types';
import { isWebGLAvailable } from '../lib/webgl';
import { WebGLErrorBoundary } from './WebGLErrorBoundary';

const LazyNeuralVolumeCanvas = lazy(() => import('./three/NeuralVolumeCanvas'));

export interface NeuralVolumeStageProps {
  /** Current adaptive theme passed cleanly to 3D R3F shaders */
  theme: ThemeMode;
  /** Optional whisper accent override for spatial scene lighting */
  accentColor?: string;
  /** Enables pointer orbit / interaction inside the 3D scene */
  interactive?: boolean;
  /** Label rendered inside the fallback geometric placeholder */
  statusLabel?: string;
  /** Secondary caption rendered inside the fallback placeholder */
  subLabel?: string;
  /** Optional className overrides for container layout */
  className?: string;
  /** Optional custom override slot */
  children?: ReactNode;
}

function GeometricRingFallback({
  theme,
  statusLabel,
  subLabel,
}: {
  theme: ThemeMode;
  statusLabel: string;
  subLabel: string;
}) {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-12 pb-16 text-center">
      {/* Concentric geometric reference rings */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          className="h-[340px] w-[340px] rounded-full border sm:h-[400px] sm:w-[400px]"
          style={{ borderColor: 'var(--radial-ring)' }}
        />
        <div
          className="absolute h-[250px] w-[250px] rounded-full border border-dashed sm:h-[296px] sm:w-[296px]"
          style={{ borderColor: 'var(--radial-ring)' }}
        />
        <div
          className="absolute h-[170px] w-[170px] rounded-full border sm:h-[200px] sm:w-[200px]"
          style={{ borderColor: 'var(--border-hairline)' }}
        />
      </div>

      {/* Subtle optical axis ticks */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-1/2 h-px -translate-y-1/2 opacity-40"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, var(--border-hairline) 24%, transparent 40%, transparent 60%, var(--border-hairline) 76%, transparent 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-8 left-1/2 w-px -translate-x-1/2 opacity-40"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, var(--border-hairline) 24%, transparent 40%, transparent 60%, var(--border-hairline) 76%, transparent 100%)',
        }}
      />

      <div className="liquid-glass relative flex h-36 w-36 items-center justify-center rounded-full sm:h-44 sm:w-44">
        <div
          aria-hidden="true"
          className="absolute inset-3.5 rounded-full border border-[var(--border-hairline)]"
        />
        <div className="flex flex-col items-center gap-2.5">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_14px_color-mix(in_srgb,var(--whisper-accent)_55%,transparent)]"
          />
          <span className="font-mono text-[11px] tracking-[0.02em] text-muted">
            {theme === 'dark' ? 'Obsidian' : 'Titanium'}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-1.5">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface-subtle)] px-3.5 py-1.5 font-mono text-xs tracking-[0.01em] text-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          {statusLabel}
        </span>
        <span className="font-mono text-[11px] text-muted">{subLabel}</span>
      </div>
    </div>
  );
}

export function NeuralVolumeStage({
  theme,
  accentColor,
  interactive = true,
  statusLabel = '3D Neural Volume · Ready',
  subLabel = 'WebGL Spatial Canvas Mount',
  className = '',
  children,
}: NeuralVolumeStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<NeuralVolumeMode>('synapse');
  const [pulseSignal, setPulseSignal] = useState<PulseSignal>({
    id: 0,
    origin: [0, 0, 0],
  });
  const [webglSupported] = useState<boolean>(() => isWebGLAvailable());
  const [contextLost, setContextLost] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(() =>
    typeof document === 'undefined' ? true : document.visibilityState === 'visible',
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Pause 3D loop when scrolled out of viewport
  useEffect(() => {
    const node = stageRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsInView(entry.isIntersecting);
        }
      },
      { threshold: 0.05, rootMargin: '60px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Pause 3D loop when tab is inactive
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibility = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Respect prefers-reduced-motion dynamically
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

  const handleTriggerPulse = useCallback(() => {
    setPulseSignal((prev) => ({
      id: prev.id + 1,
      origin: [0, 0, 0],
    }));
  }, []);

  const handleModeChange = useCallback((nextMode: NeuralVolumeMode) => {
    setMode(nextMode);
  }, []);

  const canRenderWebGL = !children && webglSupported && !contextLost;
  const isActive = isInView && isTabVisible;

  const fallbackView = (
    <GeometricRingFallback
      theme={theme}
      statusLabel={contextLost ? '3D Neural Volume · Fallback' : statusLabel}
      subLabel={
        contextLost
          ? 'WebGL context paused — geometric stage active'
          : subLabel
      }
    />
  );

  return (
    <div
      ref={stageRef}
      data-volume-theme={theme}
      data-volume-mode={mode}
      data-volume-interactive={interactive ? 'true' : 'false'}
      style={
        accentColor
          ? ({ '--volume-accent': accentColor } as React.CSSProperties)
          : undefined
      }
      className={`relative flex min-h-[420px] w-full items-center justify-center overflow-hidden rounded-3xl bg-transparent lg:min-h-[520px] ${className}`}
      aria-label={`Interactive 3D neural volume — ${mode} mode`}
    >
      {/* Subtle ambient radial depth field directly over the Obsidian / Titanium canvas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 48%, var(--radial-field) 0%, transparent 66%)',
        }}
      />

      {/* Quiet corner calibration markers */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-4 left-4 right-4 z-20 flex items-center justify-between font-mono text-[11px] tracking-[0.02em] text-muted opacity-80"
      >
        <span>spatial stage</span>
        <span className="text-accent">
          {canRenderWebGL
            ? prefersReducedMotion
              ? `${mode} · static`
              : `${mode} · interactive`
            : 'r3f · fallback'}
        </span>
      </div>

      {children ? (
        <div className="relative z-10 h-full w-full">{children}</div>
      ) : canRenderWebGL ? (
        <>
          <div className="absolute inset-0 z-10">
            <WebGLErrorBoundary
              fallback={fallbackView}
              onError={() => setContextLost(true)}
            >
              <Suspense fallback={fallbackView}>
                <LazyNeuralVolumeCanvas
                  theme={theme}
                  mode={mode}
                  pulseSignal={pulseSignal}
                  isActive={isActive}
                  prefersReducedMotion={prefersReducedMotion}
                  interactive={interactive}
                  onContextLost={() => setContextLost(true)}
                />
              </Suspense>
            </WebGLErrorBoundary>
          </div>

          {/* Floating Liquid Glass segmented control pill docked at bottom-center */}
          <div className="pointer-events-none absolute inset-x-4 bottom-4 z-20 flex justify-center">
            <div className="pointer-events-auto">
              <NeuralControlsPill
                mode={mode}
                onModeChange={handleModeChange}
                onTriggerPulse={handleTriggerPulse}
              />
            </div>
          </div>
        </>
      ) : (
        fallbackView
      )}
    </div>
  );
}
