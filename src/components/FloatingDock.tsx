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
  Compass,
  Crown,
  FlaskConical,
  FolderGit2,
  Layers,
  type LucideIcon,
  Mail,
  Route,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGitHub } from '../context/GitHubContext';
import {
  PRODUCTIVE_EASE,
  productiveFastTransition,
  productiveTransition,
  snappySpring,
} from '../lib/motion';
import { isApplePlatform } from '../lib/platform';
import { playSpatialModal, playSpatialSwitch, playSpatialTap } from '../lib/spatialAudio';

export interface FloatingDockProps {
  onOpenSpotlight: () => void;
  receded?: boolean;
}

interface DockEntry {
  id: string;
  path?: string;
  label: string;
  tooltip: string;
  icon: LucideIcon;
  kind: 'nav' | 'action';
  hideOnCompactMobile?: boolean;
  onActivate: () => void;
}

const MAGNIFY_RADIUS = 112;
const DOCK_SPRING = { mass: 0.14, stiffness: 290, damping: 22 };

function DockButton({
  item,
  isActive,
  canMagnify,
  mouseX,
  receded,
}: {
  item: DockEntry;
  isActive: boolean;
  canMagnify: boolean;
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
    <div
      className={`relative items-center justify-center ${
        item.hideOnCompactMobile ? 'hidden sm:flex' : 'flex'
      }`}
    >
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
        aria-current={item.kind === 'nav' && isActive ? 'page' : undefined}
        className={`relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-muted transition-colors duration-150 hover:text-ink focus-visible:text-ink ${
          isActive ? 'text-ink' : ''
        }`}
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
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { openArchiveWithFilter } = useGitHub();
  const shouldReduceMotion = useReducedMotion();
  const isApple = useMemo(() => isApplePlatform(), []);

  const [fineDesktop, setFineDesktop] = useState(false);
  const mouseX = useMotionValue(Infinity);
  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');

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
    const go = (path: string) => {
      if (normalizedPath !== path) {
        playSpatialSwitch();
        navigate(path);
      }
    };

    return [
      {
        id: 'overview',
        path: '/',
        label: 'Overview',
        tooltip: 'Overview',
        icon: Compass,
        kind: 'nav',
        onActivate: () => go('/'),
      },
      {
        id: 'projects',
        path: '/projects',
        label: 'Projects',
        tooltip: 'Projects',
        icon: Layers,
        kind: 'nav',
        onActivate: () => go('/projects'),
      },
      {
        id: 'hackathons',
        path: '/hackathons',
        label: 'Hackathons',
        tooltip: 'Hackathons · SIH 2026',
        icon: Route,
        kind: 'nav',
        onActivate: () => go('/hackathons'),
      },
      {
        id: 'research',
        path: '/research',
        label: 'Research',
        tooltip: 'Research · WorldQuant & Lab',
        icon: FlaskConical,
        kind: 'nav',
        onActivate: () => go('/research'),
      },
      {
        id: 'interests',
        path: '/interests',
        label: 'Interests',
        tooltip: 'Interests · Chess',
        icon: Crown,
        kind: 'nav',
        onActivate: () => go('/interests'),
      },
      {
        id: 'contact',
        path: '/contact',
        label: 'Contact',
        tooltip: 'Contact',
        icon: Mail,
        kind: 'nav',
        onActivate: () => go('/contact'),
      },
    ];
  }, [navigate, normalizedPath]);

  const utilityItems = useMemo<DockEntry[]>(
    () => [
      {
        id: 'repositories',
        label: 'Repositories',
        tooltip: 'Repositories',
        icon: FolderGit2,
        kind: 'action',
        hideOnCompactMobile: true,
        onActivate: () => {
          playSpatialTap();
          openArchiveWithFilter('');
        },
      },
      {
        id: 'spotlight',
        label: 'Spotlight',
        tooltip: isApple ? 'Spotlight · ⌘K' : 'Spotlight · Ctrl K',
        icon: Search,
        kind: 'action',
        onActivate: () => {
          playSpatialModal(true);
          onOpenSpotlight();
        },
      },
    ],
    [openArchiveWithFilter, onOpenSpotlight, isApple],
  );

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-3"
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
              isActive={normalizedPath === item.path}
              canMagnify={canMagnify}
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
              mouseX={mouseX}
              receded={receded}
            />
          ))}
        </div>
      </motion.nav>
    </div>
  );
}
