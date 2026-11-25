import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  GitFork,
  RefreshCw,
  Search,
  Star,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useGitHub } from '../context/GitHubContext';
import { useTheme } from '../context/ThemeContext';
import {
  formatRelativeTime,
  getLanguageDotColor,
  matchesRepoQuery,
} from '../lib/github';
import {
  backdropVariants,
  modalSurfaceVariants,
  productiveFastTransition,
  tapFeedback,
} from '../lib/motion';

export function AllReposModal() {
  const {
    allRepos,
    forkRepos,
    archiveOpen,
    archiveFilter,
    setArchiveFilter,
    closeArchive,
    setSelectedRepo,
    status,
    isRefreshing,
    refresh,
  } = useGitHub();
  const { isDark } = useTheme();

  const [selectedLang, setSelectedLang] = useState<string>('All');
  const [includeForks, setIncludeForks] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleClose = () => {
    setSelectedLang('All');
    closeArchive();
  };

  useEffect(() => {
    if (!archiveOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSelectedLang('All');
        closeArchive();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.cancelAnimationFrame(frame);
      previousFocusRef.current?.focus();
    };
  }, [archiveOpen, closeArchive]);

  const activePool = useMemo(() => {
    if (!includeForks || forkRepos.length === 0) {
      return allRepos;
    }
    return [...allRepos, ...forkRepos].sort(
      (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
    );
  }, [allRepos, forkRepos, includeForks]);

  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    for (const repo of activePool) {
      if (repo.language) {
        langs.add(repo.language);
      }
    }
    return ['All', ...Array.from(langs)];
  }, [activePool]);

  const filteredRepos = useMemo(() => {
    return activePool.filter((repo) => {
      if (selectedLang !== 'All' && repo.language !== selectedLang) {
        return false;
      }
      return matchesRepoQuery(repo, archiveFilter);
    });
  }, [activePool, selectedLang, archiveFilter]);

  return (
    <AnimatePresence>
      {archiveOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archive-modal-title"
        >
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleClose}
            className="fixed inset-0 bg-[var(--scrim-bg)] backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            variants={modalSurfaceVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformOrigin: 'center' }}
            className="liquid-glass relative z-10 flex max-h-[88svh] w-full max-w-[780px] flex-col overflow-hidden overscroll-contain rounded-t-3xl sm:rounded-3xl"
          >
            {/* Header */}
            <div className="hairline-divider flex items-center justify-between gap-4 border-b px-6 py-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2
                  id="archive-modal-title"
                  className="text-base font-semibold tracking-[-0.015em] text-ink"
                >
                  All Repositories
                </h2>
                <span className="rounded-full border border-[var(--border-hairline)] px-2.5 py-0.5 font-mono text-[11px] text-muted">
                  {filteredRepos.length}
                </span>
                <span className="hidden font-mono text-[11px] text-muted sm:inline">
                  {status === 'live' ? 'Synced live from GitHub' : 'Preview catalog'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  onClick={() => {
                    void refresh();
                  }}
                  disabled={isRefreshing}
                  whileTap={tapFeedback}
                  transition={productiveFastTransition}
                  aria-label="Refresh GitHub repositories"
                  className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-hairline)] px-3 font-mono text-[11px] text-muted transition-colors duration-150 hover:border-[var(--border-hairline-hover)] hover:text-ink disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>Sync</span>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={handleClose}
                  whileTap={tapFeedback}
                  transition={productiveFastTransition}
                  aria-label="Close repository explorer"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted transition-colors duration-150 hover:text-ink"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </motion.button>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="hairline-divider space-y-3 border-b px-6 py-4">
              <div className="relative flex items-center">
                <Search
                  className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted"
                  aria-hidden="true"
                />
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="search"
                  value={archiveFilter}
                  onChange={(e) => setArchiveFilter(e.target.value)}
                  placeholder="Search repos, languages, or topics…"
                  aria-label="Search repositories"
                  className="h-10 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] pr-9 pl-10 text-sm text-ink placeholder:text-muted focus:border-[var(--border-hairline-hover)] focus-visible:outline-2 focus-visible:outline-[var(--whisper-accent)] focus-visible:outline-offset-2"
                />
                {archiveFilter ? (
                  <button
                    type="button"
                    onClick={() => setArchiveFilter('')}
                    aria-label="Clear search filter"
                    className="absolute right-2.5 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-muted hover:text-ink"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div
                  className="flex flex-wrap items-center gap-1.5"
                  role="group"
                  aria-label="Filter by language"
                >
                  {availableLanguages.map((lang) => {
                    const isSelected = selectedLang === lang;
                    return (
                      <button
                        key={lang}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedLang(lang)}
                        className={`inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 font-mono text-[11px] transition-colors duration-150 ${
                          isSelected
                            ? 'border-[var(--border-hairline-hover)] bg-[color-mix(in_srgb,var(--text-primary)_10%,transparent)] text-ink'
                            : 'border-[var(--border-hairline)] text-muted hover:text-ink'
                        }`}
                      >
                        {lang !== 'All' ? (
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor: getLanguageDotColor(lang, isDark),
                            }}
                          />
                        ) : null}
                        <span>{lang}</span>
                      </button>
                    );
                  })}
                </div>

                {forkRepos.length > 0 ? (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={includeForks}
                    onClick={() => setIncludeForks((prev) => !prev)}
                    className={`inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 font-mono text-[11px] transition-colors duration-150 ${
                      includeForks
                        ? 'border-[var(--border-hairline-hover)] text-ink'
                        : 'border-[var(--border-hairline)] text-muted hover:text-ink'
                    }`}
                  >
                    <GitFork className="h-3 w-3" aria-hidden="true" />
                    <span>Include forks ({forkRepos.length})</span>
                  </button>
                ) : null}
              </div>
            </div>

            {/* Repository List */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6">
              {filteredRepos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm font-medium text-ink">
                    No matching repositories
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Try clearing your search query or switching language filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setArchiveFilter('');
                      setSelectedLang('All');
                    }}
                    className="mt-4 cursor-pointer rounded-full border border-[var(--border-hairline)] px-4 py-1.5 text-xs font-medium text-ink transition-colors duration-150 hover:border-[var(--border-hairline-hover)]"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-[var(--border-hairline)]">
                  {filteredRepos.map((repo) => (
                    <li key={repo.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          closeArchive();
                          setSelectedRepo(repo);
                        }}
                        onKeyDown={(e) => {
                          if (e.target !== e.currentTarget) return;
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            closeArchive();
                            setSelectedRepo(repo);
                          }
                        }}
                        className="group flex cursor-pointer flex-col justify-between gap-3 rounded-xl px-3 py-4 transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--text-primary)_5%,transparent)] sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold tracking-[-0.01em] text-ink">
                              {repo.displayName}
                            </span>
                            <span className="font-mono text-[11px] text-muted">
                              {repo.name}
                            </span>
                            {repo.isFork ? (
                              <span className="rounded border border-[var(--border-hairline)] px-1.5 py-0.5 font-mono text-[10px] text-muted">
                                fork
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">
                            {repo.description}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-3 font-mono text-[11px] text-muted sm:justify-end">
                          {repo.language ? (
                            <span className="inline-flex items-center gap-1.5 text-ink">
                              <span
                                aria-hidden="true"
                                className="h-1.5 w-1.5 rounded-full"
                                style={{
                                  backgroundColor: getLanguageDotColor(
                                    repo.language,
                                    isDark,
                                  ),
                                }}
                              />
                              {repo.language}
                            </span>
                          ) : null}

                          {repo.stargazersCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-ink">
                              <Star className="h-3 w-3 text-accent" aria-hidden="true" />
                              {repo.stargazersCount}
                            </span>
                          ) : null}

                          <span>{formatRelativeTime(repo.updatedAt)}</span>

                          <a
                            href={repo.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Open ${repo.displayName} on GitHub`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-hairline)] text-muted transition-colors duration-150 hover:border-[var(--border-hairline-hover)] hover:text-ink"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </a>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
