/**
 * Keeps keyboard-focused elements clear of fixed spatial overlays
 * (`TopBar` and bottom `FloatingDock`) to satisfy WCAG 2.4.12 Focus Not Obscured.
 */
export function ensureFocusVisibleClearance(target: EventTarget | null): void {
  if (!(target instanceof HTMLElement) || typeof window === 'undefined') {
    return;
  }

  let isKeyboardFocus = false;
  try {
    isKeyboardFocus = target.matches(':focus-visible');
  } catch {
    return;
  }

  if (!isKeyboardFocus) return;
  if (target.closest('header, nav, [role="dialog"]')) return;
  if (window.getComputedStyle(target).position === 'fixed') return;

  // Defer one frame so native browser focus-scroll completes before measuring.
  window.requestAnimationFrame(() => {
    if (document.activeElement !== target) return;

    const rect = target.getBoundingClientRect();
    const topBoundary = 88;
    const bottomBoundary = window.innerHeight - 100;

    if (rect.top < topBoundary) {
      window.scrollBy({
        top: rect.top - topBoundary,
        behavior: 'auto',
      });
    } else if (rect.bottom > bottomBoundary) {
      const maxDownScroll = Math.max(0, rect.top - topBoundary);
      const needed = rect.bottom - bottomBoundary;
      window.scrollBy({
        top: Math.min(needed, maxDownScroll),
        behavior: 'auto',
      });
    }
  });
}
