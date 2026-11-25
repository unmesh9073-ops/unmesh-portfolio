interface NavigatorUAData {
  platform?: string;
}

/**
 * Detects whether the user is on an Apple platform (macOS, iOS, iPadOS)
 * so keyboard shortcut hints display `⌘K` on Apple devices and `Ctrl K` elsewhere.
 */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return true;

  const uaDataPlatform = (
    navigator as Navigator & { userAgentData?: NavigatorUAData }
  ).userAgentData?.platform;

  const platformStr = (
    uaDataPlatform ||
    navigator.platform ||
    navigator.userAgent ||
    ''
  ).toLowerCase();

  return /mac|iphone|ipad|ipod/.test(platformStr);
}
