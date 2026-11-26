import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Compass } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRouteChapterIndex, SPATIAL_ROUTES } from '../config/routes';
import { productiveFastTransition, snappySpring } from '../lib/motion';
import { playSpatialSwitch, playSpatialTap } from '../lib/spatialAudio';

export function SpatialMinimap() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);

  const activeChapter = getRouteChapterIndex(pathname);
  const activeRoute = SPATIAL_ROUTES[activeChapter] ?? SPATIAL_ROUTES[0];

  return (
    <aside
      aria-label="Spatial chapter minimap"
      className="fixed right-6 bottom-6 z-30 hidden lg:block"
    >
      <div className="liquid-glass w-[216px] overflow-hidden rounded-2xl">
        <button
          type="button"
          onClick={() => {
            playSpatialTap();
            setCollapsed((prev) => !prev);
          }}
          aria-expanded={!collapsed}
          className="flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-left transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--text-primary)_4%,transparent)]"
        >
          <span className="inline-flex items-center gap-2 font-mono text-[11px] text-ink">
            <Compass className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <span>CH {activeRoute.index}</span>
            <span className="text-muted">·</span>
            <span className="truncate text-muted">{activeRoute.label}</span>
          </span>
          {collapsed ? (
            <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {!collapsed ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={productiveFastTransition}
              className="overflow-hidden border-t border-[var(--border-hairline)]"
            >
              <nav aria-label="Spatial camera chapters" className="space-y-0.5 p-1.5">
                {SPATIAL_ROUTES.map((route) => {
                  const isActive = route.chapterIndex === activeChapter;
                  return (
                    <button
                      key={route.path}
                      type="button"
                      onClick={() => {
                        if (!isActive) {
                          playSpatialSwitch();
                          navigate(route.path);
                        }
                      }}
                      aria-current={isActive ? 'location' : undefined}
                      className={`relative flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left font-mono text-[11px] transition-colors duration-150 ${
                        isActive ? 'text-ink' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {isActive ? (
                        <motion.span
                          layoutId="minimap-active-row"
                          transition={snappySpring}
                          aria-hidden="true"
                          className="absolute inset-0 rounded-xl border border-[var(--border-hairline-hover)] bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)]"
                        />
                      ) : null}

                      <span className="relative z-10 flex items-center gap-2">
                        <span className={isActive ? 'text-accent' : 'text-muted'}>
                          {route.index}
                        </span>
                        <span>{route.label}</span>
                      </span>

                      <span
                        aria-hidden="true"
                        className={`relative z-10 h-1.5 w-1.5 rounded-full ${
                          isActive
                            ? 'bg-accent'
                            : 'border border-[var(--border-hairline-hover)] bg-transparent'
                        }`}
                      />
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </aside>
  );
}
