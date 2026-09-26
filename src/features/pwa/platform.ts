/**
 * Rough browser family for installing. Chromium browsers (Chrome, Edge, Samsung Internet …) fire
 * `beforeinstallprompt`, so their native install dialog is opened directly; the manual platforms only get
 * step-by-step instructions.
 */
export type InstallPlatform =
  | "ios"
  | "mac-safari"
  | "android-firefox"
  | "android-chromium"
  | "desktop-chromium"
  | "unsupported";

export interface PlatformHints {
  userAgent: string;
  /** `navigator.maxTouchPoints` – distinguishes iPadOS (which reports as a Mac) from a real Mac. */
  maxTouchPoints: number;
}

export function detectInstallPlatform({ userAgent: ua, maxTouchPoints }: PlatformHints): InstallPlatform {
  const iPadOs = /Macintosh/.test(ua) && maxTouchPoints > 1;
  // Every browser on iOS/iPadOS is WebKit and can add a site to the home screen via the share menu.
  if (/iPhone|iPad|iPod/.test(ua) || iPadOs) return "ios";

  if (/Android/.test(ua)) {
    if (/Firefox\//.test(ua)) return "android-firefox";
    return "android-chromium";
  }

  // Desktop Firefox has no web-app install (outside of experiments).
  if (/Firefox\//.test(ua)) return "unsupported";
  if (/Chrome\/|Chromium\/|Edg\//.test(ua)) return "desktop-chromium";
  // Safari 17+ on macOS Sonoma can add web apps to the Dock.
  if (/Macintosh/.test(ua) && /Version\/(\d+)/.test(ua) && /Safari\//.test(ua)) {
    const major = Number(/Version\/(\d+)/.exec(ua)?.[1] ?? 0);
    return major >= 17 ? "mac-safari" : "unsupported";
  }
  return "unsupported";
}

/** Browsers without a native install dialog: installing works only via their own menus. */
export type ManualInstallPlatform = "ios" | "mac-safari" | "android-firefox";

export function isManualInstallPlatform(platform: InstallPlatform): platform is ManualInstallPlatform {
  return platform === "ios" || platform === "mac-safari" || platform === "android-firefox";
}

export interface InstallGuide {
  /** Short device label, e.g. "iPhone & iPad". */
  device: string;
  steps: readonly string[];
}

/**
 * Manual install steps. Chromium browsers (Windows, Android, Chrome/Edge on Mac & Linux) need none: they get
 * the native dialog directly, and without it they are usually installed already or not eligible.
 */
export const INSTALL_GUIDES: Record<ManualInstallPlatform, InstallGuide> = {
  ios: {
    device: "iPhone & iPad",
    steps: [
      "Tippen Sie auf das Teilen-Symbol (Quadrat mit Pfeil nach oben) – je nach Browser zuerst auf „…“.",
      "Wählen Sie „Zum Home-Bildschirm“ (ggf. etwas nach unten scrollen).",
      "Mit „Hinzufügen“ bestätigen – fertig.",
    ],
  },
  "mac-safari": {
    device: "Mac mit Safari",
    steps: [
      "Klicken Sie in der Menüleiste auf „Ablage“ (oder auf das Teilen-Symbol).",
      "Wählen Sie „Zum Dock hinzufügen …“.",
      "Mit „Hinzufügen“ bestätigen – die App liegt dann im Dock.",
    ],
  },
  "android-firefox": {
    device: "Android mit Firefox",
    steps: [
      "Tippen Sie auf das Menü (⋮).",
      "Wählen Sie „Installieren“ bzw. „Zum Startbildschirm hinzufügen“.",
      "Bestätigen – das App-Symbol erscheint auf dem Startbildschirm.",
    ],
  },
};

/** True when the page already runs as an installed app. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const displayModes = ["standalone", "fullscreen", "minimal-ui", "window-controls-overlay"];
  if (displayModes.some((mode) => window.matchMedia?.(`(display-mode: ${mode})`).matches)) return true;
  // iOS Safari exposes its own flag for home-screen web apps.
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}
