---
description: "Use when working on TypeScript or Node.js code, npm scripts, API handlers, or runtime/build issues."
applyTo: "**/*.{ts,tsx,js,mjs,cjs}"
---
# TypeScript and Node Guidelines

- Keep strict typing where available; avoid `any` unless justified.
- Prefer small, focused modules and clear function contracts.
- Validate external input at API boundaries.
- Add or update tests for changed behavior.
- Use existing lint and format tooling defined in project configs.
