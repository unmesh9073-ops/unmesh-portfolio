import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Compass, Crown, Play, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { SpatialCard } from '../components/SpatialCard';
import { profileConfig } from '../config/profile.config';
import { useChess } from '../context/useChess';
import { useSpatialWorld } from '../context/useSpatialWorld';
import type { ChessPlatform } from '../lib/chess';
import {
  PRODUCTIVE_EASE,
  productiveFastTransition,
  snappySpring,
  tapFeedback,
} from '../lib/motion';
import { playSpatialTap } from '../lib/spatialAudio';

const SEQUENCE_LABELS = [
  '1. e4 e5',
  '2. Nf3 Nc6',
  '3. Bb5 a6',
  '4. O-O',
] as const;

const PLATFORMS: ReadonlyArray<{ id: ChessPlatform; label: string }> = [
  { id: 'chesscom', label: 'Chess.com' },
  { id: 'lichess', label: 'Lichess' },
];

export function ChessSection() {
  const { chess } = profileConfig;
  const { chessCom, lichess, isRefreshing, refresh } = useChess();
  const {
    chessStep,
    stepChessSequence,
    chessAngle,
    toggleChessAngle,
  } = useSpatialWorld();

  const [activePlatform, setActivePlatform] = useState<ChessPlatform>('chesscom');
  const activeData = activePlatform === 'chesscom' ? chessCom : lichess;
  const platformName = activePlatform === 'chesscom' ? 'Chess.com' : 'Lichess';

  const statusLabel =
    activeData.status === 'live'
      ? `Synced live from ${platformName}`
      : activeData.statusReason === 'unconfigured'
        ? 'Preview stats · Connect in profile.config.ts'
        : `Preview stats · ${platformName} offline`;

  return (
    <section
      id="chess"
      aria-labelledby="chess-heading"
      className="relative mx-auto w-full max-w-[1120px] scroll-mt-24 px-6 py-20 sm:px-8 lg:px-10 lg:py-24"
    >
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left/Main Column: Platform Switcher, Ratings & Recent Matches */}
        <div className="lg:col-span-7">
          <div className="quiet-surface rounded-3xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Liquid Glass Platform Switcher */}
              <div
                role="tablist"
                aria-label="Chess platform"
                className="liquid-glass inline-flex items-center gap-0.5 rounded-full p-1"
              >
                {PLATFORMS.map((item) => {
                  const isSelected = activePlatform === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => {
                        playSpatialTap();
                        setActivePlatform(item.id);
                      }}
                      className={`relative inline-flex h-8 cursor-pointer items-center justify-center rounded-full px-3.5 text-xs font-medium tracking-[-0.01em] transition-colors duration-150 ${
                        isSelected ? 'text-ink' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {isSelected && (
                        <motion.span
                          layoutId="chess-platform-indicator"
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

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      activeData.status === 'live'
                        ? 'bg-accent'
                        : 'border border-[var(--whisper-accent)] bg-transparent'
                    }`}
                    aria-hidden="true"
                  />
                  {statusLabel}
                </span>

                <button
                  type="button"
                  onClick={() => void refresh(activePlatform)}
                  disabled={isRefreshing}
                  aria-label={`Refresh ${platformName} stats`}
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[var(--border-hairline)] text-muted transition-colors duration-150 hover:border-[var(--border-hairline-hover)] hover:text-ink"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 font-mono text-[11px] text-muted">
              <Crown className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span>Chess Hobby · {platformName}</span>
            </div>

            <h2 id="chess-heading" className="section-heading mt-2 text-ink">
              {chess.headline}
            </h2>

            <p className="mt-2.5 max-w-[56ch] text-[15px] leading-[1.6] text-muted">
              {chess.bio}
            </p>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activePlatform}
                initial={{ opacity: 0, transform: 'translateY(4px)' }}
                animate={{ opacity: 1, transform: 'translateY(0px)' }}
                exit={{ opacity: 0, transform: 'translateY(-4px)' }}
                transition={{ duration: 0.18, ease: PRODUCTIVE_EASE }}
              >
                {/* Live Ratings Grid */}
                {activeData.ratings.length > 0 ? (
                  <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {activeData.ratings.map((entry) => {
                      const subtext = entry.best && entry.best > entry.current
                        ? `Peak ${entry.best}`
                        : entry.prog !== undefined && entry.prog !== 0
                          ? `${entry.prog > 0 ? '+' : ''}${entry.prog} trend`
                          : entry.record
                            ? `${entry.record.win}W · ${entry.record.draw}D · ${entry.record.loss}L`
                            : entry.games !== undefined
                              ? `${entry.games} games`
                              : 'Active';

                      return (
                        <SpatialCard
                          key={entry.key}
                          className="bg-[var(--bg-surface-subtle)] p-4"
                        >
                          <div className="font-mono text-[11px] uppercase tracking-[0.04em] text-muted">
                            {entry.label}
                          </div>
                          <div className="mt-1.5 text-2xl font-semibold tracking-[-0.025em] text-ink">
                            {entry.current}
                          </div>
                          <div className="mt-1.5 font-mono text-[11px] text-muted">
                            {subtext}
                          </div>
                        </SpatialCard>
                      );
                    })}
                  </div>
                ) : null}

                {/* Recent Matches Strip */}
                {activeData.recentGames.length > 0 ? (
                  <div className="mt-6">
                    <div className="mb-2.5 flex items-center justify-between">
                      <h3 className="font-mono text-[11px] uppercase tracking-[0.05em] text-muted">
                        Recent Matches · {platformName}
                      </h3>
                      <a
                        href={activeData.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-accent transition-opacity duration-150 hover:opacity-80"
                      >
                        <span>View on {platformName}</span>
                        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                      </a>
                    </div>

                    <div className="divide-y divide-[var(--border-hairline)] rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface-subtle)]">
                      {activeData.recentGames.slice(0, 4).map((game) => (
                        <a
                          key={game.id}
                          href={game.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--text-primary)_4%,transparent)]"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className={`inline-flex w-12 shrink-0 items-center justify-center rounded-full border px-2 py-0.5 font-mono text-[11px] font-medium ${
                                game.result === 'Win'
                                  ? 'border-[var(--border-hairline-hover)] bg-[color-mix(in_srgb,var(--whisper-accent)_14%,transparent)] text-ink'
                                  : game.result === 'Draw'
                                    ? 'border-[var(--border-hairline)] text-muted'
                                    : 'border-[var(--border-hairline)] text-muted opacity-80'
                              }`}
                            >
                              {game.result}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate">
                                <span className="font-medium text-ink">
                                  vs {game.opponent}
                                </span>
                                {game.opponentRating > 0 ? (
                                  <span className="ml-1.5 font-mono text-xs text-muted">
                                    ({game.opponentRating})
                                  </span>
                                ) : null}
                              </div>
                              {game.opening ? (
                                <div className="truncate font-mono text-[11px] text-muted">
                                  {game.opening}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2.5 font-mono text-[11px] text-muted">
                            <span className="rounded-md border border-[var(--border-hairline)] px-2 py-0.5">
                              {game.timeClass}
                            </span>
                            {game.accuracy !== undefined ? (
                              <span className="hidden sm:inline">
                                {game.accuracy}% acc
                              </span>
                            ) : null}
                            <ArrowUpRight
                              className="h-3.5 w-3.5 text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink"
                              aria-hidden="true"
                            />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: 3D Chess Board Framing + Floating Liquid Glass Pill */}
        <div className="flex flex-col items-center justify-end lg:col-span-5 lg:min-h-[460px]">
          <div className="w-full max-w-md lg:mt-auto">
            <div className="mb-3 flex items-center justify-between px-1 font-mono text-[11px] text-muted">
              <span>3D Ruy Lopez Study</span>
              <span className="text-accent">
                {SEQUENCE_LABELS[chessStep % SEQUENCE_LABELS.length]}
              </span>
            </div>

            <div className="liquid-glass flex flex-wrap items-center justify-between gap-2 rounded-full p-1.5">
              <motion.button
                type="button"
                onClick={stepChessSequence}
                whileTap={tapFeedback}
                transition={productiveFastTransition}
                className="btn-monochrome inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-medium tracking-[-0.01em]"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Step Sequence</span>
              </motion.button>

              <motion.button
                type="button"
                onClick={toggleChessAngle}
                whileTap={tapFeedback}
                transition={productiveFastTransition}
                aria-pressed={chessAngle === 'horizon'}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-hairline)] px-3.5 text-xs font-medium tracking-[-0.01em] text-ink transition-colors duration-150 hover:border-[var(--border-hairline-hover)]"
              >
                <Compass className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                <span>
                  {chessAngle === 'isometric' ? 'Horizon View' : 'Isometric View'}
                </span>
              </motion.button>
            </div>

            {/* Quick profile links to both platforms */}
            <div className="mt-3 flex items-center justify-center gap-4 font-mono text-[11px] text-muted">
              <a
                href={chessCom.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 transition-colors duration-150 hover:text-ink"
              >
                <span>Chess.com</span>
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </a>
              <span aria-hidden="true">·</span>
              <a
                href={lichess.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 transition-colors duration-150 hover:text-ink"
              >
                <span>Lichess</span>
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
