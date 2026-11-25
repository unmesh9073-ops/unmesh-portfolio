import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { profileConfig } from '../config/profile.config';
import { useGitHub } from '../context/GitHubContext';
import { productiveFastTransition, tapFeedback } from '../lib/motion';

export function FoundationsSection() {
  const { skills } = profileConfig;
  const { getSkillRepoCount, openArchiveWithFilter } = useGitHub();

  return (
    <section
      id="foundations"
      aria-labelledby="foundations-heading"
      className="mx-auto w-full max-w-[1120px] scroll-mt-24 px-6 py-20 sm:px-8 lg:px-10 lg:py-24"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="foundations-heading" className="section-heading text-ink">
            Current Stack &amp; Foundations
          </h2>
          <p className="mt-2 max-w-[54ch] text-[15px] leading-relaxed text-muted">
            Core tools practiced daily alongside theoretical tracks under active study. Select any foundation to filter matching repositories.
          </p>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {skills.map((group) => {
          const isExploring = group.mode === 'exploring';
          return (
            <div
              key={group.id}
              className="quiet-surface flex flex-col rounded-2xl p-6 sm:p-7"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold tracking-[-0.015em] text-ink">
                  {group.track}
                </h3>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted">
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 rounded-full ${
                      isExploring
                        ? 'border border-[var(--whisper-accent)] bg-transparent'
                        : 'bg-accent'
                    }`}
                  />
                  {isExploring ? 'exploring' : 'active'}
                </span>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-muted">
                {group.subtitle}
              </p>

              <ul className="mt-6 divide-y divide-[var(--border-hairline)] border-t border-[var(--border-hairline)]">
                {group.items.map((skill) => {
                  const repoCount = getSkillRepoCount(skill.name);
                  return (
                    <li key={skill.name} className="py-1.5 first:pt-2.5 last:pb-0">
                      <motion.button
                        type="button"
                        onClick={() => openArchiveWithFilter(skill.name)}
                        whileTap={tapFeedback}
                        transition={productiveFastTransition}
                        aria-label={`Filter repositories by ${skill.name}${
                          repoCount > 0 ? ` (${repoCount} matching)` : ''
                        }`}
                        className="group flex w-full cursor-pointer items-start justify-between gap-3 rounded-xl px-2 py-2.5 text-left transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--text-primary)_4%,transparent)]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[15px] font-medium text-ink">
                              {skill.name}
                            </span>
                            {repoCount > 0 ? (
                              <span className="shrink-0 whitespace-nowrap rounded-full border border-[var(--border-hairline)] px-2 py-0.5 font-mono text-[10px] text-muted transition-colors duration-150 group-hover:border-[var(--border-hairline-hover)] group-hover:text-ink">
                                {repoCount} {repoCount === 1 ? 'repo' : 'repos'}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-[13px] leading-relaxed text-muted">
                            {skill.focus}
                          </p>
                        </div>

                        <ArrowUpRight
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                          aria-hidden="true"
                        />
                      </motion.button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
