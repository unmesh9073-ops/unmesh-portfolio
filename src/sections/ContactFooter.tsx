import { AnimatePresence, motion } from 'framer-motion';
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
import { productiveFastTransition, tapFeedback } from '../lib/motion';

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
  const [copied, setCopied] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  const showResumeAction = modules.showResume && links.resumeUrl.trim().length > 0;
  const hasEmbed = featuredPost.embedUrl.trim().length > 0;
  const postTargetUrl = featuredPost.postUrl.trim() || links.linkedinUrl;

  useEffect(() => {
    if (!postModalOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPostModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [postModalOpen]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

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
      <div className="hairline-divider border-t pt-14">
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

            {/* Right Column: WorldQuant BRAIN Gold Showcase + Profile Highlights */}
            <div className="space-y-4 lg:col-span-5">
              {/* WorldQuant BRAIN Gold Certificate Card */}
              <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface-subtle)] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.04em] text-accent">
                    <Award className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Credential · WorldQuant BRAIN</span>
                  </span>
                  <span className="rounded-full border border-[var(--border-hairline)] px-2.5 py-0.5 font-mono text-[10px] text-ink">
                    Gold Tier
                  </span>
                </div>

                <h3 className="mt-3 text-base font-semibold tracking-[-0.015em] text-ink">
                  {featuredPost.title}
                </h3>
                <p className="mt-1 font-mono text-[11px] text-muted">
                  {featuredPost.subtitle}
                </p>
                <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
                  {featuredPost.summary}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {hasEmbed ? (
                    <motion.button
                      type="button"
                      onClick={() => setPostModalOpen(true)}
                      whileTap={tapFeedback}
                      transition={productiveFastTransition}
                      className="btn-monochrome inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-medium"
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
                    className="quiet-surface quiet-surface-interactive inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium text-ink"
                  >
                    <span>Open on LinkedIn</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </motion.a>
                </div>
              </div>

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
      </div>

      {/* Liquid Glass LinkedIn Post Preview Modal */}
      <AnimatePresence>
        {postModalOpen && hasEmbed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={productiveFastTransition}
            role="dialog"
            aria-modal="true"
            aria-labelledby="linkedin-post-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--scrim-bg)] p-4 backdrop-blur-sm"
            onClick={() => setPostModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, transform: 'scale(0.96) translateY(8px)' }}
              animate={{ opacity: 1, transform: 'scale(1) translateY(0px)' }}
              exit={{ opacity: 0, transform: 'scale(0.97) translateY(4px)' }}
              transition={productiveFastTransition}
              onClick={(e) => e.stopPropagation()}
              className="liquid-glass w-full max-w-[580px] rounded-3xl p-5 sm:p-6"
            >
              <div className="flex items-center justify-between gap-3 pb-4">
                <div>
                  <h3
                    id="linkedin-post-modal-title"
                    className="text-sm font-semibold text-ink"
                  >
                    {featuredPost.title}
                  </h3>
                  <p className="mt-0.5 font-mono text-[11px] text-muted">
                    {featuredPost.subtitle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPostModalOpen(false)}
                  aria-label="Close LinkedIn post preview"
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--border-hairline)] text-muted transition-colors duration-150 hover:border-[var(--border-hairline-hover)] hover:text-ink"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mx-auto w-full max-w-[540px] overflow-hidden rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
                <iframe
                  src={featuredPost.embedUrl}
                  title="WorldQuant BRAIN Gold Level Certificate — LinkedIn Post"
                  loading="lazy"
                  allowFullScreen
                  className="h-[460px] w-full border-0"
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-[11px] text-muted">
                  If an ad blocker hides the embed, open directly on LinkedIn.
                </p>
                <a
                  href={postTargetUrl}
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
