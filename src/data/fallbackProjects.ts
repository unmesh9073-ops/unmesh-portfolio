import type { CategorizedRepos, PortfolioRepo } from '../lib/github';

const daysAgoIso = (days: number): string =>
  new Date(Date.now() - days * 86_400_000).toISOString();

/**
 * Curated fallback catalog tailored to a first-year B.Tech CS (AI & ML) student
 * at Newton School of Technology, Pune. Automatically displayed when
 * `profileConfig.links.githubUsername` is unconfigured, offline, or rate-limited.
 */
export const FALLBACK_REPOS: PortfolioRepo[] = [
  {
    id: 'fallback-micrograd-canvas',
    name: 'micrograd-canvas',
    displayName: 'Micrograd Canvas',
    description:
      'Scalar-valued reverse-mode autograd engine in pure Python with step-by-step computational graph tracing and training loss diagnostics.',
    htmlUrl: 'https://github.com/YOUR_GITHUB_USERNAME',
    homepage: null,
    language: 'Python',
    topics: ['featured', 'machine-learning', 'autograd', 'python'],
    stargazersCount: 0,
    forksCount: 0,
    updatedAt: daysAgoIso(3),
    isFork: false,
    archived: false,
    category: 'featured',
    source: 'fallback',
  },
  {
    id: 'fallback-cpp-algo-bench',
    name: 'cpp-algo-bench',
    displayName: 'C++ Algo Bench',
    description:
      'Zero-dependency C++20 data structure suite and micro-benchmarking harness comparing cache locality across heaps, trees, and graph traversals.',
    htmlUrl: 'https://github.com/YOUR_GITHUB_USERNAME',
    homepage: null,
    language: 'C++',
    topics: ['featured', 'data-structures-and-algorithms', 'cpp', 'systems'],
    stargazersCount: 0,
    forksCount: 0,
    updatedAt: daysAgoIso(6),
    isFork: false,
    archived: false,
    category: 'featured',
    source: 'fallback',
  },
  {
    id: 'fallback-spatial-portfolio',
    name: 'quiet-luxury-portfolio',
    displayName: 'Quiet Luxury Portfolio',
    description:
      'Configuration-driven spatial portfolio engine pairing React, Tailwind v4, spring physics, and a playable Three.js neural volume.',
    htmlUrl: 'https://github.com/YOUR_GITHUB_USERNAME',
    homepage: null,
    language: 'JavaScript',
    topics: ['featured', 'javascript', 'css', 'html', 'webgl'],
    stargazersCount: 0,
    forksCount: 0,
    updatedAt: daysAgoIso(1),
    isFork: false,
    archived: false,
    category: 'featured',
    source: 'fallback',
  },
  {
    id: 'fallback-loss-landscape',
    name: 'loss-surface-explorer',
    displayName: 'Loss Surface Explorer',
    description:
      'Interactive first-principles notebook probing gradient descent, momentum, and learning-rate stability across non-convex saddle functions.',
    htmlUrl: 'https://github.com/YOUR_GITHUB_USERNAME',
    homepage: null,
    language: 'Python',
    topics: ['ai-ml', 'ml', 'machine-learning', 'optimization'],
    stargazersCount: 0,
    forksCount: 0,
    updatedAt: daysAgoIso(9),
    isFork: false,
    archived: false,
    category: 'lab',
    source: 'fallback',
  },
  {
    id: 'fallback-cosine-index',
    name: 'cosine-token-index',
    displayName: 'Cosine Token Index',
    description:
      'Minimal embedding similarity probe exploring vector normalization, sparse inverted indices, and dot-product retrieval latency.',
    htmlUrl: 'https://github.com/YOUR_GITHUB_USERNAME',
    homepage: null,
    language: 'Python',
    topics: ['ai', 'lab', 'machine-learning', 'linear-algebra'],
    stargazersCount: 0,
    forksCount: 0,
    updatedAt: daysAgoIso(14),
    isFork: false,
    archived: false,
    category: 'lab',
    source: 'fallback',
  },
  {
    id: 'fallback-tensor-kernel',
    name: 'tensor-stride-kernel',
    displayName: 'Tensor Stride Kernel',
    description:
      'Contiguous row-major tensor view in modern C++ studying stride arithmetic, broadcasting rules, and cache-friendly matrix multiplication.',
    htmlUrl: 'https://github.com/YOUR_GITHUB_USERNAME',
    homepage: null,
    language: 'C++',
    topics: ['lab', 'ml', 'data-structures-and-algorithms', 'cpp'],
    stargazersCount: 0,
    forksCount: 0,
    updatedAt: daysAgoIso(19),
    isFork: false,
    archived: false,
    category: 'lab',
    source: 'fallback',
  },
  {
    id: 'fallback-optical-grid',
    name: 'optical-grid-tokens',
    displayName: 'Optical Grid Tokens',
    description:
      'Pure HTML and CSS layout studies focused on fluid typographic scale, hairline borders, and zero-framework adaptive theme tokens.',
    htmlUrl: 'https://github.com/YOUR_GITHUB_USERNAME',
    homepage: null,
    language: 'CSS',
    topics: ['css', 'html', 'typography', 'design-systems'],
    stargazersCount: 0,
    forksCount: 0,
    updatedAt: daysAgoIso(26),
    isFork: false,
    archived: false,
    category: 'archive',
    source: 'fallback',
  },
  {
    id: 'fallback-pointer-physics',
    name: 'pointer-spring-notes',
    displayName: 'Pointer Spring Notes',
    description:
      'Lightweight browser experiments covering pointer capture, velocity projection, and accessible reduced-motion spring curves.',
    htmlUrl: 'https://github.com/YOUR_GITHUB_USERNAME',
    homepage: null,
    language: 'JavaScript',
    topics: ['javascript', 'html', 'css', 'interaction'],
    stargazersCount: 0,
    forksCount: 0,
    updatedAt: daysAgoIso(34),
    isFork: false,
    archived: false,
    category: 'archive',
    source: 'fallback',
  },
];

export function getFallbackCategorizedRepos(): CategorizedRepos {
  return {
    featuredRepos: FALLBACK_REPOS.filter((r) => r.category === 'featured'),
    labRepos: FALLBACK_REPOS.filter((r) => r.category === 'lab'),
    allRepos: FALLBACK_REPOS,
    forkRepos: [],
  };
}
