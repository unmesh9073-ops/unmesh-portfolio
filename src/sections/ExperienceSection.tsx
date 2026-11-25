import { profileConfig } from '../config/profile.config';

export function ExperienceSection() {
  if (!profileConfig.modules.showExperience) {
    return null;
  }

  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="mx-auto w-full max-w-[1120px] scroll-mt-24 px-6 py-20 sm:px-8 lg:px-10 lg:py-24"
    >
      <div>
        <h2 id="experience-heading" className="section-heading text-ink">
          Experience
        </h2>
        <p className="mt-2 max-w-[54ch] text-[15px] leading-relaxed text-muted">
          Engineering internships, research collaborations, and teaching roles.
        </p>
      </div>

      {profileConfig.experience.length === 0 ? (
        <div className="quiet-surface mt-8 rounded-2xl p-6 text-sm text-muted">
          Add entries to <code className="font-mono text-ink">profileConfig.experience</code> in{' '}
          <code className="font-mono text-ink">src/config/profile.config.ts</code> to populate this timeline.
        </div>
      ) : (
        <div className="quiet-surface mt-10 divide-y divide-[var(--border-hairline)] rounded-2xl">
          {profileConfig.experience.map((item) => (
            <article
              key={item.id}
              className="grid grid-cols-1 gap-4 p-6 sm:p-7 md:grid-cols-12 md:gap-8"
            >
              <div className="md:col-span-4">
                <p className="font-mono text-xs text-muted">{item.period}</p>
                {item.location && (
                  <p className="mt-1 font-mono text-xs text-muted">{item.location}</p>
                )}
              </div>

              <div className="md:col-span-8">
                <h3 className="text-base font-semibold tracking-[-0.015em] text-ink sm:text-lg">
                  {item.role} · <span className="text-muted font-medium">{item.organization}</span>
                </h3>
                <p className="mt-2 text-[15px] leading-[1.6] text-muted">
                  {item.summary}
                </p>
                {item.highlights && item.highlights.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-sm text-muted">
                    {item.highlights.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
