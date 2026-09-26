# business_aryo

## Language
- Always talk to the user in German, even when their prompt is short or in English. Code, commit messages and PRs stay in English.

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Better Auth · Drizzle (Neon Postgres / local PGlite) · three.js + React Three Fiber. Details: README.md.

## Commands
- Dev: `cp .env.example .env.local && npm run dev`
- Build: `npm run build` (no database needed)
- Test: `npm test` (Vitest) · `npm run test:e2e` (Playwright, after `npm run build`; set `PW_CHROMIUM_PATH` in containers)
- Lint: `npm run lint` · `npm run typecheck`

## Dream house
- Data lives in `src/features/house/data/` (plan + rooms); max 20 items per room, enforced by tests. Guide: docs/TRAUMHAUS.md.

## Conventions
- Claude Code config lives in `.claude/settings.json` (devops plugin from the `dotclaude` marketplace); keep it tracked.
- Never commit secrets — `.env*` and key files are gitignored; share `.env.example` instead.
- Deploys go through `.github/workflows/deploy.yml` (Vercel CLI, Aryo's account) — see docs/DEPLOYMENT.md.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
