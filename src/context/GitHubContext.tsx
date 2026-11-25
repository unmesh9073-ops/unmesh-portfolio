import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { profileConfig } from '../config/profile.config';
import { getFallbackCategorizedRepos } from '../data/fallbackProjects';
import {
  type CategorizedRepos,
  fetchGitHubUserRepos,
  isConfiguredGitHubUsername,
  matchesRepoQuery,
  type PortfolioRepo,
  readCachedGitHubRepos,
  sortAndCategorizeGitHubRepos,
  writeCachedGitHubRepos,
} from '../lib/github';

export type GitHubSyncStatus = 'loading' | 'live' | 'fallback';
export type GitHubFallbackReason = 'unconfigured' | 'empty' | 'error' | 'live';

interface GitHubContextValue {
  featuredRepos: PortfolioRepo[];
  labRepos: PortfolioRepo[];
  allRepos: PortfolioRepo[];
  forkRepos: PortfolioRepo[];
  status: GitHubSyncStatus;
  statusReason: GitHubFallbackReason;
  isRefreshing: boolean;
  lastSyncedAt: string | null;
  refresh: () => Promise<void>;
  selectedRepo: PortfolioRepo | null;
  setSelectedRepo: (repo: PortfolioRepo | null) => void;
  archiveOpen: boolean;
  archiveFilter: string;
  setArchiveFilter: (value: string) => void;
  openArchiveWithFilter: (queryOrLang?: string) => void;
  closeArchive: () => void;
  getSkillRepoCount: (skillName: string) => number;
}

const GitHubContext = createContext<GitHubContextValue | undefined>(undefined);

export function GitHubProvider({ children }: { children: ReactNode }) {
  const { githubUsername } = profileConfig.links;
  const { githubSync } = profileConfig;
  const hasConfiguredUsername = isConfiguredGitHubUsername(githubUsername);

  const initialCache = useMemo(() => {
    if (!hasConfiguredUsername) return null;
    return readCachedGitHubRepos(githubUsername);
  }, [hasConfiguredUsername, githubUsername]);

  const [categorized, setCategorized] = useState<CategorizedRepos>(() => {
    if (initialCache && initialCache.repos.filter((r) => !r.archived).length > 0) {
      return sortAndCategorizeGitHubRepos(initialCache.repos, githubSync);
    }
    return getFallbackCategorizedRepos();
  });

  const [status, setStatus] = useState<GitHubSyncStatus>(() => {
    if (!hasConfiguredUsername) return 'fallback';
    if (initialCache) {
      return initialCache.repos.filter((r) => !r.archived).length > 0
        ? 'live'
        : 'fallback';
    }
    return 'loading';
  });

  const [statusReason, setStatusReason] = useState<GitHubFallbackReason>(() => {
    if (!hasConfiguredUsername) return 'unconfigured';
    if (initialCache) {
      return initialCache.repos.filter((r) => !r.archived).length > 0
        ? 'live'
        : 'empty';
    }
    return 'live';
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() =>
    initialCache ? new Date(initialCache.timestamp).toISOString() : null,
  );

  const [selectedRepo, setSelectedRepo] = useState<PortfolioRepo | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveFilter, setArchiveFilter] = useState('');

  const applyLiveRepos = useCallback(
    (rawRepos: Parameters<typeof sortAndCategorizeGitHubRepos>[0], timestamp: number) => {
      const sorted = sortAndCategorizeGitHubRepos(rawRepos, githubSync);
      if (sorted.allRepos.length === 0 && sorted.forkRepos.length === 0) {
        setCategorized(getFallbackCategorizedRepos());
        setStatus('fallback');
        setStatusReason('empty');
        setLastSyncedAt(new Date(timestamp).toISOString());
        return;
      }

      setCategorized(sorted);
      setStatus('live');
      setStatusReason('live');
      setLastSyncedAt(new Date(timestamp).toISOString());
    },
    [githubSync],
  );

  const syncRepositories = useCallback(
    async (forceRefresh = false, signal?: AbortSignal) => {
      if (!isConfiguredGitHubUsername(githubUsername)) {
        setCategorized(getFallbackCategorizedRepos());
        setStatus('fallback');
        setStatusReason('unconfigured');
        setLastSyncedAt(null);
        return;
      }

      if (!forceRefresh) {
        const cached = readCachedGitHubRepos(githubUsername);
        if (cached) {
          applyLiveRepos(cached.repos, cached.timestamp);
          return;
        }
      }

      setIsRefreshing(true);
      try {
        const rawRepos = await fetchGitHubUserRepos(githubUsername, signal);
        if (signal?.aborted) return;

        const savedAt = writeCachedGitHubRepos(githubUsername, rawRepos);
        applyLiveRepos(rawRepos, savedAt);
      } catch {
        if (signal?.aborted) return;
        setCategorized(getFallbackCategorizedRepos());
        setStatus('fallback');
        setStatusReason('error');
      } finally {
        if (!signal?.aborted) {
          setIsRefreshing(false);
        }
      }
    },
    [githubUsername, applyLiveRepos],
  );

  useEffect(() => {
    // Only run an async network fetch on mount when configured and cache is cold;
    // unconfigured and cached states are already initialized synchronously in useState.
    if (!hasConfiguredUsername || initialCache) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    void (async () => {
      setIsRefreshing(true);
      try {
        const rawRepos = await fetchGitHubUserRepos(githubUsername, controller.signal);
        if (!active || controller.signal.aborted) return;
        const savedAt = writeCachedGitHubRepos(githubUsername, rawRepos);
        applyLiveRepos(rawRepos, savedAt);
      } catch {
        if (!active || controller.signal.aborted) return;
        setCategorized(getFallbackCategorizedRepos());
        setStatus('fallback');
        setStatusReason('error');
      } finally {
        if (active && !controller.signal.aborted) {
          setIsRefreshing(false);
        }
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [hasConfiguredUsername, initialCache, githubUsername, applyLiveRepos]);

  const refresh = useCallback(async () => {
    await syncRepositories(true);
  }, [syncRepositories]);

  const openArchiveWithFilter = useCallback((queryOrLang = '') => {
    setArchiveFilter(queryOrLang);
    setArchiveOpen(true);
  }, []);

  const closeArchive = useCallback(() => {
    setArchiveOpen(false);
  }, []);

  const getSkillRepoCount = useCallback(
    (skillName: string) => {
      let count = 0;
      for (const repo of categorized.allRepos) {
        if (matchesRepoQuery(repo, skillName)) {
          count++;
        }
      }
      return count;
    },
    [categorized.allRepos],
  );

  const value = useMemo<GitHubContextValue>(
    () => ({
      featuredRepos: categorized.featuredRepos,
      labRepos: categorized.labRepos,
      allRepos: categorized.allRepos,
      forkRepos: categorized.forkRepos,
      status,
      statusReason,
      isRefreshing,
      lastSyncedAt,
      refresh,
      selectedRepo,
      setSelectedRepo,
      archiveOpen,
      archiveFilter,
      setArchiveFilter,
      openArchiveWithFilter,
      closeArchive,
      getSkillRepoCount,
    }),
    [
      categorized,
      status,
      statusReason,
      isRefreshing,
      lastSyncedAt,
      refresh,
      selectedRepo,
      archiveOpen,
      archiveFilter,
      openArchiveWithFilter,
      closeArchive,
      getSkillRepoCount,
    ],
  );

  return (
    <GitHubContext.Provider value={value}>{children}</GitHubContext.Provider>
  );
}

// oxlint-disable-next-line react/only-export-components
export function useGitHub(): GitHubContextValue {
  const ctx = useContext(GitHubContext);
  if (!ctx) {
    throw new Error('useGitHub must be used within a GitHubProvider');
  }
  return ctx;
}
