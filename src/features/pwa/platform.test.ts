import { describe, expect, it } from "vitest";
import { detectInstallPlatform, INSTALL_GUIDES, isManualInstallPlatform } from "./platform";

const UA = {
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
  iphoneChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0 Mobile/15E148 Safari/604.1",
  ipadOs:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15",
  macSafari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15",
  macSafari16:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
  samsung:
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36",
  androidFirefox: "Mozilla/5.0 (Android 14; Mobile; rv:141.0) Gecko/141.0 Firefox/141.0",
  windowsEdge:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0",
  windowsFirefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0",
} as const;

const detect = (userAgent: string, maxTouchPoints = 0) => detectInstallPlatform({ userAgent, maxTouchPoints });

describe("detectInstallPlatform", () => {
  it("treats every iOS browser and iPadOS (Mac user agent + touch) as iOS", () => {
    expect(detect(UA.iphone, 5)).toBe("ios");
    expect(detect(UA.iphoneChrome, 5)).toBe("ios");
    expect(detect(UA.ipadOs, 5)).toBe("ios");
  });

  it("recognises Safari on the Mac (Dock apps from Safari 17)", () => {
    expect(detect(UA.macSafari)).toBe("mac-safari");
    expect(detect(UA.macSafari16)).toBe("unsupported");
  });

  it("separates Chromium browsers (native dialog) from Firefox on Android", () => {
    expect(detect(UA.androidChrome, 5)).toBe("android-chromium");
    expect(detect(UA.samsung, 5)).toBe("android-chromium");
    expect(detect(UA.androidFirefox, 5)).toBe("android-firefox");
    expect(detect(UA.windowsEdge)).toBe("desktop-chromium");
    expect(detect(UA.windowsFirefox)).toBe("unsupported");
  });

  it("has instructions exactly for the browsers without a native install dialog", () => {
    expect(Object.keys(INSTALL_GUIDES).sort()).toEqual(["android-firefox", "ios", "mac-safari"]);
    expect(isManualInstallPlatform("desktop-chromium")).toBe(false);
    expect(isManualInstallPlatform("android-chromium")).toBe(false);
    for (const guide of Object.values(INSTALL_GUIDES)) expect(guide.steps.length).toBeGreaterThan(0);
  });
});
