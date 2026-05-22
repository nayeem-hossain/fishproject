# Copilot Starter Kit

Portable Copilot bootstrap kit for new workspaces.

## Goal

Copy this folder into any new repository, then run one command once. After first run, workspace re-opens auto-sync the managed Copilot setup.

## What It Installs

Workspace files (materialized to workspace root):
- `.github/copilot-instructions.md`
- `.github/instructions/*.instructions.md`
- `.github/agents/*.agent.md`
- `.github/prompts/*.prompt.md`
- `.mcp.json`
- `.vscode/tasks.json`
- `.vscode/settings.json`
- `.copilot-kit/state.json`

Optional user profile files:
- `%APPDATA%/Code/User/prompts/**/*.prompt.md`
- `%APPDATA%/Code/User/prompts/**/*.instructions.md`
- `%APPDATA%/Code/User/prompts/**/*.agent.md`

## Quick Start

From target workspace root:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\copilot-starter-kit\scripts\apply-kit.ps1 -TargetWorkspace . -KitTier standard -InstallUserProfile
```

Then reopen workspace. Auto-sync runs on folder open via task runner.

Optional (automatic reopen after first manual bootstrap):

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\copilot-starter-kit\scripts\apply-kit.ps1 -TargetWorkspace . -KitTier standard -InstallUserProfile -ReopenWorkspace
```

## First-Run vs Auto-Run

- First run: execute `apply-kit.ps1` manually once after copying `copilot-starter-kit` into workspace.
- After first run: `.vscode/tasks.json` enables folder-open auto-sync (`Copilot Kit: Auto Sync`).
- If automatic tasks are blocked by trust policy, run the same command manually.

## Parameters

- `-KitTier minimal|standard|heavy` selects MCP setup tier. Heavy is explicit opt-in.
- `-GitMode Ask|Shared|LocalOnly` controls whether managed files are intended for commit or kept local.
- `-InstallUserProfile` copies personal prompts/instructions/agents into user prompt location.
- `-ReopenWorkspace` requests VS Code reopen after a Manual bootstrap (skipped in Auto mode).
- `-Mode Auto|Manual` is used internally by folder-open auto-sync.

## Profiles

- `minimal`: Lowest friction baseline
- `standard`: Balanced day-to-day setup
- `heavy`: Full setup baseline

Default is `standard`.

## Selected Heavy MCP Baseline

- GitHub
- Context7
- Memory
- Sequential Thinking
- Playwright
- Vercel

## Notes

- This kit is idempotent: reruns should converge to the same managed state.
- Generated instructions are one-way from workspace `AGENTS.md` into `.github/copilot-instructions.md`.
- Auto-update overwrites all managed files on each sync.
- Keep project-specific custom guidance in additional unmanaged instruction files if needed.

## Heavy Tier Opt-In

Use heavy tier only when you explicitly need extra MCP coverage:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\copilot-starter-kit\scripts\apply-kit.ps1 -TargetWorkspace . -KitTier heavy
```
