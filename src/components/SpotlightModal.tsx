import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDownRight,
  Compass,
  Copy,
  Crown,
  ExternalLink,
  FileText,
  FlaskConical,
  FolderGit2,
  Layers,
  Mail,
  Moon,
  RefreshCw,
  Route,
  Search,
  Sun,
  X,
} from 'lucide-react';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { profileConfig } from '../config/profile.config';
import { useChess } from '../context/useChess';
import { useGitHub } from '../context/GitHubContext';
import { useTheme } from '../context/ThemeContext';
import { copyTextToClipboard } from '../lib/clipboard';
import {
  getLanguageDotColor,
  matchesRepoQuery,
  type PortfolioRepo,
} from '../lib/github';
import { PRODUCTIVE_EASE } from '../lib/motion';
import { playSpatialSwitch } from '../lib/spatialAudio';

export interface SpotlightModalProps {
  open: boolean;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

type CommandGroupKey = 'repos' | 'navigate' | 'actions';

type CommandPayload =
  | { kind: 'repo'; repo: PortfolioRepo }
  | { kind: 'nav'; path: string }
  | { kind: 'archive' }
  | { kind: 'theme' }
  | { kind: 'copyEmail' }
  | { kind: 'refresh' }
  | { kind: 'refreshChess' }
  | { kind: 'external'; url: string };

interface SpotlightCommand {
  id: string;
  group: CommandGroupKey;
  title: string;
  subtitle?: string;
  badge?: string;
  dotColor?: string;
  icon?: ReactNode;
  keywords?: string;
  payload: CommandPayload;
}

const CATEGORY_TAG: Record<PortfolioRepo['category'], string> = {
  featured: 'Featured',
  lab: 'Lab',
  archive: 'Repo',
};

export function SpotlightModal({
  open,
  onClose,
  onShowToast,
}: SpotlightModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <SpotlightDialogContent
          key="spotlight-dialog"
          onClose={onClose}
          onShowToast={onShowToast}
        />
      ) : null}
    </AnimatePresence>
  );
}

function SpotlightDialogContent({
  onClose,
  onShowToast,
}: Omit<SpotlightModalProps, 'open'>) {
  const {
    featuredRepos,
    allRepos,
    status,
    setSelectedRepo,
    openArchiveWithFilter,
    refresh,
  } = useGitHub();
  const { isDark, toggleTheme } = useTheme();
  const {
    chessCom,
    lichess,
    topOverallRating,
    refresh: refreshChess,
  } = useChess();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const skipRestoreFocusRef = useRef(false);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pendingEnterCommandRef = useRef<SpotlightCommand | null>(null);

  const closeModal = useCallback(
    (openingAnotherModal = false) => {
      skipRestoreFocusRef.current = openingAnotherModal;
      onClose();
    },
    [onClose],
  );

  useEffect(() => {
    skipRestoreFocusRef.current = false;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal(false);
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown);
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      if (!skipRestoreFocusRef.current) {
        previousFocusRef.current?.focus();
      }
    };
  }, [closeModal]);

  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();

  const repoCommands = useMemo<SpotlightCommand[]>(() => {
    let sourceRepos: PortfolioRepo[];
    if (!trimmedQuery) {
      const merged: PortfolioRepo[] = [];
      const seen = new Set<string | number>();
      for (const repo of [...featuredRepos, ...allRepos]) {
        if (!seen.has(repo.id)) {
          seen.add(repo.id);
          merged.push(repo);
          if (merged.length >= 3) break;
        }
      }
      sourceRepos = merged;
    } else {
      sourceRepos = allRepos.filter((repo) =>
        matchesRepoQuery(repo, trimmedQuery),
      );
    }

    return sourceRepos.map((repo) => ({
      id: `spotlight-repo-${repo.id}`,
      group: 'repos',
      title: repo.displayName,
      subtitle: repo.language ?? 'System',
      badge: CATEGORY_TAG[repo.category],
      dotColor: getLanguageDotColor(repo.language, isDark),
      payload: { kind: 'repo', repo },
    }));
  }, [trimmedQuery, featuredRepos, allRepos, isDark]);

  const navigateCommands = useMemo<SpotlightCommand[]>(() => {
    const base: SpotlightCommand[] = [
      {
        id: 'spotlight-nav-overview',
        group: 'navigate',
        title: 'Overview',
        subtitle: 'Hero, Neural Volume & 01–04 Core Pillars',
        icon: <Compass className="h-4 w-4 text-muted" aria-hidden="true" />,
        keywords: 'home hero overview top neural volume pillars',
        payload: { kind: 'nav', path: '/' },
      },
      {
        id: 'spotlight-nav-projects',
        group: 'navigate',
        title: 'Projects',
        subtitle: 'Live GitHub showcase & Architectural Monoliths',
        icon: <Layers className="h-4 w-4 text-muted" aria-hidden="true" />,
        keywords: 'work featured builds projects github repos',
        payload: { kind: 'nav', path: '/projects' },
      },
      {
        id: 'spotlight-nav-hackathons',
        group: 'navigate',
        title: 'Hackathons · SIH 2026',
        subtitle: 'Adaptive Path Planning & 3D LiDAR Simulator',
        icon: <Route className="h-4 w-4 text-muted" aria-hidden="true" />,
        keywords: 'sih 2026 problem statement 37 autonomous vehicle path planning collision avoidance hackathons',
        payload: { kind: 'nav', path: '/hackathons' },
      },
      {
        id: 'spotlight-nav-research',
        group: 'navigate',
        title: 'Research & Lab',
        subtitle: 'WorldQuant BRAIN Gold, AI/ML Lab & Foundations',
        icon: <FlaskConical className="h-4 w-4 text-muted" aria-hidden="true" />,
        keywords: 'research worldquant brain gold lab ai ml foundations stack python cpp',
        payload: { kind: 'nav', path: '/research' },
      },
      {
        id: 'spotlight-nav-interests',
        group: 'navigate',
        title: 'Interests · Chess',
        subtitle: topOverallRating
          ? `${topOverallRating.platform === 'chesscom' ? 'Chess.com' : 'Lichess'} · ${topOverallRating.label} ${topOverallRating.rating}`
          : 'Chess.com & Lichess · 3D Ruy Lopez Board',
        icon: <Crown className="h-4 w-4 text-muted" aria-hidden="true" />,
        keywords: 'interests chess lichess tactics rapid blitz puzzle rating hobby',
        payload: { kind: 'nav', path: '/interests' },
      },
      {
        id: 'spotlight-nav-contact',
        group: 'navigate',
        title: 'Contact',
        subtitle: `LinkedIn Identity Hub · ${profileConfig.links.email}`,
        icon: <Mail className="h-4 w-4 text-muted" aria-hidden="true" />,
        keywords: 'contact email github linkedin newton school reach',
        payload: { kind: 'nav', path: '/contact' },
      },
      {
        id: 'spotlight-nav-game',
        group: 'navigate',
        title: "Play Knight's Sprint",
        subtitle: '6×6 Chess tactical 30-second mini-game',
        icon: <Crown className="h-4 w-4 text-accent" aria-hidden="true" />,
        keywords: 'game knight sprint chess 404 mini-game play',
        payload: { kind: 'nav', path: '/game' },
      },
      ...profileConfig.caseStudies.map((cs) => ({
        id: `spotlight-cs-${cs.slug}`,
        group: 'navigate' as const,
        title: `${cs.number} · ${cs.title}`,
        subtitle: `${cs.category} Case Study · ${cs.metric}`,
        icon: <Compass className="h-4 w-4 text-muted" aria-hidden="true" />,
        keywords: `case study ${cs.category} ${cs.title} ${cs.stack.join(' ')}`,
        payload: { kind: 'nav' as const, path: `/projects/${cs.slug}` },
      })),
    ];

    if (!normalizedQuery) return base;
    return base.filter(
      (item) =>
        item.title.toLowerCase().includes(normalizedQuery) ||
        (item.subtitle?.toLowerCase().includes(normalizedQuery) ?? false) ||
        (item.keywords?.toLowerCase().includes(normalizedQuery) ?? false),
    );
  }, [normalizedQuery, topOverallRating]);

  const actionCommands = useMemo<SpotlightCommand[]>(() => {
    const actions: SpotlightCommand[] = [
      {
        id: 'spotlight-act-archive',
        group: 'actions',
        title: 'Browse All Repositories',
        subtitle: `${allRepos.length} repositories indexed`,
        icon: <FolderGit2 className="h-4 w-4 text-muted" aria-hidden="true" />,
        keywords: 'browse all repositories archive search filter',
        payload: { kind: 'archive' },
      },
      {
        id: 'spotlight-act-theme',
        group: 'actions',
        title: isDark
          ? 'Switch to Titanium Light'
          : 'Switch to Obsidian Dark',
        subtitle: isDark ? 'Light studio palette' : 'Dark obsidian palette',
        icon: isDark ? (
          <Sun className="h-4 w-4 text-accent" aria-hidden="true" />
        ) : (
          <Moon className="h-4 w-4 text-accent" aria-hidden="true" />
        ),
        keywords: 'theme dark light obsidian titanium mode toggle appearance',
        payload: { kind: 'theme' },
      },
      {
        id: 'spotlight-act-email',
        group: 'actions',
        title: 'Copy Email Address',
        subtitle: profileConfig.links.email,
        icon: <Copy className="h-4 w-4 text-muted" aria-hidden="true" />,
        keywords: 'copy email address mail clipboard contact',
        payload: { kind: 'copyEmail' },
      },
      {
        id: 'spotlight-act-refresh',
        group: 'actions',
        title: 'Refresh GitHub Repositories',
        subtitle:
          status === 'live'
            ? 'Fetch latest from GitHub API'
            : 'Re-check repository catalog',
        icon: <RefreshCw className="h-4 w-4 text-muted" aria-hidden="true" />,
        keywords: 'refresh sync reload github repositories',
        payload: { kind: 'refresh' },
      },
      {
        id: 'spotlight-act-refresh-chess',
        group: 'actions',
        title: 'Refresh Chess Stats',
        subtitle:
          chessCom.status === 'live' || lichess.status === 'live'
            ? 'Sync Chess.com & Lichess ratings'
            : 'Re-check Chess.com & Lichess profiles',
        icon: <RefreshCw className="h-4 w-4 text-muted" aria-hidden="true" />,
        keywords: 'refresh sync reload chess lichess stats ratings',
        payload: { kind: 'refreshChess' },
      },
      {
        id: 'spotlight-act-chesscom',
        group: 'actions',
        title: 'Open Chess.com Profile',
        subtitle: chessCom.profileUrl.replace('https://', ''),
        icon: <ExternalLink className="h-4 w-4 text-muted" aria-hidden="true" />,
        keywords: 'chess.com profile external link',
        payload: { kind: 'external', url: chessCom.profileUrl },
      },
      {
        id: 'spotlight-act-lichess',
        group: 'actions',
        title: 'Open Lichess Profile',
        subtitle: lichess.profileUrl.replace('https://', ''),
        icon: <ExternalLink className="h-4 w-4 text-muted" aria-hidden="true" />,
        keywords: 'lichess profile external link',
        payload: { kind: 'external', url: lichess.profileUrl },
      },
      {
        id: 'spotlight-act-github',
        group: 'actions',
        title: 'Open GitHub Profile',
        subtitle: profileConfig.links.githubUrl.replace('https://', ''),
        icon: <ExternalLink className="h-4 w-4 text-muted" aria-hidden="true" />,
        keywords: 'github profile external link',
        payload: { kind: 'external', url: profileConfig.links.githubUrl },
      },
      {
        id: 'spotlight-act-linkedin',
        group: 'actions',
        title: 'Open LinkedIn Profile',
        subtitle: profileConfig.links.linkedinUrl.replace('https://', ''),
        icon: <ExternalLink className="h-4 w-4 text-muted" aria-hidden="true" />,
        keywords: 'linkedin profile external link',
        payload: { kind: 'external', url: profileConfig.links.linkedinUrl },
      },
      {
        id: 'spotlight-act-newton',
        group: 'actions',
        title: 'Open Newton School Profile',
        subtitle: profileConfig.links.newtonSchoolUrl.replace('https://', ''),
        icon: <ExternalLink className="h-4 w-4 text-muted" aria-hidden="true" />,
        keywords: 'newton school college nst profile external link',
        payload: { kind: 'external', url: profileConfig.links.newtonSchoolUrl },
      },
      {
        id: 'spotlight-act-wq-gold',
        group: 'actions',
        title: 'WorldQuant BRAIN Gold Post',
        subtitle: profileConfig.featuredPost.subtitle,
        icon: <ExternalLink className="h-4 w-4 text-muted" aria-hidden="true" />,
        keywords: 'worldquant brain gold certificate quant researcher linkedin post',
        payload: {
          kind: 'external',
          url: profileConfig.featuredPost.postUrl || profileConfig.links.linkedinUrl,
        },
      },
    ];

    if (
      profileConfig.modules.showResume &&
      profileConfig.links.resumeUrl.trim().length > 0
    ) {
      actions.push({
        id: 'spotlight-act-resume',
        group: 'actions',
        title: 'View Resume',
        subtitle: 'Open PDF / CV in new tab',
        icon: <FileText className="h-4 w-4 text-muted" aria-hidden="true" />,
        keywords: 'resume cv pdf download',
        payload: { kind: 'external', url: profileConfig.links.resumeUrl },
      });
    }

    if (!normalizedQuery) return actions;
    return actions.filter(
      (item) =>
        item.title.toLowerCase().includes(normalizedQuery) ||
        (item.subtitle?.toLowerCase().includes(normalizedQuery) ?? false) ||
        (item.keywords?.toLowerCase().includes(normalizedQuery) ?? false),
    );
  }, [allRepos.length, isDark, status, normalizedQuery, chessCom.status, chessCom.profileUrl, lichess.status, lichess.profileUrl]);

  const sections = useMemo(
    () =>
      [
        {
          key: 'repos' as const,
          label: trimmedQuery ? 'Repositories' : 'Selected Repositories',
          items: repoCommands,
        },
        {
          key: 'navigate' as const,
          label: 'Navigate',
          items: navigateCommands,
        },
        {
          key: 'actions' as const,
          label: 'Quick Actions',
          items: actionCommands,
        },
      ].filter((sec) => sec.items.length > 0),
    [trimmedQuery, repoCommands, navigateCommands, actionCommands],
  );

  const flatCommands = useMemo(
    () => sections.flatMap((sec) => sec.items),
    [sections],
  );

  const safeActiveIndex =
    flatCommands.length === 0
      ? -1
      : Math.min(activeIndex, flatCommands.length - 1);

  const activeCommandId =
    safeActiveIndex >= 0 ? flatCommands[safeActiveIndex].id : undefined;

  const executeCommand = useCallback(
    (command: SpotlightCommand) => {
      const { payload } = command;

      switch (payload.kind) {
        case 'repo':
          closeModal(true);
          setSelectedRepo(payload.repo);
          break;
        case 'archive':
          closeModal(true);
          openArchiveWithFilter('');
          break;
        case 'nav':
          closeModal(false);
          playSpatialSwitch();
          navigate(payload.path);
          break;
        case 'theme':
          closeModal(false);
          toggleTheme();
          break;
        case 'copyEmail':
          closeModal(false);
          void copyTextToClipboard(profileConfig.links.email).then((ok) => {
            if (ok) {
              onShowToast(`Copied ${profileConfig.links.email}`);
            }
          });
          break;
        case 'refresh':
          closeModal(false);
          void refresh().then(() => {
            onShowToast(
              status === 'live'
                ? 'GitHub repositories synced'
                : 'Repository catalog refreshed',
            );
          });
          break;
        case 'refreshChess':
          closeModal(false);
          void refreshChess().then(() => {
            onShowToast('Chess.com stats refreshed');
          });
          break;
        case 'external':
          closeModal(false);
          window.open(payload.url, '_blank', 'noopener,noreferrer');
          break;
      }
    },
    [
      closeModal,
      setSelectedRepo,
      openArchiveWithFilter,
      navigate,
      toggleTheme,
      onShowToast,
      refresh,
      refreshChess,
      status,
    ],
  );

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (flatCommands.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = (safeActiveIndex + 1) % flatCommands.length;
      setActiveIndex(next);
      optionRefs.current[next]?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const next =
        (safeActiveIndex - 1 + flatCommands.length) % flatCommands.length;
      setActiveIndex(next);
      optionRefs.current[next]?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
      optionRefs.current[0]?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'End') {
      event.preventDefault();
      const last = flatCommands.length - 1;
      setActiveIndex(last);
      optionRefs.current[last]?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter' && safeActiveIndex >= 0) {
      if (event.nativeEvent.isComposing) return;
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) {
        pendingEnterCommandRef.current = flatCommands[safeActiveIndex] ?? null;
      }
    }
  };

  const handleKeyUp = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter') return;
    const pending = pendingEnterCommandRef.current;
    if (!pending) return;
    pendingEnterCommandRef.current = null;
    event.preventDefault();
    event.stopPropagation();
    executeCommand(pending);
  };

  let runningFlatIdx = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[11vh] sm:px-6 sm:pt-[14vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Spotlight command bar"
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: { duration: 0.18, ease: PRODUCTIVE_EASE },
        }}
        exit={{
          opacity: 0,
          transition: { duration: 0.14, ease: PRODUCTIVE_EASE },
        }}
        onClick={() => closeModal(false)}
        className="fixed inset-0 bg-[var(--scrim-bg)] backdrop-blur-sm"
        aria-hidden="true"
      />

      <motion.div
        initial={
          shouldReduceMotion
            ? { opacity: 0 }
            : { opacity: 0, transform: 'scale(0.96) translateY(-6px)' }
        }
        animate={
          shouldReduceMotion
            ? { opacity: 1, transition: { duration: 0.15 } }
            : {
                opacity: 1,
                transform: 'scale(1) translateY(0px)',
                transition: { duration: 0.22, ease: PRODUCTIVE_EASE },
              }
        }
        exit={
          shouldReduceMotion
            ? { opacity: 0, transition: { duration: 0.12 } }
            : {
                opacity: 0,
                transform: 'scale(0.98) translateY(-4px)',
                transition: { duration: 0.15, ease: [0.4, 0, 1, 1] },
              }
        }
        style={{ transformOrigin: 'center' }}
        className="liquid-glass relative z-10 flex max-h-[76svh] w-full max-w-[600px] flex-col overflow-hidden overscroll-contain rounded-2xl sm:rounded-3xl"
      >
        {/* Search Input Header */}
        <div className="hairline-divider flex items-center gap-3 border-b px-4 py-3.5 transition-shadow focus-within:ring-2 focus-within:ring-inset focus-within:ring-[var(--whisper-accent)] sm:px-5">
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            role="combobox"
            aria-expanded="true"
            aria-controls="spotlight-listbox"
            aria-autocomplete="list"
            aria-activedescendant={activeCommandId}
            aria-label="Search repositories, sections, or commands"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search repositories, sections, or actions…"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none sm:text-[15px]"
          />

          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setActiveIndex(0);
                inputRef.current?.focus();
              }}
              aria-label="Clear Spotlight query"
              className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors duration-150 hover:text-ink"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => closeModal(false)}
            aria-label="Close Spotlight"
            className="inline-flex h-7 shrink-0 cursor-pointer items-center rounded-md border border-[var(--border-hairline)] px-2 font-mono text-[11px] text-muted transition-colors duration-150 hover:border-[var(--border-hairline-hover)] hover:text-ink"
          >
            ESC
          </button>
        </div>

        {/* Results Listbox */}
        <div
          id="spotlight-listbox"
          role="listbox"
          aria-label="Spotlight command results"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-2.5 sm:px-3"
        >
          {flatCommands.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <p className="text-sm font-medium text-ink">
                No matching commands or repositories
              </p>
              <p className="mt-1 text-xs text-muted">
                Try another keyword or browse the full repository archive.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setActiveIndex(0);
                    inputRef.current?.focus();
                  }}
                  className="cursor-pointer rounded-full border border-[var(--border-hairline)] px-3.5 py-1.5 text-xs font-medium text-ink transition-colors duration-150 hover:border-[var(--border-hairline-hover)]"
                >
                  Clear search
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeModal(true);
                    openArchiveWithFilter(trimmedQuery);
                  }}
                  className="cursor-pointer rounded-full border border-[var(--border-hairline)] px-3.5 py-1.5 text-xs font-medium text-muted transition-colors duration-150 hover:border-[var(--border-hairline-hover)] hover:text-ink"
                >
                  Browse All Repositories
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section) => (
                <div key={section.key}>
                  <div className="px-2.5 pb-1.5 font-mono text-[11px] text-muted">
                    {section.label}
                  </div>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const flatIndex = runningFlatIdx++;
                      const isSelected = flatIndex === safeActiveIndex;

                      return (
                        <button
                          key={item.id}
                          ref={(el) => {
                            optionRefs.current[flatIndex] = el;
                          }}
                          id={item.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onMouseMove={() => {
                            if (activeIndex !== flatIndex) {
                              setActiveIndex(flatIndex);
                            }
                          }}
                          onClick={() => executeCommand(item)}
                          className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-100 ${
                            isSelected
                              ? 'bg-[color-mix(in_srgb,var(--text-primary)_9%,transparent)] text-ink'
                              : 'text-ink hover:bg-[color-mix(in_srgb,var(--text-primary)_5%,transparent)]'
                          }`}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            {item.group === 'repos' ? (
                              <span
                                aria-hidden="true"
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{
                                  backgroundColor:
                                    item.dotColor ?? 'var(--whisper-accent)',
                                }}
                              />
                            ) : (
                              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                                {item.icon}
                              </span>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-ink">
                                {item.title}
                              </div>
                              {item.subtitle ? (
                                <div className="truncate font-mono text-[11px] text-muted">
                                  {item.subtitle}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {item.badge ? (
                              <span className="rounded-full border border-[var(--border-hairline)] px-2 py-0.5 font-mono text-[10px] text-muted">
                                {item.badge}
                              </span>
                            ) : null}
                            {item.group === 'navigate' ? (
                              <ArrowDownRight
                                className={`h-3.5 w-3.5 transition-opacity duration-100 ${
                                  isSelected
                                    ? 'text-ink opacity-100'
                                    : 'text-muted opacity-40'
                                }`}
                                aria-hidden="true"
                              />
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quiet Monospace Footer Bar */}
        <div className="hairline-divider flex items-center justify-between border-t px-4 py-2.5 font-mono text-[11px] text-muted sm:px-5">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span className="hidden sm:inline">esc Close</span>
          </div>
          <span>
            {flatCommands.length}{' '}
            {flatCommands.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
