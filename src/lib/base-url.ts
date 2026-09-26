/** Public origin used by Better Auth. Explicit BETTER_AUTH_URL wins; on Vercel it is derived. */
export function resolveBaseURL(env: NodeJS.ProcessEnv = process.env): string | undefined {
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL;
  if (env.VERCEL_ENV === "production" && env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return undefined;
}

/** Every origin a Vercel deployment can be reached on (deployment, branch and production URL). */
export function resolveTrustedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const hosts = [env.VERCEL_URL, env.VERCEL_BRANCH_URL, env.VERCEL_PROJECT_PRODUCTION_URL].filter(
    (host): host is string => Boolean(host),
  );
  return [...new Set(hosts.map((host) => `https://${host}`))];
}
