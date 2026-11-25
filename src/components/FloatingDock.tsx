import {
  AnimatePresence,
  type MotionValue,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  BookOpen,
  Briefcase,
  Compass,
  Cpu,
  FlaskConical,
  FolderGit2,
  Layers,
  type LucideIcon,
  Mail,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { profileConfig } from '../config/profile.config';
import { useGitHub } from '../context/GitHubContext';
import {
  PRODUCTIVE_EASE,
  productiveFastTransition,
  productiveTransition,
  snappySpring,
} from '../lib/motion';
import { isApplePlatform } from '../lib/platform';

export interface FloatingDockProps {
  onOpenSpotlight: () => void;
  receded?: boolean;
}

interface DockEntry {
  id: string;
  label: string;
  tooltip: string;
  icon: LucideIcon;
  kind: 'nav' | 'action';
  onActivate: () => void;
}

const MAGNIFY_RADIUS = 112;
const DOCK_SPRING = { mass: 0.14, stiffness: 290, damping: 22 };

function DockButton({
  item,
  isActive,
  canMagnify,
  compactMobile,
  mouseX,
  receded,
}: {
  item: DockEntry;
  isActive: boolean;
  canMagnify: boolean;
  compactMobile: boolean;
  mouseX: MotionValue<number>;
  receded: boolean;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const rawScale = useTransform(mouseX, (pointerX) => {
    if (!canMagnify || pointerX === Infinity) return 1;
    const el = buttonRef.current;
    if (!el) return 1;
    const rect = el.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const dist = Math.abs(pointerX - center);
    if (dist >= MAGNIFY_RADIUS) return 1;
    const falloff = (1 + Math.cos((Math.PI * dist) / MAGNIFY_RADIUS)) * 0.5;
    return 1 + 0.28 * falloff;
  });

  const rawLift = useTransform(mouseX, (pointerX) => {
    if (!canMagnify || pointerX === Infinity) return 0;
    const el = buttonRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const dist = Math.abs(pointerX - center);
    if (dist >= MAGNIFY_RADIUS) return 0;
    const falloff = (1 + Math.cos((Math.PI * dist) / MAGNIFY_RADIUS)) * 0.5;
    return -5.5 * falloff;
  });

  const scale = useSpring(rawScale, DOCK_SPRING);
  const y = useSpring(rawLift, DOCK_SPRING);
  const Icon = item.icon;

  return (
    <div className="relative flex items-center justify-center">
      <AnimatePresence>
        {showTooltip && !receded ? (
          <motion.span
            initial={{ opacity: 0, transform: 'translateY(4px) scale(0.96)' }}
            animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
            exit={{ opacity: 0, transform: 'translateY(2px) scale(0.97)' }}
            transition={{ duration: 0.15, ease: PRODUCTIVE_EASE }}
            role="tooltip"
            className="liquid-glass pointer-events-none absolute -top-10 hidden whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[11px] text-ink sm:block"
          >
            {item.tooltip}
          </motion.span>
        ) : null}
      </AnimatePresence>

      <motion.button
        ref={buttonRef}
        type="button"
        onClick={item.onActivate}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse' && canMagnify) {
            setShowTooltip(true);
          }
        }}
        onPointerLeave={() => setShowTooltip(false)}
        onFocus={() => {
          if (canMagnify) setShowTooltip(true);
        }}
        onBlur={() => setShowTooltip(false)}
        whileTap={{ scale: 0.94 }}
        transition={productiveFastTransition}
        tabIndex={receded ? -1 : 0}
        aria-label={item.tooltip}
        aria-current={item.kind === 'nav' && isActive ? 'location' : undefined}
        className={`relative flex h-11 cursor-pointer items-center justify-center rounded-full text-muted transition-colors duration-150 hover:text-ink focus-visible:text-ink ${
          compactMobile ? 'w-10 sm:w-11' : 'w-11'
        } ${isActive ? 'text-ink' : ''}`}
      >
        <motion.span
          style={canMagnify ? { scale, y } : undefined}
          className="inline-flex items-center justify-center"
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
        </motion.span>

        {item.kind === 'nav' && isActive ? (
          <motion.span
            layoutId="dock-active-dot"
            transition={snappySpring}
            aria-hidden="true"
            className="absolute bottom-1.5 h-1 w-1 rounded-full bg-accent"
          />
        ) : null}
      </motion.button>
    </div>
  );
}

export function FloatingDock({ onOpenSpotlight, receded = false }: FloatingDockProps) {
  const { openArchiveWithFilter } = useGitHub();
  const shouldReduceMotion = useReducedMotion();
  const isApple = useMemo(() => isApplePlatform(), []);

  const [activeSection, setActiveSection] = useState<string>('top');
  const [fineDesktop, setFineDesktop] = useState(false);

  const activeSectionRef = useRef('top');
  const mouseX = useMotionValue(Infinity);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 640px)');
    const sync = () => {
      setFineDesktop(mq.matches);
      if (!mq.matches) {
        mouseX.set(Infinity);
      }
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [mouseX]);

  const canMagnify = fineDesktop && !shouldReduceMotion && !receded;

  const navItems = useMemo<DockEntry[]>(() => {
    const scrollTo = (id: string) => {
      if (id === 'top') {
        window.scrollTo({
          top: 0,
          behavior: shouldReduceMotion ? 'auto' : 'smooth',
        });
        return;
      }
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({
          behavior: shouldReduceMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      }
    };

    const items: DockEntry[] = [
      {
        id: 'top',
        label: 'Overview',
        tooltip: 'Overview',
        icon: Compass,
        kind: 'nav',
        onActivate: () => scrollTo('top'),
      },
      {
        id: 'work',
        label: 'Work',
        tooltip: 'Work',
        icon: Layers,
        kind: 'nav',
        onActivate: () => scrollTo('work'),
      },
      {
        id: 'lab',
        label: 'Lab',
        tooltip: 'AI/ML Lab',
        icon: FlaskConical,
        kind: 'nav',
        onActivate: () => scrollTo('lab'),
      },
      {
        id: 'foundations',
        label: 'Foundations',
        tooltip: 'Foundations',
        icon: Cpu,
        kind: 'nav',
        onActivate: () => scrollTo('foundations'),
      },
    ];

    if (profileConfig.modules.showExperience) {
      items.push({
        id: 'experience',
        label: 'Experience',
        tooltip: 'Experience',
        icon: Briefcase,
        kind: 'nav',
        onActivate: () => scrollTo('experience'),
      });
    }

    if (profileConfig.modules.showResearchNotes) {
      items.push({
        id: 'notes',
        label: 'Notes',
        tooltip: 'Notes',
        icon: BookOpen,
        kind: 'nav',
        onActivate: () => scrollTo('notes'),
      });
    }

    items.push({
      id: 'contact',
      label: 'Contact',
      tooltip: 'Contact',
      icon: Mail,
      kind: 'nav',
      onActivate: () => scrollTo('contact'),
    });

    return items;
  }, [shouldReduceMotion]);

  const utilityItems = useMemo<DockEntry[]>(
    () => [
      {
        id: 'repositories',
        label: 'Repositories',
        tooltip: 'Repositories',
        icon: FolderGit2,
        kind: 'action',
        onActivate: () => openArchiveWithFilter(''),
      },
      {
        id: 'spotlight',
        label: 'Spotlight',
        tooltip: isApple ? 'Spotlight · ⌘K' : 'Spotlight · Ctrl K',
        icon: Search,
        kind: 'action',
        onActivate: onOpenSpotlight,
      },
    ],
    [openArchiveWithFilter, onOpenSpotlight, isApple],
  );

  const navIds = useMemo(() => navItems.map((item) => item.id), [navItems]);

  // Track active section cleanly via IntersectionObserver with minimal state updates
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const ratios = new Map<string, number>();
    const elements = navIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const commitActive = (nextId: string) => {
      if (nextId !== activeSectionRef.current) {
        activeSectionRef.current = nextId;
        setActiveSection(nextId);
      }
    };

    const resolveActiveSection = () => {
      if (window.scrollY < 72) {
        commitActive('top');
        return;
      }

      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 40;
      if (nearBottom) {
        commitActive('contact');
        return;
      }

      let bestId = '';
      let bestRatio = 0;
      for (const id of navIds) {
        const ratio = ratios.get(id) ?? 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      }

      if (bestId) {
        commitActive(bestId);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(
            entry.target.id,
            entry.isIntersecting ? entry.intersectionRatio : 0,
          );
        }
        resolveActiveSection();
      },
      {
        rootMargin: '-22% 0px -38% 0px',
        threshold: [0, 0.15, 0.35, 0.6, 0.9],
      },
    );

    for (const el of elements) {
      observer.observe(el);
    }

    let rafId: number | null = null;
    const handleScrollBoundary = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        if (window.scrollY < 72) {
          commitActive('top');
        } else if (
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 40
        ) {
          commitActive('contact');
        }
      });
    };

    window.addEventListener('scroll', handleScrollBoundary, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScrollBoundary);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [navIds]);

  const totalCount = navItems.length + utilityItems.length;
  const compactMobile = totalCount > 7;

  return (
    <div
      className={`fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-3 ${
        receded ? 'pointer-events-none' : 'pointer-events-none'
      }`}
      aria-hidden={receded}
    >
      <motion.nav
        aria-label="Primary spatial dock"
        initial={false}
        animate={
          receded
            ? {
                opacity: 0.25,
                transform: shouldReduceMotion ? 'scale(1)' : 'scale(0.96)',
              }
            : { opacity: 1, transform: 'scale(1)' }
        }
        transition={productiveTransition}
        onPointerMove={(event) => {
          if (event.pointerType === 'mouse' && canMagnify) {
            mouseX.set(event.clientX);
          }
        }}
        onPointerLeave={() => mouseX.set(Infinity)}
        className={`liquid-glass flex max-w-full items-center gap-0.5 rounded-full px-1.5 py-1 sm:gap-1 sm:px-2 sm:py-1.5 ${
          receded ? 'pointer-events-none' : 'pointer-events-auto'
        }`}
      >
        <div className="flex items-center gap-0.5 sm:gap-1">
          {navItems.map((item) => (
            <DockButton
              key={item.id}
              item={item}
              isActive={activeSection === item.id}
              canMagnify={canMagnify}
              compactMobile={compactMobile}
              mouseX={mouseX}
              receded={receded}
            />
          ))}
        </div>

        <span
          aria-hidden="true"
          className="mx-1 h-5 w-px shrink-0 bg-[var(--border-hairline)] sm:mx-1.5"
        />

        <div className="flex items-center gap-0.5 sm:gap-1">
          {utilityItems.map((item) => (
            <DockButton
              key={item.id}
              item={item}
              isActive={false}
              canMagnify={canMagnify}
              compactMobile={compactMobile}
              mouseX={mouseX}
              receded={receded}
            />
          ))}
        </div>
      </motion.nav>
    </div>
  );
}
