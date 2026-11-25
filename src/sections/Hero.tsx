import { motion } from 'framer-motion';
import { NeuralVolumeStage } from '../components/NeuralVolumeStage';
import { profileConfig } from '../config/profile.config';
import { useTheme } from '../context/ThemeContext';
import {
  heroStaggerContainer,
  heroStaggerItem,
  productiveFastTransition,
  tapFeedback,
} from '../lib/motion';

export function Hero() {
  const { theme } = useTheme();
  const { identity } = profileConfig;

  return (
    <section
      id="top"
      aria-labelledby="hero-headline"
      className="mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-[1120px] items-center px-6 py-10 sm:px-8 lg:px-10 lg:py-14"
    >
      <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-12">
        {/* Left column: renders immediately with zero blocking splash screen */}
        <motion.div
          variants={heroStaggerContainer}
          initial="hidden"
          animate="visible"
          className="lg:col-span-6"
        >
          <motion.p
            variants={heroStaggerItem}
            className="font-mono text-xs tracking-[0.015em] text-muted sm:text-[13px]"
          >
            {identity.role} · {identity.institution}
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
              href="#work"
              whileTap={tapFeedback}
              transition={productiveFastTransition}
              className="btn-monochrome inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium tracking-[-0.01em]"
            >
              Selected Work
            </motion.a>

            <motion.a
              href="#lab"
              whileTap={tapFeedback}
              transition={productiveFastTransition}
              className="liquid-glass liquid-glass-interactive inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium tracking-[-0.01em] text-ink"
            >
              AI/ML Lab
            </motion.a>
          </motion.div>
        </motion.div>

        {/* Right column: dedicated 3D Volume placeholder ready for R3F drop-in */}
        <motion.div
          initial={{ opacity: 1, transform: 'scale(0.985) translateY(6px)' }}
          animate={{ opacity: 1, transform: 'scale(1) translateY(0px)' }}
          transition={{ type: 'spring', stiffness: 160, damping: 24, delay: 0.06 }}
          className="lg:col-span-6"
        >
          <NeuralVolumeStage
            theme={theme}
            statusLabel="3D Neural Volume · Ready"
          />
        </motion.div>
      </div>
    </section>
  );
}
