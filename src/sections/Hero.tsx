import { motion } from 'framer-motion';
import { NeuralControlsPill } from '../components/NeuralControlsPill';
import { profileConfig } from '../config/profile.config';
import { useSpatialWorld } from '../context/useSpatialWorld';
import {
  heroStaggerContainer,
  heroStaggerItem,
  productiveFastTransition,
  tapFeedback,
} from '../lib/motion';

export function Hero() {
  const { identity, links } = profileConfig;
  const { neuralMode, setNeuralMode, triggerPulse } = useSpatialWorld();

  return (
    <section
      id="top"
      aria-labelledby="hero-headline"
      className="relative mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-[1120px] items-center px-6 pt-8 pb-24 sm:px-8 lg:px-10 lg:py-14"
    >
      <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-12">
        {/* Left column: renders immediately with subtle radial scrim for crisp contrast */}
        <motion.div
          variants={heroStaggerContainer}
          initial="hidden"
          animate="visible"
          className="relative lg:col-span-6"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-8 -z-10 rounded-full opacity-90 blur-2xl"
            style={{
              background:
                'radial-gradient(ellipse at 40% 50%, var(--bg-canvas) 35%, transparent 80%)',
            }}
          />

          <motion.p
            variants={heroStaggerItem}
            className="font-mono text-xs tracking-[0.015em] text-muted sm:text-[13px]"
          >
            {identity.role} ·{' '}
            <a
              href={links.newtonSchoolUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-[var(--border-hairline-hover)] underline-offset-4 transition-colors duration-150 hover:text-ink"
            >
              {identity.institution}
            </a>
          </motion.p>

          <motion.h1
            id="hero-headline"
            variants={heroStaggerItem}
            className="display-headline mt-4 text-ink"
          >
            {identity.headline}
          </motion.h1>

          <motion.p
            variants={heroStaggerItem}
            className="mt-5 max-w-[28ch] text-xl font-medium leading-[1.32] tracking-[-0.015em] text-ink sm:text-[22px]"
          >
            {identity.tagline}
          </motion.p>

          <motion.p
            variants={heroStaggerItem}
            className="mt-4 max-w-[48ch] text-[15px] leading-[1.6] text-muted sm:text-base"
          >
            {identity.bio}
          </motion.p>

          <motion.div
            variants={heroStaggerItem}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <motion.a
              href="#sih"
              whileTap={tapFeedback}
              transition={productiveFastTransition}
              className="btn-monochrome inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium tracking-[-0.01em]"
            >
              SIH 2026 Flagship
            </motion.a>

            <motion.a
              href="#work"
              whileTap={tapFeedback}
              transition={productiveFastTransition}
              className="liquid-glass liquid-glass-interactive inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium tracking-[-0.01em] text-ink"
            >
              Selected Work
            </motion.a>
          </motion.div>
        </motion.div>

        {/* Right column: open spatial stage framing the full-viewport 3D Neural Volume */}
        <motion.div
          initial={{ opacity: 0, transform: 'scale(0.985) translateY(6px)' }}
          animate={{ opacity: 1, transform: 'scale(1) translateY(0px)' }}
          transition={{ type: 'spring', stiffness: 160, damping: 24, delay: 0.06 }}
          className="relative flex min-h-[240px] flex-col items-center justify-end lg:col-span-6 lg:min-h-[480px]"
        >
          {/* Clickable spatial pulse hit area over the 3D Neural Volume */}
          <button
            type="button"
            onClick={() => triggerPulse([0, 0, 0])}
            aria-label="Trigger neural volume signal pulse"
            className="absolute inset-0 cursor-pointer rounded-3xl bg-transparent focus-visible:outline-2"
          />

          <div className="relative z-10 flex w-full justify-center pb-2">
            <NeuralControlsPill
              mode={neuralMode}
              onModeChange={setNeuralMode}
              onTriggerPulse={() => triggerPulse([0, 0, 0])}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
