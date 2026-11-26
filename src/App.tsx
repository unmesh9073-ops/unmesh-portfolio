import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AllReposModal } from './components/AllReposModal';
import { FloatingDock } from './components/FloatingDock';
import { LiquidGlassToast } from './components/LiquidGlassToast';
import { PrecisionPreloader } from './components/PrecisionPreloader';
import { ProjectDetailSheet } from './components/ProjectDetailSheet';
import { SpatialMinimap } from './components/SpatialMinimap';
import { SpatialWorldStage } from './components/SpatialWorldStage';
import { SpotlightModal } from './components/SpotlightModal';
import { TopBar } from './components/TopBar';
import { ChessProvider } from './context/ChessContext';
import { GitHubProvider, useGitHub } from './context/GitHubContext';
import { SpatialWorldProvider } from './context/SpatialWorldContext';
import { ThemeProvider } from './context/ThemeContext';
import { ensureFocusVisibleClearance } from './lib/focusClearance';
import { spatialWindowTransition } from './lib/motion';
import { CaseStudyDetailPage } from './pages/CaseStudyDetailPage';
import { ContactPage } from './pages/ContactPage';
import { HackathonsPage } from './pages/HackathonsPage';
import { InterestsPage } from './pages/InterestsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OverviewPage } from './pages/OverviewPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ResearchPage } from './pages/ResearchPage';

function SpatialWindow({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
      transition={spatialWindowTransition}
      style={{ willChange: 'transform, opacity, filter' }}
    >
      {children}
    </motion.div>
  );
}

function PortfolioShell() {
  const location = useLocation();
  const { selectedRepo, setSelectedRepo, archiveOpen, closeArchive } = useGitHub();
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [toastState, setToastState] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  const showToast = useCallback((message: string) => {
    setToastState({ visible: true, message });
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastState((prev) => ({ ...prev, visible: false }));
    }, 2400);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const openSpotlight = useCallback(() => {
    closeArchive();
    setSelectedRepo(null);
    setSpotlightOpen(true);
  }, [closeArchive, setSelectedRepo]);

  const closeSpotlight = useCallback(() => {
    setSpotlightOpen(false);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (spotlightOpen) {
          setSpotlightOpen(false);
        } else {
          closeArchive();
          setSelectedRepo(null);
          setSpotlightOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [spotlightOpen, closeArchive, setSelectedRepo]);

  const handleCopyEmail = useCallback(
    (email: string) => {
      showToast(`Copied ${email}`);
    },
    [showToast],
  );

  const isAnyOverlayOpen = spotlightOpen || archiveOpen || Boolean(selectedRepo);

  return (
    <div
      className="relative min-h-svh overflow-x-clip bg-canvas text-ink"
      onFocusCapture={(event) => ensureFocusVisibleClearance(event.target)}
    >
      <PrecisionPreloader />
      <SpatialWorldStage />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 liquid-glass rounded-full px-4 py-2 text-sm font-medium text-ink"
      >
        Skip to content
      </a>

      <TopBar onOpenSpotlight={openSpotlight} />

      <main id="main-content" tabIndex={-1} className="relative z-10 focus:outline-none">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <SpatialWindow>
                  <OverviewPage />
                </SpatialWindow>
              }
            />
            <Route
              path="/projects"
              element={
                <SpatialWindow>
                  <ProjectsPage />
                </SpatialWindow>
              }
            />
            <Route
              path="/projects/:slug"
              element={
                <SpatialWindow>
                  <CaseStudyDetailPage />
                </SpatialWindow>
              }
            />
            <Route
              path="/hackathons"
              element={
                <SpatialWindow>
                  <HackathonsPage />
                </SpatialWindow>
              }
            />
            <Route
              path="/research"
              element={
                <SpatialWindow>
                  <ResearchPage />
                </SpatialWindow>
              }
            />
            <Route
              path="/interests"
              element={
                <SpatialWindow>
                  <InterestsPage />
                </SpatialWindow>
              }
            />
            <Route
              path="/contact"
              element={
                <SpatialWindow>
                  <ContactPage onCopyEmail={handleCopyEmail} />
                </SpatialWindow>
              }
            />
            <Route
              path="/game"
              element={
                <SpatialWindow>
                  <NotFoundPage isGameRoute />
                </SpatialWindow>
              }
            />
            <Route
              path="*"
              element={
                <SpatialWindow>
                  <NotFoundPage />
                </SpatialWindow>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>

      <SpatialMinimap />

      <FloatingDock onOpenSpotlight={openSpotlight} receded={isAnyOverlayOpen} />

      <SpotlightModal
        open={spotlightOpen}
        onClose={closeSpotlight}
        onShowToast={showToast}
      />

      <ProjectDetailSheet />
      <AllReposModal />

      <LiquidGlassToast visible={toastState.visible} message={toastState.message} />
    </div>
  );
}

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <GitHubProvider>
          <ChessProvider>
            <SpatialWorldProvider>
              <PortfolioShell />
            </SpatialWorldProvider>
          </ChessProvider>
        </GitHubProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}

export default App;
