import { motion } from 'framer-motion';
import { type KeyboardEvent, useRef } from 'react';
import { productiveFastTransition, snappySpring } from '../lib/motion';
import type { NeuralVolumeMode } from './three/types';

export interface NeuralControlsPillProps {
  mode: NeuralVolumeMode;
  onModeChange: (mode: NeuralVolumeMode) => void;
  onTriggerPulse: () => void;
  disabled?: boolean;
}

const MODES: ReadonlyArray<{ id: NeuralVolumeMode; label: string }> = [
  { id: 'synapse', label: 'Synapse' },
  { id: 'latent', label: 'Latent' },
  { id: 'tensor', label: 'Tensor' },
];

function PulseGlyph({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="2.2" fill="currentColor" />
      <circle
        cx="8"
        cy="8"
        r="5.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeOpacity="0.65"
      />
    </svg>
  );
}

export function NeuralControlsPill({
  mode,
  onModeChange,
  onTriggerPulse,
  disabled = false,
}: NeuralControlsPillProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + delta + MODES.length) % MODES.length;
    const nextMode = MODES[nextIndex];
    onModeChange(nextMode.id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      className="liquid-glass inline-flex max-w-full items-center gap-1 rounded-full p-1 sm:gap-1.5 sm:p-1.5"
      aria-label="3D neural volume controls"
    >
      <div
        role="tablist"
        aria-label="Neural volume mode"
        className="flex items-center gap-0.5"
      >
        {MODES.map((item, index) => {
          const isActive = mode === item.id;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              disabled={disabled}
              onClick={() => onModeChange(item.id)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              className={`relative inline-flex h-8 cursor-pointer items-center justify-center rounded-full px-2.5 text-xs font-medium tracking-[-0.01em] transition-colors duration-200 sm:px-3.5 sm:text-[13px] ${
                isActive ? 'text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="neural-mode-indicator"
                  transition={snappySpring}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full border border-[var(--border-hairline-hover)] bg-[color-mix(in_srgb,var(--text-primary)_9%,transparent)]"
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>

      <span
        aria-hidden="true"
        className="mx-0.5 h-4 w-px shrink-0 bg-[var(--border-hairline)]"
      />

      <motion.button
        type="button"
        disabled={disabled}
        onClick={onTriggerPulse}
        whileTap={{ scale: 0.96 }}
        transition={productiveFastTransition}
        aria-label="Trigger forward-pass signal pulse"
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs font-medium tracking-[-0.01em] text-ink transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)] sm:px-3 sm:text-[13px]"
      >
        <PulseGlyph className="h-3.5 w-3.5 text-accent" />
        <span>Pulse</span>
      </motion.button>
    </div>
  );
}
