import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SpatialCard } from '../components/SpatialCard';
import { profileConfig } from '../config/profile.config';
import { useGitHub } from '../context/GitHubContext';
import {
  productiveFastTransition,
  spatialSpring,
  tapFeedback,
} from '../lib/motion';
import { playSpatialSwitch, playSpatialTap } from '../lib/spatialAudio';

interface EditorialSection {
  number: string;
  title: string;
  body: string;
}

export function CaseStudyDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { allRepos } = useGitHub();

  const decodedSlug = useMemo(() => {
    try {
      return decodeURIComponent(slug);
    } catch {
      return slug;
    }
  }, [slug]);

  const curatedIndex = useMemo(
    () => profileConfig.caseStudies.findIndex((cs) => cs.slug === decodedSlug),
    [decodedSlug],
  );
  const curatedStudy = curatedIndex >= 0 ? profileConfig.caseStudies[curatedIndex] : null;

  const matchedRepo = useMemo(() => {
    if (curatedStudy) return null;
    return allRepos.find((r) => r.name === decodedSlug) ?? null;
  }, [allRepos, curatedStudy, decodedSlug]);

  const nextStudy = useMemo(() => {
    const studies = profileConfig.caseStudies;
    if (studies.length === 0) return null;
    if (curatedIndex >= 0) {
      return studies[(curatedIndex + 1) % studies.length];
    }
    return studies[0];
  }, [curatedIndex]);

  const sections: EditorialSection[] = useMemo(() => {
    if (curatedStudy) {
      return [
        { number: '01', title: 'Challenge', body: curatedStudy.challenge },
        { number: '02', title: 'Architecture', body: curatedStudy.architecture },
        { number: '03', title: 'Impact', body: curatedStudy.impact },
      ];
    }
    if (matchedRepo) {
      const topicsText =
        matchedRepo.topics.length > 0
          ? matchedRepo.topics.join(', ')
          : 'Core engineering implementation';
      const updatedDate = new Date(matchedRepo.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      return [
        {
          number: '01',
          title: 'Overview',
          body:
            matchedRepo.description ||
            `${matchedRepo.displayName} is an active engineering repository maintained by ${profileConfig.identity.name}.`,
        },
        {
          number: '02',
          title: 'Technical Stack',
          body: `Primary runtime: ${matchedRepo.language ?? 'Multi-language'}. Key domains & topics: ${topicsText}.`,
        },
        {
          number: '03',
          title: 'Repository Telemetry',
          body: `${matchedRepo.stargazersCount} stars · ${matchedRepo.forksCount} forks · Last pushed ${updatedDate}.`,
        },
      ];
    }
    return [];
  }, [curatedStudy, matchedRepo]);

  if (!curatedStudy && !matchedRepo) {
    return (
      <section className="mx-auto max-w-4xl px-5 pb-28 pt-10 md:px-10 md:pt-14">
        <div className="quiet-surface rounded-3xl p-8 text-center md:p-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            Case Study Not Found
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            No case study found for &ldquo;{decodedSlug}&rdquo;
          </h1>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => {
                playSpatialTap();
                navigate('/projects');
              }}
              className="btn-monochrome inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back to Projects</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  const numberLabel = curatedStudy ? curatedStudy.number : 'GH';
  const categoryLabel = curatedStudy
    ? curatedStudy.category
    : matchedRepo?.language ?? 'Repository';
  const title = curatedStudy ? curatedStudy.title : matchedRepo!.displayName;
  const subtitle = curatedStudy
    ? curatedStudy.subtitle
    : matchedRepo!.description || 'Live GitHub Repository Case Study';
  const stack = curatedStudy
    ? curatedStudy.stack
    : [
        ...(matchedRepo?.language ? [matchedRepo.language] : []),
        ...(matchedRepo?.topics.slice(0, 6) ?? []),
      ];

  return (
    <article className="mx-auto max-w-4xl px-5 pb-28 pt-8 md:px-10 md:pt-12">
      {/* Floating visionOS back control */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <motion.button
          type="button"
          onClick={() => {
            playSpatialTap();
            navigate('/projects');
          }}
          whileTap={tapFeedback}
          transition={productiveFastTransition}
          className="liquid-glass liquid-glass-interactive inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-xs font-medium text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
          <span>Back to Projects</span>
        </motion.button>

        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          CASE STUDY {numberLabel} · {categoryLabel}
        </span>
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spatialSpring}
        className="quiet-surface rounded-3xl p-7 md:p-10"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
            CASE STUDY {numberLabel}
          </span>
          <span className="font-mono text-[11px] text-muted">
            {curatedStudy ? `${curatedStudy.role} · ${curatedStudy.year}` : profileConfig.identity.name}
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
          {subtitle}
        </p>

        {stack.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {stack.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-[var(--border-hairline)] px-2.5 py-1 font-mono text-[11px] text-muted"
              >
                {tech}
              </span>
            ))}
          </div>
        ) : null}

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {curatedStudy?.primaryAction ? (
            curatedStudy.primaryAction.to ? (
              <Link
                to={curatedStudy.primaryAction.to}
                onClick={() => playSpatialSwitch()}
                className="btn-monochrome inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium"
              >
                <span>{curatedStudy.primaryAction.label}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : curatedStudy.primaryAction.href ? (
              <a
                href={curatedStudy.primaryAction.href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-monochrome inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium"
              >
                <span>{curatedStudy.primaryAction.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : null
          ) : null}

          {curatedStudy?.secondaryAction?.href ? (
            <a
              href={curatedStudy.secondaryAction.href}
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass liquid-glass-interactive inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink"
            >
              <span>{curatedStudy.secondaryAction.label}</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
            </a>
          ) : null}

          {matchedRepo ? (
            <>
              <a
                href={matchedRepo.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-monochrome inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium"
              >
                <span>View on GitHub</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              {matchedRepo.homepage ? (
                <a
                  href={matchedRepo.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="liquid-glass liquid-glass-interactive inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink"
                >
                  <span>Live Demo</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                </a>
              ) : null}
            </>
          ) : null}
        </div>
      </motion.header>

      {/* Editorial sections */}
      <div className="mt-6 grid gap-5">
        {sections.map((section) => (
          <section
            key={section.number}
            className="quiet-surface rounded-3xl p-6 md:p-8"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-accent">{section.number}</span>
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                {section.title}
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      {/* Next Case Study footer card */}
      {nextStudy ? (
        <div className="mt-8">
          <SpatialCard className="quiet-surface rounded-3xl transition-colors hover:border-[var(--border-hairline-hover)]">
            <button
              type="button"
              onClick={() => {
                playSpatialSwitch();
                navigate(`/projects/${nextStudy.slug}`);
              }}
              className="w-full cursor-pointer p-6 text-left md:p-8"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                    Next Case Study →
                  </p>
                  <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-ink md:text-xl">
                    {nextStudy.number} · {nextStudy.title}
                  </h3>
                </div>
                <span className="liquid-glass inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </button>
          </SpatialCard>
        </div>
      ) : null}
    </article>
  );
}
