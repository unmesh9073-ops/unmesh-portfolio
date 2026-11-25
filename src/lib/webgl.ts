/**
 * Detects whether the current browser context can create a WebGL/WebGL2 rendering context.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('experimental-webgl');

    if (!gl) return false;

    if ('getExtension' in gl && typeof gl.getExtension === 'function') {
      const loseExt = gl.getExtension('WEBGL_lose_context');
      loseExt?.loseContext();
    }
    return true;
  } catch {
    return false;
  }
}
