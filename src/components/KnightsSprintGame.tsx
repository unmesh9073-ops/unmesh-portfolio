import { motion, useReducedMotion } from 'framer-motion';
import { Play, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  productiveFastTransition,
  snappySpring,
  tapFeedback,
} from '../lib/motion';
import {
  playSpatialModal,
  playSpatialSwitch,
  playSpatialTap,
} from '../lib/spatialAudio';

const BOARD_SIZE = 6;
const SPRINT_SECONDS = 30;
const BEST_SCORE_KEY = 'unmesh-knights-sprint-best:v1';

interface Coord {
  r: number;
  c: number;
}

const KNIGHT_DELTAS: ReadonlyArray<Coord> = [
  { r: -2, c: -1 },
  { r: -2, c: 1 },
  { r: -1, c: -2 },
  { r: -1, c: 2 },
  { r: 1, c: -2 },
  { r: 1, c: 2 },
  { r: 2, c: -1 },
  { r: 2, c: 1 },
];

function isInside(r: number, c: number): boolean {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

function getLegalMoves(pos: Coord): Coord[] {
  return KNIGHT_DELTAS.map((d) => ({ r: pos.r + d.r, c: pos.c + d.c })).filter(
    (p) => isInside(p.r, p.c),
  );
}

function shortestKnightDistance(start: Coord, target: Coord): number {
  if (start.r === target.r && start.c === target.c) return 0;
  const visited = Array.from({ length: BOARD_SIZE }, () =>
    Array<boolean>(BOARD_SIZE).fill(false),
  );
  const queue: Array<{ pos: Coord; dist: number }> = [{ pos: start, dist: 0 }];
  visited[start.r][start.c] = true;

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const next of getLegalMoves(current.pos)) {
      if (next.r === target.r && next.c === target.c) {
        return current.dist + 1;
      }
      if (!visited[next.r][next.c]) {
        visited[next.r][next.c] = true;
        queue.push({ pos: next, dist: current.dist + 1 });
      }
    }
  }
  return 1;
}

function pickRandomTarget(exclude: Coord): Coord {
  const candidates: Coord[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (r !== exclude.r || c !== exclude.c) {
        candidates.push({ r, c });
      }
    }
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function readBestScore(): number {
  try {
    const raw = window.localStorage.getItem(BEST_SCORE_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export function KnightsSprintGame() {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [timeLeft, setTimeLeft] = useState(SPRINT_SECONDS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => readBestScore());
  const [knight, setKnight] = useState<Coord>({ r: 2, c: 2 });
  const [target, setTarget] = useState<Coord>({ r: 0, c: 1 });
  const [movesForTarget, setMovesForTarget] = useState(0);
  const [optimalForTarget, setOptimalForTarget] = useState(1);
  const timerRef = useRef<number | null>(null);

  const legalMoves = useMemo(() => getLegalMoves(knight), [knight]);

  const legalSet = useMemo(() => {
    const set = new Set<string>();
    for (const m of legalMoves) {
      set.add(`${m.r}-${m.c}`);
    }
    return set;
  }, [legalMoves]);

  useEffect(() => {
    if (phase !== 'playing') {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setPhase('finished');
          playSpatialModal(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase]);

  const startSprint = useCallback(() => {
    const startKnight: Coord = { r: 2, c: 2 };
    const nextTarget = pickRandomTarget(startKnight);
    setKnight(startKnight);
    setTarget(nextTarget);
    setOptimalForTarget(shortestKnightDistance(startKnight, nextTarget));
    setMovesForTarget(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(SPRINT_SECONDS);
    setPhase('playing');
    playSpatialSwitch();
  }, []);

  const handleSquareClick = useCallback(
    (r: number, c: number) => {
      if (phase !== 'playing') return;
      if (!legalSet.has(`${r}-${c}`)) return;

      const nextPos: Coord = { r, c };
      const nextMoves = movesForTarget + 1;
      setKnight(nextPos);

      if (r === target.r && c === target.c) {
        const isOptimal = nextMoves <= optimalForTarget;
        const nextStreak = isOptimal ? streak + 1 : 0;
        const gained = 10 + (isOptimal ? nextStreak * 2 : 0);
        const nextScore = score + gained;

        setScore(nextScore);
        setStreak(nextStreak);
        if (nextScore > bestScore) {
          setBestScore(nextScore);
          try {
            window.localStorage.setItem(BEST_SCORE_KEY, String(nextScore));
          } catch {
            // ignore storage errors
          }
        }

        const nextTarget = pickRandomTarget(nextPos);
        setTarget(nextTarget);
        setOptimalForTarget(shortestKnightDistance(nextPos, nextTarget));
        setMovesForTarget(0);
        playSpatialSwitch();
      } else {
        setMovesForTarget(nextMoves);
        playSpatialTap();
      }
    },
    [
      bestScore,
      legalSet,
      movesForTarget,
      optimalForTarget,
      phase,
      score,
      streak,
      target.c,
      target.r,
    ],
  );

  return (
    <div className="liquid-glass mx-auto w-full max-w-[420px] rounded-3xl p-4 sm:p-6">
      {/* Live HUD */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface-elevated)] px-2 py-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Time
          </p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-ink">
            {timeLeft}s
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface-elevated)] px-2 py-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Score
          </p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-ink">
            {score}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface-elevated)] px-2 py-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Streak
          </p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-accent">
            {streak}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface-elevated)] px-2 py-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Best
          </p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-ink">
            {bestScore}
          </p>
        </div>
      </div>

      {/* 6x6 Board */}
      <div
        role="grid"
        aria-label="Knight's Sprint 6 by 6 chessboard"
        className="mt-4 grid grid-cols-6 gap-1.5 rounded-2xl border border-[var(--border-hairline)] p-2"
      >
        {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, idx) => {
          const r = Math.floor(idx / BOARD_SIZE);
          const c = idx % BOARD_SIZE;
          const isDark = (r + c) % 2 === 1;
          const isKnight = knight.r === r && knight.c === c;
          const isTarget = target.r === r && target.c === c;
          const isLegal = phase === 'playing' && legalSet.has(`${r}-${c}`);

          return (
            <button
              key={`${r}-${c}`}
              type="button"
              onClick={() => handleSquareClick(r, c)}
              disabled={phase !== 'playing' || !isLegal}
              aria-label={`Square ${r + 1},${c + 1}${isKnight ? ' Knight' : ''}${isTarget ? ' Target' : ''}${isLegal ? ' Legal move' : ''}`}
              className={`relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl transition-colors ${
                isDark
                  ? 'bg-[var(--bg-surface-elevated)]'
                  : 'bg-transparent border border-[var(--border-hairline)]'
              } ${
                isLegal
                  ? 'cursor-pointer ring-1 ring-accent/60 hover:bg-accent/15'
                  : 'cursor-default'
              }`}
            >
              {isTarget && !isKnight ? (
                <span
                  className="h-3.5 w-3.5 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]"
                  aria-hidden="true"
                />
              ) : null}

              {isLegal && !isTarget ? (
                <span
                  className="h-2.5 w-2.5 rounded-full border border-accent/70"
                  aria-hidden="true"
                />
              ) : null}

              {isKnight ? (
                <motion.span
                  layoutId={shouldReduceMotion ? undefined : 'knights-sprint-piece'}
                  transition={shouldReduceMotion ? { duration: 0 } : snappySpring}
                  className="select-none text-xl leading-none text-ink sm:text-2xl"
                >
                  ♞
                </motion.span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <motion.button
          type="button"
          onClick={startSprint}
          whileTap={tapFeedback}
          transition={productiveFastTransition}
          className="btn-monochrome inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-5 text-xs font-medium"
        >
          {phase === 'idle' ? (
            <>
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Start Sprint</span>
            </>
          ) : (
            <>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Play Again</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
