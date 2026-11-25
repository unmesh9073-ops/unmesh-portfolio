import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { toastVariants } from '../lib/motion';

export interface LiquidGlassToastProps {
  visible: boolean;
  message: string;
}

export function LiquidGlassToast({ visible, message }: LiquidGlassToastProps) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+5.75rem)] z-50 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            key={message}
            variants={toastVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="liquid-glass pointer-events-auto inline-flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[13px] font-medium text-ink"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--whisper-accent)_18%,transparent)]">
              <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            </span>
            <span>{message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
