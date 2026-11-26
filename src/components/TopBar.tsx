import { AnimatePresence, motion } from 'framer-motion';
import { Command, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { profileConfig } from '../config/profile.config';
import { SPATIAL_ROUTES } from '../config/routes';
import { useTheme } from '../context/ThemeContext';
import {
  productiveFastTransition,
  snappySpring,
  tapFeedback,
} from '../lib/motion';
import { isApplePlatform } from '../lib/platform';
import {
  playSpatialModal,
  playSpatialSwitch,
  playSpatialTap,
  useSpatialAudio,
} from '../lib/spatialAudio';

export interface TopBarProps {
  onOpenSpotlight: () => void;
}

export function TopBar({ onOpenSpotlight }: TopBarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { soundEnabled, toggleSound } = useSpatialAudio();
  const isApple = useMemo(() => isApplePlatform(), []);

  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');

  const handleNavigate = (path: string) => {
    if (normalizedPath === path) return;
    playSpatialSwitch();
    navigate(path);
  };

  return (
    <header
      className="sticky top-0 z-40 w-full pointer-events-none"
      aria-label="Primary navigation and utility bar"
    >
      {/* Subtle top scroll-edge fade rather than a hard divider */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--bg-canvas)] via-[color-mix(in_srgb,var(--bg-canvas)_76%,transparent)] to-transparent"
      />

      <div className="relative mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-4 py-3.5 sm:px-8 lg:px-10">
        {/* Left: Minimal typographic wordmark + live status dot */}
        <Link
          to="/"
          onClick={() => {
            if (normalizedPath !== '/') playSpatialSwitch();
          }}
          className="pointer-events-auto group inline-flex h-10 shrink-0 items-center gap-2.5 rounded-full px-1 text-ink transition-opacity duration-200 hover:opacity-85"
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
        </Link>

        {/* Center (Desktop): VisionOS Liquid Glass 6-Tab Pill */}
        <nav
          aria-label="Primary spatial tabs"
          className="pointer-events-auto hidden md:flex items-center gap-0.5 rounded-full p-1 liquid-glass"
        >
          {SPATIAL_ROUTES.map((route) => {
            const isActive = normalizedPath === route.path;
            return (
              <button
                key={route.path}
                type="button"
                onClick={() => handleNavigate(route.path)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative inline-flex h-8 cursor-pointer items-center justify-center rounded-full px-3 text-xs font-medium tracking-[-0.01em] transition-colors duration-150 ${
                  isActive ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="topbar-active-pill"
                    transition={snappySpring}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full border border-[var(--border-hairline-hover)] bg-[color-mix(in_srgb,var(--text-primary)_10%,transparent)]"
                  />
                ) : null}
                <span className="relative z-10 whitespace-nowrap">{route.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Sound Toggle + Spotlight + Theme Toggle */}
        <div className="pointer-events-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <motion.button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              toggleSound();
              if (next) {
                playSpatialTap();
              }
            }}
            whileTap={tapFeedback}
            transition={productiveFastTransition}
            aria-label={soundEnabled ? 'Mute spatial audio' : 'Unmute spatial audio'}
            aria-pressed={soundEnabled}
            title={soundEnabled ? 'Spatial Audio: On' : 'Spatial Audio: Off'}
            className="liquid-glass liquid-glass-interactive inline-flex h-10 w-10 min-w-[44px] cursor-pointer items-center justify-center rounded-full text-ink"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-accent" aria-hidden="true" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted" aria-hidden="true" />
            )}
          </motion.button>

          <motion.button
            type="button"
            onClick={() => {
              playSpatialModal(true);
              onOpenSpotlight();
            }}
            whileTap={tapFeedback}
            transition={productiveFastTransition}
            aria-label={isApple ? 'Open Spotlight (Command K)' : 'Open Spotlight (Ctrl K)'}
            className="liquid-glass liquid-glass-interactive inline-flex h-10 min-w-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium text-ink sm:px-3.5"
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
            onClick={() => {
              playSpatialTap();
              toggleTheme();
            }}
            whileTap={tapFeedback}
            transition={productiveFastTransition}
            aria-label={
              isDark
                ? 'Switch to Light Mode (Titanium Studio)'
                : 'Switch to Dark Mode (Obsidian Space)'
            }
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

      {/* Mobile (<768px): Sleek horizontally scrollable Liquid Glass pill bar */}
      <div className="pointer-events-auto mx-auto w-full max-w-[1120px] px-4 pb-2 md:hidden">
        <nav
          aria-label="Mobile spatial tabs"
          className="liquid-glass no-scrollbar flex w-full items-center gap-1 overflow-x-auto rounded-full p-1"
        >
          {SPATIAL_ROUTES.map((route) => {
            const isActive = normalizedPath === route.path;
            return (
              <button
                key={route.path}
                type="button"
                onClick={() => handleNavigate(route.path)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-full px-3 text-xs font-medium tracking-[-0.01em] transition-colors duration-150 ${
                  isActive ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="topbar-mobile-active-pill"
                    transition={snappySpring}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full border border-[var(--border-hairline-hover)] bg-[color-mix(in_srgb,var(--text-primary)_10%,transparent)]"
                  />
                ) : null}
                <span className="relative z-10 whitespace-nowrap">{route.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
