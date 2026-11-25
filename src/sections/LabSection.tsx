import { ArrowUpRight } from 'lucide-react';
import { SpatialCard } from '../components/SpatialCard';
import { profileConfig } from '../config/profile.config';
import { useGitHub } from '../context/GitHubContext';
import { useTheme } from '../context/ThemeContext';
import { formatRelativeTime, getLanguageDotColor } from '../lib/github';

function LabSkeletonList() {
  return (
    <div className="mt-10 space-y-3" aria-hidden="true">
      {[0, 1, 2].map((idx) => (
        <div
          key={idx}
          className="quiet-surface animate-pulse rounded-2xl p-6 sm:p-7"
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
            <div className="space-y-2.5 lg:col-span-4">
              <div className="h-3 w-28 rounded-full bg-[var(--border-hairline)]" />
              <div className="h-5 w-44 rounded-lg bg-[var(--border-hairline)]" />
            </div>
            <div className="space-y-2 lg:col-span-5">
              <div className="h-4 w-full rounded bg-[var(--border-hairline)]" />
              <div className="h-4 w-4/5 rounded bg-[var(--border-hairline)]" />
            </div>
            <div className="flex gap-2 lg:col-span-3 lg:justify-end">
              <div className="h-5 w-16 rounded-full bg-[var(--border-hairline)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LabSection() {
  const { githubSync } = profileConfig;
  const { labRepos, status, setSelectedRepo, openArchiveWithFilter } = useGitHub();
  const { isDark } = useTheme();

  return (
    <section
      id="lab"
      aria-labelledby="lab-heading"
      className="mx-auto w-full max-w-[1120px] scroll-mt-24 px-6 py-20 sm:px-8 lg:px-10 lg:py-24"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="lab-heading" className="section-heading text-ink">
            Current AI/ML Lab
          </h2>
          <p className="mt-2 max-w-[54ch] text-[15px] leading-relaxed text-muted">
            Experimental prototypes, optimization notebooks, and spatial machine learning studies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-muted">
          {githubSync.labTopics.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => openArchiveWithFilter(topic)}
              className="cursor-pointer rounded-full border border-[var(--border-hairline)] px-2.5 py-0.5 transition-colors duration-150 hover:border-[var(--border-hairline-hover)] hover:text-ink"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {status === 'loading' ? (
        <LabSkeletonList />
      ) : labRepos.length === 0 ? (
        <div className="quiet-surface mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:p-7">
          <div>
            <p className="text-sm font-medium text-ink">
              No AI/ML Lab repositories tagged yet
            </p>
            <p className="mt-1 text-[13px] text-muted">
              Tag any non-featured GitHub repository with{' '}
              <span className="font-mono text-ink">ai-ml</span>,{' '}
              <span className="font-mono text-ink">lab</span>, or{' '}
              <span className="font-mono text-ink">ml</span> to surface it here.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openArchiveWithFilter('')}
            className="cursor-pointer rounded-full border border-[var(--border-hairline)] px-4 py-2 text-xs font-medium text-ink transition-colors duration-150 hover:border-[var(--border-hairline-hover)]"
          >
            Browse All Repositories
          </button>
        </div>
      ) : (
        <div className="mt-10 space-y-3">
          {labRepos.map((repo, index) => {
            const labNumber = String(index + 1).padStart(2, '0');
            const primaryTopic =
              repo.topics.find((t) => githubSync.labTopics.includes(t)) ??
              repo.topics[0] ??
              'lab';

            return (
              <SpatialCard
                key={repo.id}
                onClick={() => setSelectedRepo(repo)}
                ariaLabel={`Inspect LAB ${labNumber}: ${repo.displayName}`}
                className="p-6 sm:p-7"
              >
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center lg:gap-8">
                  <div className="lg:col-span-4">
                    <div className="flex items-center gap-2.5 font-mono text-xs">
                      <span className="inline-flex items-center gap-1.5 text-ink">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                        LAB {labNumber}
                      </span>
                      <span className="text-muted">·</span>
                      <span className="rounded-md border border-[var(--border-hairline)] px-2 py-0.5 text-[11px] text-muted">
                        {primaryTopic}
                      </span>
                    </div>

                    <h3 className="mt-2.5 text-base font-semibold tracking-[-0.015em] text-ink sm:text-lg">
                      {repo.displayName}
                    </h3>
                  </div>

                  <p className="line-clamp-2 text-[15px] leading-[1.6] text-muted lg:col-span-5">
                    {repo.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-muted lg:col-span-3 lg:justify-end">
                    <div className="flex items-center gap-3">
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
                      <span>{formatRelativeTime(repo.updatedAt)}</span>
                    </div>

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
              </SpatialCard>
            );
          })}
        </div>
      )}
    </section>
  );
}
