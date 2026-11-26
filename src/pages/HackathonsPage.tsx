import { profileConfig } from '../config/profile.config';
import { SihFlagshipSection } from '../sections/SihFlagshipSection';

export function HackathonsPage() {
  const additionalHackathons = profileConfig.hackathons.filter(
    (item) => item.id !== profileConfig.flagshipProject.id,
  );

  return (
    <div className="pt-2 pb-28">
      <SihFlagshipSection />

      {additionalHackathons.length > 0 ? (
        <section
          aria-label="Additional hackathon builds"
          className="mx-auto w-full max-w-[1120px] px-6 pt-4 pb-12 sm:px-8 lg:px-10"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {additionalHackathons.map((item) => (
              <article
                key={item.id}
                className="quiet-surface rounded-2xl p-6 sm:p-7"
              >
                <span className="font-mono text-[11px] text-accent">
                  {item.badge}
                </span>
                <h2 className="mt-2 text-lg font-semibold tracking-[-0.015em] text-ink">
                  {item.title}
                </h2>
                <p className="mt-1 text-sm text-muted">{item.subtitle}</p>
                <p className="mt-3 text-[14px] leading-[1.6] text-muted">
                  {item.summary}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
