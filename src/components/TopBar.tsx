import { AnimatePresence, motion } from 'framer-motion';
import { Command, Moon, Sun } from 'lucide-react';
import { useMemo } from 'react';
import { profileConfig } from '../config/profile.config';
import { useTheme } from '../context/ThemeContext';
import {
  productiveFastTransition,
  tapFeedback,
} from '../lib/motion';
import { isApplePlatform } from '../lib/platform';

export interface TopBarProps {
  onOpenSpotlight: () => void;
}

export function TopBar({ onOpenSpotlight }: TopBarProps) {
  const { isDark, toggleTheme } = useTheme();
  const isApple = useMemo(() => isApplePlatform(), []);

  return (
    <header
      className="sticky top-0 z-40 w-full pointer-events-none"
      aria-label="Primary utility bar"
    >
      {/* Subtle top scroll-edge fade rather than a hard divider */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[var(--bg-canvas)] via-[color-mix(in_srgb,var(--bg-canvas)_72%,transparent)] to-transparent"
      />

      <div className="relative mx-auto flex max-w-[1120px] items-center justify-between px-6 py-4 sm:px-8 lg:px-10">
        {/* Left: Minimal typographic wordmark + subtle live status dot */}
        <a
          href="#top"
          className="pointer-events-auto group inline-flex h-10 items-center gap-2.5 rounded-full px-1 text-ink transition-opacity duration-200 hover:opacity-85"
          title={profileConfig.identity.status}
        >
          <span className="text-[15px] font-semibold tracking-[-0.025em] lowercase">
            {profileConfig.identity.name.toLowerCase()}
          </span>
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-accent transition-transform duration-200 group-hover:scale-110"
          />
          <span className="sr-only">
            {profileConfig.identity.name} — {profileConfig.identity.status}
          </span>
        </a>

        {/* Top center intentionally open and calm (main nav lives in the bottom FloatingDock) */}

        {/* Right: Two compact Liquid Glass pill controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          <motion.button
            type="button"
            onClick={onOpenSpotlight}
            whileTap={tapFeedback}
            transition={productiveFastTransition}
            aria-label={isApple ? 'Open Spotlight (Command K)' : 'Open Spotlight (Ctrl K)'}
            className="liquid-glass liquid-glass-interactive inline-flex h-10 min-w-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-full px-3.5 text-xs font-medium text-ink"
          >
            {isApple ? (
              <Command className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
            ) : (
              <span className="font-mono text-[11px] text-muted">Ctrl</span>
            )}
            <span className="font-mono tracking-[0.02em] text-ink">K</span>
          </motion.button>

          <motion.button
            type="button"
            onClick={toggleTheme}
            whileTap={tapFeedback}
            transition={productiveFastTransition}
            aria-label={isDark ? 'Switch to Light Mode (Titanium Studio)' : 'Switch to Dark Mode (Obsidian Space)'}
            aria-pressed={!isDark}
            className="liquid-glass liquid-glass-interactive inline-flex h-10 w-10 min-w-[44px] cursor-pointer items-center justify-center rounded-full text-ink"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.span
                  key="moon"
                  initial={{ opacity: 0, transform: 'scale(0.85) rotate(-18deg)' }}
                  animate={{ opacity: 1, transform: 'scale(1) rotate(0deg)' }}
                  exit={{ opacity: 0, transform: 'scale(0.85) rotate(18deg)' }}
                  transition={productiveFastTransition}
                  className="inline-flex items-center justify-center"
                >
                  <Moon className="h-4 w-4 text-accent" aria-hidden="true" />
                </motion.span>
              ) : (
                <motion.span
                  key="sun"
                  initial={{ opacity: 0, transform: 'scale(0.85) rotate(18deg)' }}
                  animate={{ opacity: 1, transform: 'scale(1) rotate(0deg)' }}
                  exit={{ opacity: 0, transform: 'scale(0.85) rotate(-18deg)' }}
                  transition={productiveFastTransition}
                  className="inline-flex items-center justify-center"
                >
                  <Sun className="h-4 w-4 text-accent" aria-hidden="true" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
