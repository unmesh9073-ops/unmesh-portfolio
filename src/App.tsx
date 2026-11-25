import { MotionConfig } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AllReposModal } from './components/AllReposModal';
import { FloatingDock } from './components/FloatingDock';
import { LiquidGlassToast } from './components/LiquidGlassToast';
import { ProjectDetailSheet } from './components/ProjectDetailSheet';
import { SpatialWorldStage } from './components/SpatialWorldStage';
import { SpotlightModal } from './components/SpotlightModal';
import { TopBar } from './components/TopBar';
import { ChessProvider } from './context/ChessContext';
import { GitHubProvider, useGitHub } from './context/GitHubContext';
import { SpatialWorldProvider } from './context/SpatialWorldContext';
import { ThemeProvider } from './context/ThemeContext';
import { ensureFocusVisibleClearance } from './lib/focusClearance';
import { ChessSection } from './sections/ChessSection';
import { ContactFooter } from './sections/ContactFooter';
import { ExperienceSection } from './sections/ExperienceSection';
import { FoundationsSection } from './sections/FoundationsSection';
import { Hero } from './sections/Hero';
import { LabSection } from './sections/LabSection';
import { NotesSection } from './sections/NotesSection';
import { SihFlagshipSection } from './sections/SihFlagshipSection';
import { WorkSection } from './sections/WorkSection';

function PortfolioShell() {
  const { selectedRepo, setSelectedRepo, archiveOpen, closeArchive } = useGitHub();
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [toastState, setToastState] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });
  const toastTimerRef = useRef<number | null>(null);

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
      className="relative min-h-svh bg-canvas text-ink"
      onFocusCapture={(event) => ensureFocusVisibleClearance(event.target)}
    >
      <SpatialWorldStage />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 liquid-glass rounded-full px-4 py-2 text-sm font-medium text-ink"
      >
        Skip to content
      </a>

      <TopBar onOpenSpotlight={openSpotlight} />

      <main id="main-content" tabIndex={-1} className="relative z-10 focus:outline-none">
        <Hero />
        <SihFlagshipSection />
        <WorkSection />
        <LabSection />
        <FoundationsSection />
        <ChessSection />
        <ExperienceSection />
        <NotesSection />
      </main>

      <div className="relative z-10">
        <ContactFooter onCopyEmail={handleCopyEmail} />
      </div>

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
