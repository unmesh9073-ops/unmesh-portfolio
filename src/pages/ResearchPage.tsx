import { motion } from 'framer-motion';
import { ArrowUpRight, Award, Eye } from 'lucide-react';
import { useState } from 'react';
import { LinkedInPostModal } from '../components/LinkedInPostModal';
import { SpatialCard } from '../components/SpatialCard';
import { profileConfig } from '../config/profile.config';
import { productiveFastTransition, tapFeedback } from '../lib/motion';
import { playSpatialModal } from '../lib/spatialAudio';
import { ExperienceSection } from '../sections/ExperienceSection';
import { FoundationsSection } from '../sections/FoundationsSection';
import { LabSection } from '../sections/LabSection';
import { NotesSection } from '../sections/NotesSection';

export function ResearchPage() {
  const { featuredPost, links } = profileConfig;
  const [postModalOpen, setPostModalOpen] = useState(false);

  const hasEmbed = featuredPost.embedUrl.trim().length > 0;
  const postTargetUrl = featuredPost.postUrl.trim() || links.linkedinUrl;

  return (
    <div className="pt-4 pb-28">
      {/* Headlined by Quantitative Researcher · WorldQuant BRAIN — Gold Level Certificate */}
      <section
        aria-labelledby="research-credential-heading"
        className="mx-auto w-full max-w-[1120px] px-6 pt-8 pb-6 sm:px-8 lg:px-10"
      >
        <SpatialCard className="p-6 sm:p-8 lg:p-9">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center lg:gap-10">
            <div className="max-w-[62ch]">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface-subtle)] px-3 py-1 font-mono text-[11px] text-accent">
                  <Award className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Quantitative Researcher · WorldQuant BRAIN</span>
                </span>
                <span className="rounded-full border border-[var(--border-hairline)] px-2.5 py-0.5 font-mono text-[11px] text-ink">
                  Gold Tier · 10,000+ Points
                </span>
              </div>

              <h1
                id="research-credential-heading"
                className="section-heading mt-4 text-ink"
              >
                {featuredPost.title}
              </h1>

              <p className="mt-2.5 text-[15px] leading-[1.65] text-muted">
                {featuredPost.summary}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              {hasEmbed ? (
                <motion.button
                  type="button"
                  onClick={() => {
                    playSpatialModal(true);
                    setPostModalOpen(true);
                  }}
                  whileTap={tapFeedback}
                  transition={productiveFastTransition}
                  className="btn-monochrome inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-5 text-xs font-medium tracking-[-0.01em]"
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Preview LinkedIn Post</span>
                </motion.button>
              ) : null}

              <motion.a
                href={postTargetUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileTap={tapFeedback}
                transition={productiveFastTransition}
                className="liquid-glass liquid-glass-interactive inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-xs font-medium tracking-[-0.01em] text-ink"
              >
                <span>Open on LinkedIn</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </motion.a>
            </div>
          </div>
        </SpatialCard>
      </section>

      <LabSection />
      <FoundationsSection />
      <ExperienceSection />
      <NotesSection />

      <LinkedInPostModal
        open={postModalOpen}
        onClose={() => setPostModalOpen(false)}
      />
    </div>
  );
}
