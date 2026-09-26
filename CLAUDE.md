# business_aryo

## Language
- Always talk to the user in German, even when their prompt is short or in English. Code, commit messages and PRs stay in English.

## Stack
TODO — no manifest yet (`package.json`, `pyproject.toml`, …).

## Commands
- Build: `TODO`
- Test: `TODO`
- Lint: `TODO`

## Deployment
- Vercel project `business-aryo` in team `business-aryo`, Git-linked to `aryoyeah/business_aryo`.
- Push to `main` → production (https://business-aryo.vercel.app); every PR gets a preview deployment.
- Cloud sessions reach Vercel via the `VERCEL_TOKEN` env var: `npx vercel <cmd> --scope business-aryo`. The Vercel MCP connector is linked to a different account and does not see this team.
- Runtime env vars live in the Vercel project settings, not in the repo.

## Conventions
- Claude Code config lives in `.claude/settings.json` (devops plugin from the `dotclaude` marketplace); keep it tracked.
- Never commit secrets — `.env*` and key files are gitignored; share `.env.example` instead.
