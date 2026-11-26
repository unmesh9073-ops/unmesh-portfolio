import { profileConfig } from './profile.config';

export interface SpatialRouteMeta {
  index: string;
  chapterIndex: number;
  path: string;
  label: string;
  sceneName: string;
  description: string;
}

export const SPATIAL_ROUTES: ReadonlyArray<SpatialRouteMeta> = [
  {
    index: '00',
    chapterIndex: 0,
    path: '/',
    label: 'Overview',
    sceneName: 'Neural Volume',
    description: 'Hero, 01–04 Core Pillars & Featured Case Studies',
  },
  {
    index: '01',
    chapterIndex: 1,
    path: '/projects',
    label: 'Projects',
    sceneName: 'Architectural Monoliths',
    description: 'Case Study Rail & Live GitHub engineering showcase',
  },
  {
    index: '02',
    chapterIndex: 2,
    path: '/hackathons',
    label: 'Hackathons',
    sceneName: 'Autonomous LiDAR Road',
    description: 'SIH 2026 Problem Statement #37',
  },
  {
    index: '03',
    chapterIndex: 3,
    path: '/research',
    label: 'Research',
    sceneName: 'Sculptural Lattice',
    description: 'WorldQuant BRAIN Gold & AI/ML Lab',
  },
  {
    index: '04',
    chapterIndex: 4,
    path: '/interests',
    label: 'Interests',
    sceneName: 'Ruy Lopez Sculpture',
    description: 'Chess.com & Lichess live analytics',
  },
  {
    index: '05',
    chapterIndex: 5,
    path: '/contact',
    label: 'Contact',
    sceneName: 'Network Constellation',
    description: 'LinkedIn Hub & direct channels',
  },
];

const CHAPTER_TO_INDEX: Record<string, number> = {
  projects: 1,
  hackathons: 2,
  research: 3,
};

export function getRouteChapterIndex(pathname: string): number {
  const normalized = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');

  if (normalized.startsWith('/projects/')) {
    const slug = decodeURIComponent(normalized.slice('/projects/'.length));
    const matchedStudy = profileConfig.caseStudies.find((cs) => cs.slug === slug);
    if (matchedStudy) {
      return CHAPTER_TO_INDEX[matchedStudy.chapter] ?? 1;
    }
    return 1;
  }

  const match = SPATIAL_ROUTES.find((route) => route.path === normalized);
  return match ? match.chapterIndex : 4;
}
