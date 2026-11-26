import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion';
import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
} from 'react';
import { productiveFastTransition } from '../lib/motion';

export interface SpatialCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  ariaLabel?: string;
}

const TILT_SPRING_CONFIG = {
  stiffness: 260,
  damping: 24,
  mass: 0.6,
};

export function SpatialCard({
  children,
  className = '',
  onClick,
  onPointerEnter,
  onPointerLeave,
  ariaLabel,
}: SpatialCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const finePointerRef = useRef(false);
  const shouldReduceMotion = useReducedMotion();

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);

  const rotateX = useSpring(rawRotateX, TILT_SPRING_CONFIG);
  const rotateY = useSpring(rawRotateY, TILT_SPRING_CONFIG);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => {
      finePointerRef.current = mq.matches;
      if (!mq.matches) {
        rawRotateX.set(0);
        rawRotateY.set(0);
      }
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [rawRotateX, rawRotateY]);

  useEffect(() => {
    if (shouldReduceMotion) {
      rawRotateX.set(0);
      rawRotateY.set(0);
    }
  }, [shouldReduceMotion, rawRotateX, rawRotateY]);

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (shouldReduceMotion || !finePointerRef.current) return;
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;

    const el = cardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;

    // Update CSS vars directly on DOM node for zero React re-renders
    el.style.setProperty('--mouse-x', `${localX.toFixed(1)}px`);
    el.style.setProperty('--mouse-y', `${localY.toFixed(1)}px`);

    const normX = (localX / rect.width - 0.5) * 2; // -1..1
    const normY = (localY / rect.height - 0.5) * 2; // -1..1

    rawRotateX.set(-normY * 4);
    rawRotateY.set(normX * 4);
  };

  const handlePointerLeave = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
    onPointerLeave?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onClick) return;
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  const isInteractive = Boolean(onClick);

  return (
    <motion.article
      ref={cardRef}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onPointerEnter={onPointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      whileTap={isInteractive && !shouldReduceMotion ? { scale: 0.985 } : undefined}
      transition={productiveFastTransition}
      style={
        shouldReduceMotion
          ? undefined
          : {
              transformPerspective: 920,
              rotateX,
              rotateY,
            }
      }
      className={`quiet-surface quiet-surface-interactive group relative overflow-hidden rounded-2xl ${
        isInteractive ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Whisper-quiet specular sheen tracking cursor on fine pointers */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(280px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--specular-sheen), transparent 72%)',
        }}
      />

      {/* VisionOS gaze-style specular rim highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          padding: '1px',
          background:
            'radial-gradient(220px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--border-hairline-hover), transparent 70%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      <div className="relative z-10 h-full">{children}</div>
    </motion.article>
  );
}
