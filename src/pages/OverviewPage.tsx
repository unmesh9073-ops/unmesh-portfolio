import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CaseStudyRail } from '../components/CaseStudyRail';
import { SpatialCard } from '../components/SpatialCard';
import { profileConfig } from '../config/profile.config';
import { playSpatialSwitch } from '../lib/spatialAudio';
import { Hero } from '../sections/Hero';

export function OverviewPage() {
  const navigate = useNavigate();
  const { corePillars } = profileConfig;

  const handlePillarClick = (route: string) => {
    playSpatialSwitch();
    navigate(route);
  };

  return (
    <div className="pb-24">
      <Hero />

      <section
        aria-labelledby="pillars-heading"
        className="mx-auto w-full max-w-[1120px] px-6 pt-4 pb-10 sm:px-8 lg:px-10"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-accent">
              01 – 04 · Spatial Architecture
            </p>
            <h2 id="pillars-heading" className="section-heading mt-1.5 text-ink">
              Core Pillars
            </h2>
          </div>
          <p className="max-w-[44ch] text-sm leading-relaxed text-muted">
            Select any pillar to fly the 3D spatial camera directly into its dedicated workspace.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {corePillars.map((pillar) => (
            <SpatialCard
              key={pillar.number}
              onClick={() => handlePillarClick(pillar.route)}
              ariaLabel={`${pillar.number} ${pillar.title} — ${pillar.targetLabel}`}
              className="flex flex-col justify-between p-6"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs tracking-[0.04em] text-accent">
                    {pillar.number}
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink"
                    aria-hidden="true"
                  />
                </div>

                <h3 className="mt-5 text-base font-semibold tracking-[-0.015em] text-ink">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.6] text-muted">
                  {pillar.subtitle}
                </p>
              </div>

              <div className="hairline-divider mt-6 border-t pt-3.5 font-mono text-[11px] text-muted transition-colors duration-150 group-hover:text-ink">
                {pillar.targetLabel}
              </div>
            </SpatialCard>
          ))}
        </div>
      </section>

      <CaseStudyRail compact />
    </div>
  );
}
