import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KnightsSprintGame } from '../components/KnightsSprintGame';
import { productiveFastTransition, tapFeedback } from '../lib/motion';
import { playSpatialSwitch } from '../lib/spatialAudio';

export interface NotFoundPageProps {
  isGameRoute?: boolean;
}

export function NotFoundPage({ isGameRoute = false }: NotFoundPageProps) {
  const navigate = useNavigate();

  return (
    <section
      aria-labelledby="not-found-heading"
      className="mx-auto flex min-h-[calc(100svh-12rem)] w-full max-w-[1120px] flex-col items-center justify-center px-5 pb-28 pt-10 sm:px-8 lg:px-10"
    >
      <div className="mb-6 text-center">
        <p className="font-mono text-xs tracking-[0.06em] text-muted">
          {isGameRoute
            ? 'SPATIAL MINI-GAME · 6×6 TACTICAL SPRINT'
            : '404 · Spatial Coordinate Not Found'}
        </p>
        <h1 id="not-found-heading" className="section-heading mt-2 text-ink">
          Knight&apos;s Sprint
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Capture as many glowing targets as possible in 30 seconds using legal L-shaped Knight leaps.
        </p>
      </div>

      <KnightsSprintGame />

      <motion.button
        type="button"
        onClick={() => {
          playSpatialSwitch();
          navigate('/');
        }}
        whileTap={tapFeedback}
        transition={productiveFastTransition}
        className="liquid-glass liquid-glass-interactive mt-6 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-5 text-xs font-medium text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Return to Overview</span>
      </motion.button>
    </section>
  );
}
