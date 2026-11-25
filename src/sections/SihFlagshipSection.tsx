import { motion } from 'framer-motion';
import { Plus, Radar, RotateCcw } from 'lucide-react';
import { SpatialCard } from '../components/SpatialCard';
import { profileConfig } from '../config/profile.config';
import { useSpatialWorld } from '../context/useSpatialWorld';
import { productiveFastTransition, tapFeedback } from '../lib/motion';

export function SihFlagshipSection() {
  const { flagshipProject } = profileConfig;
  const {
    obstacleSeed,
    injectObstacle,
    resetObstacles,
    sensorView,
    toggleSensorView,
  } = useSpatialWorld();

  const activeInjected = obstacleSeed === 0 ? 0 : ((obstacleSeed - 1) % 3) + 1;

  return (
    <section
      id="sih"
      aria-labelledby="sih-heading"
      className="relative mx-auto w-full max-w-[1120px] scroll-mt-24 px-6 py-20 sm:px-8 lg:px-10 lg:py-28"
    >
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left/Main Content Column with crisp legibility over the 3D road simulation */}
        <div className="lg:col-span-7">
          <div className="quiet-surface rounded-3xl p-6 sm:p-8 lg:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface-subtle)] px-3 py-1 font-mono text-[11px] tracking-[0.02em] text-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                {flagshipProject.badge}
              </span>

              <span className="font-mono text-[11px] text-muted">
                {flagshipProject.status}
              </span>
            </div>

            <h2
              id="sih-heading"
              className="section-heading mt-5 text-ink"
            >
              {flagshipProject.title}
            </h2>

            <p className="mt-2 text-base font-medium tracking-[-0.01em] text-accent sm:text-[17px]">
              {flagshipProject.subtitle}
            </p>

            <p className="mt-4 max-w-[58ch] text-[15px] leading-[1.65] text-muted">
              {flagshipProject.summary}
            </p>

            {/* 4 Technical Pillars */}
            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {flagshipProject.highlights.map((pillar) => (
                <SpatialCard
                  key={pillar.title}
                  className="bg-[var(--bg-surface-subtle)] p-4 sm:p-5"
                >
                  <h3 className="text-sm font-semibold tracking-[-0.01em] text-ink">
                    {pillar.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-[1.55] text-muted">
                    {pillar.detail}
                  </p>
                </SpatialCard>
              ))}
            </div>

            {/* Stack tags */}
            <div className="hairline-divider mt-7 flex flex-wrap items-center gap-1.5 border-t pt-5">
              {flagshipProject.stack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-[var(--border-hairline)] px-2.5 py-0.5 font-mono text-[11px] text-muted"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive 3D Simulation Viewport Framing + Liquid Glass Controls */}
        <div className="flex flex-col items-center justify-end lg:col-span-5 lg:min-h-[460px]">
          <div className="w-full max-w-md lg:mt-auto">
            <div className="mb-3 flex items-center justify-between px-1 font-mono text-[11px] text-muted">
              <span>3D Trajectory Simulation</span>
              <span className="text-accent">
                {activeInjected > 0
                  ? `${activeInjected} injected ${activeInjected === 1 ? 'hazard' : 'hazards'}`
                  : 'nominal corridor'}
              </span>
            </div>

            <div className="liquid-glass flex flex-wrap items-center justify-between gap-2 rounded-full p-1.5">
              <div className="flex items-center gap-1">
                <motion.button
                  type="button"
                  onClick={injectObstacle}
                  whileTap={tapFeedback}
                  transition={productiveFastTransition}
                  className="btn-monochrome inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-medium tracking-[-0.01em]"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Inject Obstacle</span>
                </motion.button>

                {activeInjected > 0 ? (
                  <motion.button
                    type="button"
                    onClick={resetObstacles}
                    whileTap={tapFeedback}
                    transition={productiveFastTransition}
                    aria-label="Reset injected obstacles"
                    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--border-hairline)] text-muted transition-colors duration-150 hover:border-[var(--border-hairline-hover)] hover:text-ink"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  </motion.button>
                ) : null}
              </div>

              <motion.button
                type="button"
                onClick={toggleSensorView}
                whileTap={tapFeedback}
                transition={productiveFastTransition}
                aria-pressed={sensorView}
                className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium tracking-[-0.01em] transition-colors duration-150 ${
                  sensorView
                    ? 'border-[var(--border-hairline-hover)] bg-[color-mix(in_srgb,var(--text-primary)_10%,transparent)] text-ink'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                <Radar className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                <span>Sensor View</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
