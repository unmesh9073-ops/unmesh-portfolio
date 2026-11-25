import { motion } from 'framer-motion';
import { ArrowUpRight, FolderGit2, Globe, Star } from 'lucide-react';
import { SpatialCard } from '../components/SpatialCard';
import { useGitHub } from '../context/GitHubContext';
import { useSpatialWorld } from '../context/useSpatialWorld';
import { useTheme } from '../context/ThemeContext';
import { formatRelativeTime, getLanguageDotColor } from '../lib/github';
import { productiveFastTransition, tapFeedback } from '../lib/motion';

function GitHubIcon({ className = '' }: { className?: string }) {
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

function WorkSkeletonGrid() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2" aria-hidden="true">
      {[0, 1, 2].map((idx) => (
        <div
          key={idx}
          className={`quiet-surface animate-pulse rounded-2xl p-6 sm:p-7 ${
            idx === 0 ? 'md:col-span-2' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 rounded-full bg-[var(--border-hairline)]" />
            <div className="h-3 w-20 rounded-full bg-[var(--border-hairline)]" />
          </div>
          <div className="mt-5 h-6 w-48 rounded-lg bg-[var(--border-hairline)]" />
          <div className="mt-3 h-4 w-full max-w-[46ch] rounded bg-[var(--border-hairline)]" />
          <div className="mt-2 h-4 w-2/3 max-w-[32ch] rounded bg-[var(--border-hairline)]" />
          <div className="mt-7 flex gap-2">
            <div className="h-5 w-16 rounded-full bg-[var(--border-hairline)]" />
            <div className="h-5 w-20 rounded-full bg-[var(--border-hairline)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function WorkSection() {
  const {
    featuredRepos,
    allRepos,
    status,
    statusReason,
    setSelectedRepo,
    openArchiveWithFilter,
  } = useGitHub();
  const { isDark } = useTheme();
  const { interactionRef } = useSpatialWorld();

  const statusLabel =
    status === 'live'
      ? 'Synced live from GitHub'
      : statusReason === 'unconfigured'
        ? 'Preview catalog · Connect GitHub in profile.config.ts'
        : statusReason === 'empty'
          ? 'Preview catalog · Add public repos in GitHub'
          : 'Preview catalog · GitHub offline or rate-limited';

  const useBentoLead = featuredRepos.length >= 3;

  return (
    <section
      id="work"
      aria-labelledby="work-heading"
      className="mx-auto w-full max-w-[1120px] scroll-mt-24 px-6 py-20 sm:px-8 lg:px-10 lg:py-24"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="work-heading" className="section-heading text-ink">
            Featured Builds
          </h2>
          <p className="mt-2 max-w-[54ch] text-[15px] leading-relaxed text-muted">
            Selected software and systems builds, automatically organized from public repositories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border-hairline)] px-3 py-1.5 font-mono text-[11px] text-muted">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                status === 'live'
                  ? 'bg-accent'
                  : 'border border-[var(--whisper-accent)] bg-transparent'
              }`}
              aria-hidden="true"
            />
            {statusLabel}
          </span>

          <motion.button
            type="button"
            onClick={() => openArchiveWithFilter('')}
            whileTap={tapFeedback}
            transition={productiveFastTransition}
            className="liquid-glass liquid-glass-interactive inline-flex h-9 cursor-pointer items-center gap-2 rounded-full px-3.5 text-xs font-medium text-ink"
          >
            <FolderGit2 className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <span>All Repositories ({allRepos.length})</span>
          </motion.button>
        </div>
      </div>

      {status === 'loading' ? (
        <WorkSkeletonGrid />
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {featuredRepos.map((repo, index) => {
            const isLead = useBentoLead && index === 0;
            const visibleTopics = repo.topics.slice(0, 3);

            return (
              <SpatialCard
                key={repo.id}
                onClick={() => setSelectedRepo(repo)}
                onPointerEnter={() => {
                  interactionRef.current.hoveredWorkIndex = index;
                }}
                onPointerLeave={() => {
                  interactionRef.current.hoveredWorkIndex = -1;
                }}
                ariaLabel={`Inspect ${repo.displayName} repository details`}
                className={`p-6 sm:p-7 ${isLead ? 'md:col-span-2' : ''}`}
              >
                <div
                  className={`flex h-full flex-col justify-between gap-6 ${
                    isLead ? 'md:flex-row md:items-end md:gap-10' : ''
                  }`}
                >
                  <div className={isLead ? 'max-w-[58ch] flex-1' : ''}>
                    <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-muted">
                      <div className="flex items-center gap-2">
                        {repo.language ? (
                          <span className="inline-flex items-center gap-1.5 text-ink">
                            <span
                              aria-hidden="true"
                              className="h-2 w-2 rounded-full"
                              style={{
                                backgroundColor: getLanguageDotColor(
                                  repo.language,
                                  isDark,
                                ),
                              }}
                            />
                            {repo.language}
                          </span>
                        ) : (
                          <span>System</span>
                        )}
                        <span>·</span>
                        <span>{formatRelativeTime(repo.updatedAt)}</span>
                      </div>

                      {repo.stargazersCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-ink">
                          <Star className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                          {repo.stargazersCount}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-4 text-lg font-semibold tracking-[-0.015em] text-ink sm:text-xl">
                      {repo.displayName}
                    </h3>

                    <p className="mt-2.5 line-clamp-2 text-[15px] leading-[1.6] text-muted">
                      {repo.description}
                    </p>
                  </div>

                  <div
                    className={`flex flex-wrap items-center justify-between gap-3 ${
                      isLead
                        ? 'md:shrink-0 md:flex-col md:items-end'
                        : 'hairline-divider border-t pt-4'
                    }`}
                  >
                    {visibleTopics.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {visibleTopics.map((topic) => (
                          <span
                            key={topic}
                            className="rounded-full border border-[var(--border-hairline)] px-2.5 py-0.5 font-mono text-[11px] text-muted"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span />
                    )}

                    <div className="flex items-center gap-2">
                      {repo.homepage ? (
                        <a
                          href={repo.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Open live demo for ${repo.displayName}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-hairline)] text-muted transition-colors duration-150 hover:border-[var(--border-hairline-hover)] hover:text-ink"
                        >
                          <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      ) : null}

                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Open ${repo.displayName} on GitHub`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--border-hairline)] px-3 text-xs font-medium text-ink transition-colors duration-150 hover:border-[var(--border-hairline-hover)]"
                      >
                        <GitHubIcon className="h-3.5 w-3.5 text-muted" />
                        <span>GitHub</span>
                        <ArrowUpRight className="h-3 w-3 text-muted" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>
              </SpatialCard>
            );
          })}
        </div>
      )}
    </section>
  );
}
