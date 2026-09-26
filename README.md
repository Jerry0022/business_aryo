# business_aryo

Project workspace for the `business_aryo` Claude Code cloud environment.

## Claude Code setup

`.claude/settings.json` registers the `dotclaude` marketplace and enables the `devops` plugin for local sessions.

Cloud sessions do not install plugins from `.claude/settings.json`. The `business_aryo` cloud environment installs the plugin in its setup script instead:

```bash
#!/bin/bash
claude plugin marketplace add Jerry0022/dotclaude || true
claude plugin install devops@dotclaude || true
```

GitHub access in cloud sessions runs through the built-in GitHub proxy (`gh` is pre-installed and authenticated); no `GH_TOKEN` is needed.
