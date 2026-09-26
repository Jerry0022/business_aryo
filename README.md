# business_aryo

Website of **Maximilian Parkett** (working name; Bodenleger in NRW, owner Aryo Sabouri, claim „Da stehst du drauf.“) plus a private studio with the **Werkbank** admin area. Brand, tone and business rules: [`docs/konzept/markenkonzept.md`](docs/konzept/markenkonzept.md).

- **Public site** (`/`): landing page in design direction A „Aufmaß“ (technical drawing on screed grey) around the question „Wie viel willst du selbst machen?“: live contingent counter from the Werkbank calendar, the three ways (Machen lassen, Selbst machen, Für Profis) plus an emergency entry, the 7-step Boden-Check with Bodenprofil, registration for the monthly Boden-Sprechstunde, services (prices only once set in the Werkbank), subscriptions and applications for projects and partners. Form entries are stored as leads for the Werkbank.
- **Ratgeber** (`/ratgeber`): seven statically generated advice articles in six pillars, content as typed data in `src/content/ratgeber/`, with the interactive Kosten-pro-Jahr-Rechner, `Article` JSON-LD and per-article Open Graph images. Legal pages: `/impressum`, `/datenschutz`. Optional PostHog analytics behind a cookie-consent banner (off until `NEXT_PUBLIC_POSTHOG_KEY` is set, see [docs/ANALYTICS.md](docs/ANALYTICS.md)).
- **Studio** (`/studio`, login required): an interactive 3D **dream house** (single-story villa with roof terrace on a mountain above a city) and, for admins, the **user management**.

## Stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS 4, `next/font` (Fraunces + Manrope, self-hosted) |
| Auth | Better Auth (email + password, admin plugin, DB rate limiting) |
| Database | Drizzle ORM · Neon Postgres in production · embedded PGlite locally (no Docker) |
| 3D | three.js · React Three Fiber · drei · postprocessing — every model and texture is generated in code |
| Tests | Vitest (unit) · Playwright (e2e, desktop + mobile) |
| CI/CD | GitHub Actions → Vercel CLI deploy (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)) |

## Getting started

```bash
npm ci
cp .env.example .env.local   # PGlite database in ./.data, dev secrets
npm run dev                  # migrates the local DB, then http://localhost:3000
```

Create the admin account once at <http://localhost:3000/einrichten> (setup code from `ADMIN_SETUP_TOKEN`, locally `dev-setup-token`). Only e-mails listed in `ADMIN_EMAILS` (default `aryo.kontakt@gmail.com`) can be set up as admin; everybody else is invited by an admin in the studio.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Apply migrations, start the dev server |
| `npm run build` / `npm start` | Production build / server (the build needs no database) |
| `npm run vercel-build` | Migrations + build (used by Vercel) |
| `npm run lint` · `npm run typecheck` · `npm test` | ESLint · `tsc` · Vitest |
| `npm run check` | All three of the above |
| `npm run test:e2e` | Playwright against a production build (`npm run build` first) with a fresh PGlite DB |
| `npm run db:generate` | Create a migration after changing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |

In containers with a pre-installed Chromium set `PW_CHROMIUM_PATH` (e.g. `/opt/pw-browsers/chromium`) instead of running `playwright install`.

## Project structure

```
src/
  app/                 routes: public site, /login, /einrichten, /studio/*, /api/auth
  components/site/     public website sections (parquet SVG generators in parquet/)
  components/auth/     login + first-admin setup forms
  components/studio/   studio shell, user management, account settings
  features/house/      3D dream house
    data/              floor plan (plan.ts) and rooms with ≤ 20 items each (rooms.ts)
    models/            procedural model catalog, materials, geometry builder
    engine/            pure logic: sun path, terrain, city, walk collisions (unit tested)
    scene/             React Three Fiber scene, controls, effects
    ui/                HUD, joysticks, zustand store
  db/                  Drizzle schema + client (Postgres / PGlite)
  lib/                 auth, session helpers, admin config
drizzle/               SQL migrations
tests/e2e/             Playwright specs
docs/                  deployment, go-live checklist, dream house guide
```

## Studio controls

| | Desktop | Mobile |
|---|---|---|
| Overview | WASD / arrows move · drag rotates · wheel zooms · Q/E rotate · Shift faster | stick moves · swipe rotates · pinch zooms |
| Walk mode | click to look (pointer lock) · WASD walk · Shift run · Esc releases the mouse | left stick walks · right stick looks |
| Shortcuts | `V` walk/overview · `N` day/night · `H` roof cut-away | — |

The time slider and the Tag/Nacht toggle change sun, sky, lighting, interior lamps and the city lights. Graphics quality (Hoch/Mittel/Niedrig) is detected per device and can be changed in the HUD or via `?quality=low|medium|high`.

## Security notes

- Public sign-up is disabled; accounts are created by admins. The first admin needs the server-side `ADMIN_SETUP_TOKEN`, and `/einrichten` closes as soon as an admin exists.
- Main admins (`ADMIN_EMAILS`) are always admins and cannot be banned, demoted, deleted or impersonated through the admin API.
- Sign-in is rate limited (5/min) with shared database storage; banned users are signed out immediately.

## Further docs

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Vercel (Aryo's account) + Neon setup
- [docs/GO-LIVE.md](docs/GO-LIVE.md) — open items before the site goes public
- [docs/ANALYTICS.md](docs/ANALYTICS.md) — PostHog analytics + cookie banner setup
- [docs/TRAUMHAUS.md](docs/TRAUMHAUS.md) — how to evolve the dream house together

## Concept

The brand and business concept for the company website (name, values, positioning, business model, subscriptions, admin area, design directions) lives in [`docs/konzept/markenkonzept.md`](docs/konzept/markenkonzept.md).

## Claude Code setup

`.claude/settings.json` registers the `dotclaude` marketplace and enables the `devops` plugin for local sessions. Cloud sessions do not install plugins from `.claude/settings.json`; the `business_aryo` cloud environment installs it in its setup script instead:

```bash
#!/bin/bash
claude plugin marketplace add Jerry0022/dotclaude || true
claude plugin install devops@dotclaude || true
```

GitHub access in cloud sessions runs through the built-in GitHub proxy (`gh` is pre-installed and authenticated); no `GH_TOKEN` is needed.

## Deployment (Vercel)

The Vercel project `business-aryo` (team `business-aryo`) is linked to this repository: every push to `main` deploys to production at https://business-aryo.vercel.app, and every pull request gets a preview deployment. Production builds run the database migrations first (`npm run vercel-build`); the Neon database and the runtime secrets are set up as described in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

For Claude to drive Vercel from a cloud session, the `business_aryo` environment needs:

- **Environment variable** `VERCEL_TOKEN` — set the value to the token only, without a `VERCEL_TOKEN=` prefix.
- **Network access** to `vercel.com` and `api.vercel.com`.

The Vercel CLI is not pre-installed; `npx vercel` works, or add `npm install -g vercel || true` to the setup script.
