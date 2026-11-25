import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, GitFork, Globe, Star, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useGitHub } from '../context/GitHubContext';
import { useTheme } from '../context/ThemeContext';
import {
  formatRelativeTime,
  getLanguageDotColor,
} from '../lib/github';
import {
  backdropVariants,
  modalSurfaceVariants,
  productiveFastTransition,
  tapFeedback,
} from '../lib/motion';

function GitHubMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const CATEGORY_LABELS = {
  featured: 'Featured Build',
  lab: 'AI/ML Lab',
  archive: 'Repository',
} as const;

export function ProjectDetailSheet() {
  const { selectedRepo, setSelectedRepo, openArchiveWithFilter } = useGitHub();
  const { isDark } = useTheme();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!selectedRepo) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSelectedRepo(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const frame = window.requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.cancelAnimationFrame(frame);
      previousFocusRef.current?.focus();
    };
  }, [selectedRepo, setSelectedRepo]);

  const handleTopicJump = (topic: string) => {
    setSelectedRepo(null);
    openArchiveWithFilter(topic);
  };

  return (
    <AnimatePresence>
      {selectedRepo ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="repo-detail-title"
        >
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setSelectedRepo(null)}
            className="fixed inset-0 bg-[var(--scrim-bg)] backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            variants={modalSurfaceVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformOrigin: 'center' }}
            className="liquid-glass relative z-10 w-full max-w-[600px] overflow-hidden overscroll-contain rounded-t-3xl sm:rounded-3xl"
          >
            {/* Header */}
            <div className="hairline-divider flex items-center justify-between border-b px-6 py-4">
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted">
                <span className="inline-flex items-center gap-1.5 text-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  {CATEGORY_LABELS[selectedRepo.category]}
                </span>
                <span>·</span>
                <span>
                  {selectedRepo.source === 'fallback'
                    ? 'Preview catalog'
                    : 'Synced from GitHub'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden rounded-md border border-[var(--border-hairline)] px-2 py-0.5 font-mono text-[11px] text-muted sm:inline-flex">
                  ESC
                </span>
                <motion.button
                  ref={closeBtnRef}
                  type="button"
                  onClick={() => setSelectedRepo(null)}
                  whileTap={tapFeedback}
                  transition={productiveFastTransition}
                  aria-label="Close project detail sheet"
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted transition-colors duration-150 hover:text-ink"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </motion.button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6 sm:px-7 sm:py-7">
              <p className="font-mono text-xs text-muted">{selectedRepo.name}</p>
              <h2
                id="repo-detail-title"
                className="mt-1.5 text-2xl font-semibold tracking-[-0.025em] text-ink"
              >
                {selectedRepo.displayName}
              </h2>

              <p className="mt-4 text-[15px] leading-[1.65] text-muted">
                {selectedRepo.description}
              </p>

              {/* Metadata row */}
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5 font-mono text-xs text-muted">
                {selectedRepo.language ? (
                  <span className="inline-flex items-center gap-2 text-ink">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: getLanguageDotColor(
                          selectedRepo.language,
                          isDark,
                        ),
                      }}
                    />
                    {selectedRepo.language}
                  </span>
                ) : null}

                <span>{formatRelativeTime(selectedRepo.updatedAt)}</span>

                {selectedRepo.stargazersCount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-ink">
                    <Star className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    {selectedRepo.stargazersCount}
                  </span>
                ) : null}

                {selectedRepo.forksCount > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <GitFork className="h-3.5 w-3.5" aria-hidden="true" />
                    {selectedRepo.forksCount}
                  </span>
                ) : null}
              </div>

              {/* Topics */}
              {selectedRepo.topics.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {selectedRepo.topics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleTopicJump(topic)}
                      className="cursor-pointer rounded-full border border-[var(--border-hairline)] px-2.5 py-1 font-mono text-[11px] text-muted transition-colors duration-150 hover:border-[var(--border-hairline-hover)] hover:text-ink"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              ) : null}

              {/* Footer actions */}
              <div className="hairline-divider mt-7 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <motion.a
                    href={selectedRepo.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileTap={tapFeedback}
                    transition={productiveFastTransition}
                    className="btn-monochrome inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium"
                  >
                    <GitHubMark className="h-4 w-4" />
                    <span>View on GitHub</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </motion.a>

                  {selectedRepo.homepage ? (
                    <motion.a
                      href={selectedRepo.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileTap={tapFeedback}
                      transition={productiveFastTransition}
                      className="liquid-glass liquid-glass-interactive inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink"
                    >
                      <Globe className="h-4 w-4 text-muted" aria-hidden="true" />
                      <span>Live Demo</span>
                    </motion.a>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRepo(null);
                    openArchiveWithFilter('');
                  }}
                  className="cursor-pointer text-xs font-medium text-muted transition-colors duration-150 hover:text-ink"
                >
                  All Repositories
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
