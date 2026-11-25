import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  Award,
  Check,
  Crown,
  Eye,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SpatialCard } from '../components/SpatialCard';
import { profileConfig } from '../config/profile.config';
import { useChess } from '../context/useChess';
import { useSpatialWorld } from '../context/useSpatialWorld';
import { copyTextToClipboard } from '../lib/clipboard';
import {
  PRODUCTIVE_EASE,
  productiveFastTransition,
  tapFeedback,
} from '../lib/motion';

function GitHubGlyph({ className = '' }: { className?: string }) {
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

function LinkedInGlyph({ className = '' }: { className?: string }) {
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
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export interface ContactFooterProps {
  onCopyEmail: (email: string) => void;
}

export function ContactFooter({ onCopyEmail }: ContactFooterProps) {
  const { identity, links, linkedin, featuredPost, modules } = profileConfig;
  const { chessCom, lichess } = useChess();
  const { interactionRef } = useSpatialWorld();
  const shouldReduceMotion = useReducedMotion();

  const [copied, setCopied] = useState(false);
  const [postPreviewOpen, setPostPreviewOpen] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  const showResumeAction = modules.showResume && links.resumeUrl.trim().length > 0;
  const hasEmbedUrl = featuredPost.embedUrl.trim().length > 0;
  const postHref = featuredPost.postUrl.trim() || links.linkedinUrl;

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!postPreviewOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPostPreviewOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [postPreviewOpen]);

  const handleCopyEmail = async () => {
    const ok = await copyTextToClipboard(links.email);
    if (ok) {
      setCopied(true);
      onCopyEmail(links.email);
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
      resetTimerRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 2200);
    }
  };

  return (
    <footer
      id="contact"
      aria-labelledby="contact-heading"
      className="mx-auto w-full max-w-[1120px] scroll-mt-24 px-6 pt-12 pb-32 sm:px-8 lg:px-10"
    >
      <div className="hairline-divider space-y-5 border-t pt-14">
        {/* Spatial LinkedIn Identity Hub */}
        <SpatialCard
          onPointerEnter={() => {
            interactionRef.current.hoveredContactHub = true;
          }}
          onPointerLeave={() => {
            interactionRef.current.hoveredContactHub = false;
          }}
          className="rounded-3xl p-6 sm:p-8 lg:p-10"
        >
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface-subtle)] px-3 py-1 font-mono text-[11px] text-ink">
                  <LinkedInGlyph className="h-3.5 w-3.5 text-accent" />
                  <span>LinkedIn Identity Hub</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted">
                  <MapPin className="h-3 w-3 text-accent" aria-hidden="true" />
                  {linkedin.location}
                </span>
              </div>

              <h2
                id="contact-heading"
                className="section-heading mt-4 text-ink"
              >
                {identity.name}
              </h2>

              <p className="mt-2 text-base font-medium leading-snug text-ink sm:text-[17px]">
                {linkedin.headline}
              </p>

              <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted">
                <GraduationCap className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span>{linkedin.education}</span>
              </p>

              {/* Open-to chips */}
              <div className="mt-5 flex flex-wrap gap-2">
                {linkedin.openTo.map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface-subtle)] px-3 py-1 font-mono text-[11px] text-ink"
                  >
                    {role}
                  </span>
                ))}
              </div>

              {/* Primary CTA + Quick-Connect Row */}
              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                <motion.a
                  href={linkedin.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileTap={tapFeedback}
                  transition={productiveFastTransition}
                  className="btn-monochrome inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium"
                >
                  <LinkedInGlyph className="h-4 w-4" />
                  <span>Connect on LinkedIn</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </motion.a>

                <motion.a
                  href={links.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileTap={tapFeedback}
                  transition={productiveFastTransition}
                  className="quiet-surface quiet-surface-interactive inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink"
                >
                  <GitHubGlyph className="h-4 w-4 text-muted" />
                  <span>GitHub</span>
                </motion.a>

                <motion.a
                  href={links.newtonSchoolUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileTap={tapFeedback}
                  transition={productiveFastTransition}
                  className="quiet-surface quiet-surface-interactive inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink"
                >
                  <GraduationCap className="h-4 w-4 text-muted" aria-hidden="true" />
                  <span>Newton School</span>
                </motion.a>

                <motion.a
                  href={chessCom.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileTap={tapFeedback}
                  transition={productiveFastTransition}
                  className="quiet-surface quiet-surface-interactive inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink"
                >
                  <Crown className="h-4 w-4 text-muted" aria-hidden="true" />
                  <span>Chess.com</span>
                </motion.a>

                <motion.a
                  href={lichess.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileTap={tapFeedback}
                  transition={productiveFastTransition}
                  className="quiet-surface quiet-surface-interactive inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink"
                >
                  <Crown className="h-4 w-4 text-muted" aria-hidden="true" />
                  <span>Lichess</span>
                </motion.a>

                {showResumeAction && (
                  <motion.a
                    href={links.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileTap={tapFeedback}
                    transition={productiveFastTransition}
                    className="quiet-surface quiet-surface-interactive inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink"
                  >
                    <FileText className="h-4 w-4 text-muted" aria-hidden="true" />
                    <span>Resume</span>
                  </motion.a>
                )}

                <motion.button
                  type="button"
                  onClick={handleCopyEmail}
                  whileTap={tapFeedback}
                  transition={productiveFastTransition}
                  aria-label={`Copy email address ${links.email}`}
                  className="quiet-surface quiet-surface-interactive inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-medium text-ink"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {copied ? (
                      <motion.span
                        key="copied"
                        initial={{ opacity: 0, transform: 'scale(0.85)' }}
                        animate={{ opacity: 1, transform: 'scale(1)' }}
                        exit={{ opacity: 0, transform: 'scale(0.85)' }}
                        transition={productiveFastTransition}
                        className="inline-flex items-center"
                      >
                        <Check className="h-4 w-4 text-accent" aria-hidden="true" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="mail"
                        initial={{ opacity: 0, transform: 'scale(0.85)' }}
                        animate={{ opacity: 1, transform: 'scale(1)' }}
                        exit={{ opacity: 0, transform: 'scale(0.85)' }}
                        transition={productiveFastTransition}
                        className="inline-flex items-center"
                      >
                        <Mail className="h-4 w-4 text-muted" aria-hidden="true" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span>{copied ? 'Email Copied' : links.email}</span>
                </motion.button>
              </div>
            </div>

            {/* Right Column: 3 Concise Proof-Point Highlights */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface-subtle)] p-5 sm:p-6">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.05em] text-muted">
                  Profile Highlights
                </h3>
                <ul className="mt-4 space-y-3.5">
                  {linkedin.highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed text-ink">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </SpatialCard>

        {/* Quant Researcher · WorldQuant BRAIN Gold Credential Card */}
        <SpatialCard
          onPointerEnter={() => {
            interactionRef.current.hoveredContactHub = true;
          }}
          onPointerLeave={() => {
            interactionRef.current.hoveredContactHub = false;
          }}
          className="rounded-3xl p-6 sm:p-7"
        >
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-[62ch]">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,#D6C29F_35%,var(--border-hairline))] bg-[color-mix(in_srgb,#D6C29F_8%,var(--bg-surface-subtle))] px-3 py-1 font-mono text-[11px] text-ink">
                  <Award className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  <span>Quant Researcher · {featuredPost.subtitle}</span>
                </span>
              </div>

              <h3 className="mt-3.5 text-lg font-semibold tracking-[-0.015em] text-ink sm:text-xl">
                {featuredPost.title}
              </h3>

              <p className="mt-2 text-[15px] leading-[1.6] text-muted">
                {featuredPost.summary}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              {hasEmbedUrl ? (
                <motion.button
                  type="button"
                  onClick={() => setPostPreviewOpen(true)}
                  whileTap={tapFeedback}
                  transition={productiveFastTransition}
                  className="btn-monochrome inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-xs font-medium sm:text-sm"
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Preview LinkedIn Post</span>
                </motion.button>
              ) : null}

              <motion.a
                href={postHref}
                target="_blank"
                rel="noopener noreferrer"
                whileTap={tapFeedback}
                transition={productiveFastTransition}
                className="quiet-surface quiet-surface-interactive inline-flex h-10 items-center gap-2 rounded-full px-4 text-xs font-medium text-ink sm:text-sm"
              >
                <LinkedInGlyph className="h-3.5 w-3.5 text-muted" />
                <span>Open on LinkedIn</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              </motion.a>
            </div>
          </div>
        </SpatialCard>
      </div>

      {/* Liquid Glass LinkedIn Post Preview Modal */}
      <AnimatePresence>
        {postPreviewOpen && hasEmbedUrl ? (
          <motion.div
            key="linkedin-post-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.08 : 0.18, ease: PRODUCTIVE_EASE }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--scrim-bg)] p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="linkedin-post-modal-title"
            onClick={() => setPostPreviewOpen(false)}
          >
            <motion.div
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, transform: 'scale(0.96) translateY(8px)' }
              }
              animate={{ opacity: 1, transform: 'scale(1) translateY(0px)' }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, transform: 'scale(0.97) translateY(6px)' }
              }
              transition={{ duration: 0.2, ease: PRODUCTIVE_EASE }}
              onClick={(e) => e.stopPropagation()}
              className="liquid-glass w-full max-w-[580px] rounded-3xl p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] text-accent">
                    {featuredPost.subtitle}
                  </p>
                  <h3
                    id="linkedin-post-modal-title"
                    className="mt-1 text-base font-semibold tracking-[-0.015em] text-ink"
                  >
                    {featuredPost.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setPostPreviewOpen(false)}
                  aria-label="Close LinkedIn post preview"
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--border-hairline)] text-muted transition-colors duration-150 hover:border-[var(--border-hairline-hover)] hover:text-ink"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mx-auto mt-4 w-full max-w-[540px] overflow-hidden rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
                <iframe
                  src={featuredPost.embedUrl}
                  loading="lazy"
                  height="500"
                  width="540"
                  title={featuredPost.title}
                  allowFullScreen
                  className="block h-[420px] w-full border-0 sm:h-[500px]"
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-[11px] text-muted">
                  If an ad blocker hides the embed, open directly on LinkedIn.
                </p>

                <a
                  href={postHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-monochrome inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-medium"
                >
                  <span>Open on LinkedIn</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </footer>
  );
}
