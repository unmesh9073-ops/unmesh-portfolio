import type { GitHubSyncConfig } from '../config/profile.config';

export type PortfolioRepoCategory = 'featured' | 'lab' | 'archive';

export interface PortfolioRepo {
  id: number | string;
  name: string;
  displayName: string;
  description: string;
  htmlUrl: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazersCount: number;
  forksCount: number;
  updatedAt: string;
  isFork: boolean;
  archived: boolean;
  category: PortfolioRepoCategory;
  source?: 'github' | 'fallback';
}

export interface GitHubApiRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  pushed_at?: string;
  fork: boolean;
  archived: boolean;
}

export interface CategorizedRepos {
  featuredRepos: PortfolioRepo[];
  labRepos: PortfolioRepo[];
  allRepos: PortfolioRepo[];
  forkRepos: PortfolioRepo[];
}

interface CachedGitHubPayload {
  version: 1;
  timestamp: number;
  repos: GitHubApiRepo[];
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_KEY_PREFIX = 'unmesh-github-repos:v1:';

const ACRONYM_MAP: Record<string, string> = {
  ai: 'AI',
  ml: 'ML',
  dl: 'DL',
  nn: 'NN',
  cpp: 'C++',
  js: 'JS',
  ts: 'TS',
  ui: 'UI',
  ux: 'UX',
  api: 'API',
  cli: 'CLI',
  dsa: 'DSA',
  os: 'OS',
  css: 'CSS',
  html: 'HTML',
  sql: 'SQL',
  gpu: 'GPU',
  r3f: 'R3F',
  nst: 'NST',
};

/**
 * Formats a repository slug (e.g. "micro-autograd-py") into a clean display title.
 */
export function formatRepoDisplayName(name: string): string {
  const parts = name
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return name;

  return parts
    .map((word) => {
      const lower = word.toLowerCase();
      if (ACRONYM_MAP[lower]) {
        return ACRONYM_MAP[lower];
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/**
 * Formats an ISO timestamp as a concise relative update string.
 */
export function formatRelativeTime(isoDate: string): string {
  const parsed = Date.parse(isoDate);
  if (Number.isNaN(parsed)) return 'Recently updated';

  const diffMs = Math.max(0, Date.now() - parsed);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return 'Updated today';

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return 'Updated today';

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Updated 1d ago';
  if (days < 14) return `Updated ${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (days < 45) return `Updated ${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `Updated ${months}mo ago`;

  const years = Math.floor(days / 365);
  return `Updated ${years}y ago`;
}

/**
 * Returns a calm, low-saturation Quiet Luxury indicator color for common languages.
 */
export function getLanguageDotColor(language: string | null, isDark: boolean): string {
  if (!language) return 'var(--whisper-accent)';

  const key = language.trim().toLowerCase();
  const darkPalette: Record<string, string> = {
    python: '#8CB4D8',
    'c++': '#93A8BE',
    c: '#9CA3AF',
    typescript: '#9DB8D6',
    javascript: '#CFC397',
    html: '#C79F8E',
    css: '#9BA8C9',
    'jupyter notebook': '#B4A9C9',
    rust: '#C7A08E',
    go: '#92BDC9',
  };
  const lightPalette: Record<string, string> = {
    python: '#3E5F7D',
    'c++': '#475B70',
    c: '#52525B',
    typescript: '#3B5978',
    javascript: '#7C6D3B',
    html: '#825542',
    css: '#4B597A',
    'jupyter notebook': '#655A7D',
    rust: '#805240',
    go: '#386875',
  };

  return (isDark ? darkPalette[key] : lightPalette[key]) ?? 'var(--whisper-accent)';
}

const SKILL_MATCH_ALIASES: Record<string, string[]> = {
  python: ['python', 'py', 'autograd'],
  'c++': ['c++', 'cpp', 'cxx'],
  html: ['html', 'html5'],
  css: ['css', 'css3', 'tailwind'],
  javascript: ['javascript', 'js', 'typescript', 'ts', 'ecmascript'],
  'machine learning': ['machine-learning', 'machine learning', 'ml', 'ai-ml', 'ai', 'neural-networks', 'autograd'],
  'data structures & algorithms': ['data-structures-and-algorithms', 'dsa', 'algorithms', 'data-structures', 'algo'],
};

/**
 * Normalizes and matches a repo against a skill name, language, topic, or search query.
 */
export function matchesRepoQuery(repo: PortfolioRepo, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;

  const aliases = SKILL_MATCH_ALIASES[query];
  const langLower = repo.language?.toLowerCase() ?? '';
  const topicsLower = repo.topics.map((t) => t.toLowerCase());

  if (aliases) {
    return aliases.some(
      (alias) => langLower === alias || topicsLower.includes(alias),
    );
  }

  return (
    repo.name.toLowerCase().includes(query) ||
    repo.displayName.toLowerCase().includes(query) ||
    repo.description.toLowerCase().includes(query) ||
    langLower.includes(query) ||
    topicsLower.some((topic) => topic.includes(query))
  );
}

function normalizeGitHubRepo(raw: GitHubApiRepo): Omit<PortfolioRepo, 'category'> {
  return {
    id: raw.id,
    name: raw.name,
    displayName: formatRepoDisplayName(raw.name),
    description:
      raw.description?.trim() ||
      'Exploratory engineering repository synced from GitHub.',
    htmlUrl: raw.html_url,
    homepage: raw.homepage?.trim() ? raw.homepage.trim() : null,
    language: raw.language,
    topics: Array.isArray(raw.topics)
      ? raw.topics.map((t) => t.toLowerCase())
      : [],
    stargazersCount: raw.stargazers_count ?? 0,
    forksCount: raw.forks_count ?? 0,
    updatedAt: raw.pushed_at || raw.updated_at,
    isFork: Boolean(raw.fork),
    archived: Boolean(raw.archived),
    source: 'github',
  };
}

/**
 * Applies Unmesh's Smart Auto-Sort rules to raw GitHub API repository payloads.
 */
export function sortAndCategorizeGitHubRepos(
  rawRepos: GitHubApiRepo[],
  githubSync: GitHubSyncConfig,
): CategorizedRepos {
  const featuredTopic = githubSync.featuredTopic.trim().toLowerCase();
  const labTopicSet = new Set(githubSync.labTopics.map((t) => t.trim().toLowerCase()));

  const activeNormalized = rawRepos
    .filter((repo) => !repo.archived)
    .map(normalizeGitHubRepo)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  const nonForks = activeNormalized.filter((repo) => !repo.isFork);
  const forks = activeNormalized
    .filter((repo) => repo.isFork)
    .map((repo) => ({ ...repo, category: 'archive' as const }));

  const explicitlyFeaturedIds = new Set<number | string>();
  const featuredRepos: PortfolioRepo[] = [];

  for (const repo of nonForks) {
    if (repo.topics.includes(featuredTopic)) {
      explicitlyFeaturedIds.add(repo.id);
      featuredRepos.push({ ...repo, category: 'featured' });
    }
  }

  // Graceful fallback: if public non-fork repos exist but none carry the `featured` topic yet,
  // auto-promote the top 3 most recently updated non-fork repositories.
  if (featuredRepos.length === 0 && nonForks.length > 0) {
    const promotedCount = Math.min(3, nonForks.length);
    for (let i = 0; i < promotedCount; i++) {
      const repo = nonForks[i];
      explicitlyFeaturedIds.add(repo.id);
      featuredRepos.push({ ...repo, category: 'featured' });
    }
  }

  const labRepos: PortfolioRepo[] = [];
  const allRepos: PortfolioRepo[] = [];

  for (const repo of nonForks) {
    if (explicitlyFeaturedIds.has(repo.id)) {
      allRepos.push({ ...repo, category: 'featured' });
      continue;
    }

    const matchesLab = repo.topics.some((topic) => labTopicSet.has(topic));
    if (matchesLab) {
      const labRepo: PortfolioRepo = { ...repo, category: 'lab' };
      labRepos.push(labRepo);
      allRepos.push(labRepo);
    } else {
      allRepos.push({ ...repo, category: 'archive' });
    }
  }

  return {
    featuredRepos,
    labRepos,
    allRepos,
    forkRepos: forks,
  };
}

function getCacheKey(username: string): string {
  return `${CACHE_KEY_PREFIX}${username.trim().toLowerCase()}`;
}

export function readCachedGitHubRepos(
  username: string,
): { repos: GitHubApiRepo[]; timestamp: number } | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(getCacheKey(username));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CachedGitHubPayload>;
    if (
      parsed.version !== 1 ||
      typeof parsed.timestamp !== 'number' ||
      !Array.isArray(parsed.repos)
    ) {
      return null;
    }

    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      return null;
    }

    return { repos: parsed.repos, timestamp: parsed.timestamp };
  } catch {
    return null;
  }
}

export function writeCachedGitHubRepos(
  username: string,
  repos: GitHubApiRepo[],
): number {
  const timestamp = Date.now();
  if (typeof window === 'undefined') return timestamp;

  try {
    // Store only fields needed by PortfolioRepo to minimize localStorage footprint
    const minimized: GitHubApiRepo[] = repos.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      html_url: r.html_url,
      homepage: r.homepage,
      language: r.language,
      topics: r.topics,
      stargazers_count: r.stargazers_count,
      forks_count: r.forks_count,
      updated_at: r.updated_at,
      pushed_at: r.pushed_at,
      fork: r.fork,
      archived: r.archived,
    }));

    const payload: CachedGitHubPayload = {
      version: 1,
      timestamp,
      repos: minimized,
    };
    window.localStorage.setItem(getCacheKey(username), JSON.stringify(payload));
  } catch {
    // Ignore storage quota / restricted privacy mode errors
  }

  return timestamp;
}

export function isConfiguredGitHubUsername(username: string): boolean {
  const trimmed = username.trim();
  return Boolean(trimmed) && trimmed !== 'YOUR_GITHUB_USERNAME';
}

export async function fetchGitHubUserRepos(
  username: string,
  signal?: AbortSignal,
): Promise<GitHubApiRepo[]> {
  const endpoint = `https://api.github.com/users/${encodeURIComponent(username.trim())}/repos?per_page=100&sort=updated&type=owner`;

  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`GitHub API responded with status ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new Error('Unexpected GitHub API payload shape');
  }

  return data as GitHubApiRepo[];
}
