import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PRODUCTIVE_EASE } from '../lib/motion';

const SESSION_KEY = 'unmesh-preloader-seen';
const DURATION_MS = 900;

function readShouldRun(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    return window.sessionStorage.getItem(SESSION_KEY) !== '1';
  } catch {
    return false;
  }
}

export function PrecisionPreloader() {
  const shouldReduceMotion = useReducedMotion();
  const [visible, setVisible] = useState<boolean>(() => readShouldRun());
  const [progress, setProgress] = useState(0);

  const isVisible = visible && !shouldReduceMotion;

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    try {
      window.sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // Ignore storage errors
    }

    let rafId = 0;
    let dismissTimer: number | null = null;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / DURATION_MS);
      // Cubic ease-out for crisp 000 -> 100 cadence
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.round(eased * 100));

      if (t < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        dismissTimer = window.setTimeout(() => {
          setVisible(false);
        }, 120);
      }
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      if (dismissTimer !== null) {
        window.clearTimeout(dismissTimer);
      }
    };
  }, [isVisible]);

  const formatted = String(progress).padStart(3, '0');

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          key="precision-preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transform: 'scale(1.015)' }}
          transition={{ duration: 0.34, ease: PRODUCTIVE_EASE }}
          aria-hidden="true"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-canvas)] select-none"
        >
          <div className="flex flex-col items-center gap-3">
            <span className="font-mono text-4xl font-semibold tracking-[-0.04em] text-ink tabular-nums sm:text-5xl">
              {formatted}
            </span>
            <div className="h-px w-28 overflow-hidden rounded-full bg-[var(--border-hairline)]">
              <div
                className="h-full bg-accent transition-[width] duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              Spatial World · Ready
            </span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
