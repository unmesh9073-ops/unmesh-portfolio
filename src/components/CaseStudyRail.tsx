import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  type PointerEvent as ReactPointerEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type CaseStudyCategory,
  profileConfig,
} from '../config/profile.config';
import { useGitHub } from '../context/GitHubContext';
import {
  productiveFastTransition,
  snappySpring,
  tapFeedback,
} from '../lib/motion';
import { playSpatialSwitch, playSpatialTap } from '../lib/spatialAudio';
import { SpatialCard } from './SpatialCard';

type FilterOption = 'All' | CaseStudyCategory;

const FILTER_OPTIONS: ReadonlyArray<FilterOption> = [
  'All',
  'Autonomous',
  'Quant',
  'AI & ML',
  'Systems',
];

interface RailCardEntry {
  slug: string;
  number: string;
  category: CaseStudyCategory;
  title: string;
  summary: string;
  metric: string;
}

export interface CaseStudyRailProps {
  compact?: boolean;
}

export function CaseStudyRail({ compact = false }: CaseStudyRailProps) {
  const navigate = useNavigate();
  const { labRepos } = useGitHub();
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const [isDragging, setIsDragging] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
    moved: 0,
  });

  const allEntries = useMemo<RailCardEntry[]>(() => {
    const curated: RailCardEntry[] = profileConfig.caseStudies.map((cs) => ({
      slug: cs.slug,
      number: cs.number,
      category: cs.category,
      title: cs.title,
      summary: cs.summary,
      metric: cs.metric,
    }));

    const aiLabEntries: RailCardEntry[] = labRepos.slice(0, 3).map((repo, idx) => ({
      slug: encodeURIComponent(repo.name),
      number: String(curated.length + idx + 1).padStart(2, '0'),
      category: 'AI & ML',
      title: repo.displayName,
      summary: repo.description,
      metric: repo.language ?? 'AI / ML Lab',
    }));

    return [...curated, ...aiLabEntries];
  }, [labRepos]);

  const visibleEntries = useMemo(() => {
    if (compact) {
      return allEntries.slice(0, 4);
    }
    if (activeFilter === 'All') {
      return allEntries;
    }
    return allEntries.filter((entry) => entry.category === activeFilter);
  }, [allEntries, activeFilter, compact]);

  const scrollByCard = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    playSpatialTap();
    const step = Math.min(380, el.clientWidth * 0.8);
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const el = trackRef.current;
    if (!el) return;

    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: el.scrollLeft,
      moved: 0,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const el = trackRef.current;
    if (!el) return;

    const deltaX = event.clientX - dragRef.current.startX;
    dragRef.current.moved = Math.max(dragRef.current.moved, Math.abs(deltaX));
    el.scrollLeft = dragRef.current.startScrollLeft - deltaX;
  };

  const endDrag = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setIsDragging(false);
  };

  const handleCardActivate = (slug: string) => {
    if (dragRef.current.moved > 6) {
      dragRef.current.moved = 0;
      return;
    }
    playSpatialSwitch();
    navigate(`/projects/${slug}`);
  };

  return (
    <section
      aria-labelledby={compact ? 'overview-case-studies-heading' : 'projects-case-studies-heading'}
      className={`mx-auto w-full max-w-[1120px] px-6 sm:px-8 lg:px-10 ${
        compact ? 'pt-6 pb-16' : 'pt-8 pb-6'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-accent">
            {compact ? '05 · Engineering Deep Dives' : 'Curated Breakdowns'}
          </p>
          <h2
            id={compact ? 'overview-case-studies-heading' : 'projects-case-studies-heading'}
            className="section-heading mt-1.5 text-ink"
          >
            Featured Case Studies
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {compact ? (
            <motion.button
              type="button"
              onClick={() => {
                playSpatialSwitch();
                navigate('/projects');
              }}
              whileTap={tapFeedback}
              transition={productiveFastTransition}
              className="liquid-glass liquid-glass-interactive inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-4 text-xs font-medium text-ink"
            >
              <span>All Projects</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            </motion.button>
          ) : null}

          <div className="flex items-center gap-1.5">
            <motion.button
              type="button"
              onClick={() => scrollByCard(-1)}
              whileTap={tapFeedback}
              transition={productiveFastTransition}
              aria-label="Previous case studies"
              className="liquid-glass liquid-glass-interactive inline-flex h-10 w-10 min-w-[44px] cursor-pointer items-center justify-center rounded-full text-muted hover:text-ink"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </motion.button>
            <motion.button
              type="button"
              onClick={() => scrollByCard(1)}
              whileTap={tapFeedback}
              transition={productiveFastTransition}
              aria-label="Next case studies"
              className="liquid-glass liquid-glass-interactive inline-flex h-10 w-10 min-w-[44px] cursor-pointer items-center justify-center rounded-full text-muted hover:text-ink"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </motion.button>
          </div>
        </div>
      </div>

      {!compact ? (
        <div
          role="tablist"
          aria-label="Filter case studies by category"
          className="liquid-glass no-scrollbar mt-6 inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full p-1"
        >
          {FILTER_OPTIONS.map((option) => {
            const isSelected = activeFilter === option;
            return (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  playSpatialTap();
                  setActiveFilter(option);
                }}
                className={`relative inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-full px-3.5 text-xs font-medium tracking-[-0.01em] transition-colors duration-150 ${
                  isSelected ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {isSelected ? (
                  <motion.span
                    layoutId="case-study-filter-pill"
                    transition={snappySpring}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full border border-[var(--border-hairline-hover)] bg-[color-mix(in_srgb,var(--text-primary)_10%,transparent)]"
                  />
                ) : null}
                <span className="relative z-10 whitespace-nowrap">{option}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        className={`no-scrollbar mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {visibleEntries.map((entry) => (
          <div
            key={entry.slug}
            className="w-[84vw] max-w-[360px] shrink-0 snap-start sm:w-[340px]"
          >
            <SpatialCard
              onClick={() => handleCardActivate(entry.slug)}
              ariaLabel={`Open case study ${entry.number}: ${entry.title}`}
              className="flex h-full flex-col justify-between p-6"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs tracking-[0.04em] text-accent">
                    {entry.number}
                  </span>
                  <span className="rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface-subtle)] px-2.5 py-0.5 font-mono text-[10px] text-muted">
                    {entry.category}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-semibold tracking-[-0.015em] text-ink">
                  {entry.title}
                </h3>

                <p className="mt-2 line-clamp-2 text-[13px] leading-[1.6] text-muted">
                  {entry.summary}
                </p>
              </div>

              <div className="hairline-divider mt-6 flex items-center justify-between border-t pt-3.5 font-mono text-[11px] text-muted">
                <span className="text-ink">{entry.metric}</span>
                <span className="inline-flex items-center gap-1 transition-colors duration-150 group-hover:text-ink">
                  <span>Read study</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </div>
            </SpatialCard>
          </div>
        ))}
      </div>
    </section>
  );
}
