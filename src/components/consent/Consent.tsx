import { analyticsEnabled } from "@/config/analytics";
import { CookieBanner } from "./CookieBanner";
import { PostHogAnalytics } from "./PostHogAnalytics";

/** Cookie banner + consent-gated analytics. Renders nothing while no PostHog key is configured. */
export function Consent() {
  if (!analyticsEnabled) return null;
  return (
    <>
      <CookieBanner />
      <PostHogAnalytics />
    </>
  );
}
