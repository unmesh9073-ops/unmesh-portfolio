import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, X } from 'lucide-react';
import { useEffect } from 'react';
import { profileConfig } from '../config/profile.config';
import { productiveFastTransition } from '../lib/motion';
import { playSpatialModal } from '../lib/spatialAudio';

export interface LinkedInPostModalProps {
  open: boolean;
  onClose: () => void;
}

export function LinkedInPostModal({ open, onClose }: LinkedInPostModalProps) {
  const { links, featuredPost } = profileConfig;
  const hasEmbed = featuredPost.embedUrl.trim().length > 0;
  const postTargetUrl = featuredPost.postUrl.trim() || links.linkedinUrl;

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        playSpatialModal(false);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const handleClose = () => {
    playSpatialModal(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && hasEmbed ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={productiveFastTransition}
          role="dialog"
          aria-modal="true"
          aria-labelledby="linkedin-post-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--scrim-bg)] p-4 backdrop-blur-sm"
          onClick={handleClose}
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
                onClick={handleClose}
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
  );
}
