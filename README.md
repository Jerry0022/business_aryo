# business_aryo

Project workspace for the `business_aryo` Claude Code cloud environment.

## Concept

The brand and business concept for the company website (name, values, positioning, business model, subscriptions, admin area, design directions) lives in [`docs/konzept/markenkonzept.md`](docs/konzept/markenkonzept.md).

## Claude Code setup

`.claude/settings.json` registers the `dotclaude` marketplace and enables the `devops` plugin for local sessions.

Cloud sessions do not install plugins from `.claude/settings.json`. The `business_aryo` cloud environment installs the plugin in its setup script instead:

```bash
#!/bin/bash
claude plugin marketplace add Jerry0022/dotclaude || true
claude plugin install devops@dotclaude || true
```

GitHub access in cloud sessions runs through the built-in GitHub proxy (`gh` is pre-installed and authenticated); no `GH_TOKEN` is needed.

## Deployment (Vercel)

The Vercel project `business-aryo` (team `business-aryo`) is linked to this repository: every push to `main` deploys to production at https://business-aryo.vercel.app, and every pull request gets a preview deployment.

For Claude to drive Vercel from a cloud session, the `business_aryo` environment needs:

- **Environment variable** `VERCEL_TOKEN` — set the value to the token only, without a `VERCEL_TOKEN=` prefix.
- **Network access** to `vercel.com` and `api.vercel.com`.

The Vercel CLI is not pre-installed; `npx vercel` works, or add `npm install -g vercel || true` to the setup script.
