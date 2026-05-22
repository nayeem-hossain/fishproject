# FishProject ADR

Living source of truth for implementation plans, working mode, and progress checkpoints.

## Working Mode
- Read this file before each implementation slice.
- Update it after each slice with progress, blockers, and the next checkpoint.
- Keep changes small, verifiable, and reversible.
- Record open questions here before changing the schema or route contracts.

## Current Baseline
- Next.js App Router with React and Tailwind CSS.
- PostgreSQL via Prisma ORM.
- NextAuth.js with JWT sessions.
- Vercel Blob for document uploads.
- Strict RBAC in middleware, route handlers, server actions, and page guards.
- Decimal-based inventory and feed calculations.

## Phase Plan
1. Scaffold the app shell and tooling.
2. Wire Prisma schema, seed data, and database helpers.
3. Add auth, RBAC, and protected layouts.
4. Build the dashboard, projects, and nested project shell.
5. Add documents, inventory, feed, and users modules.
6. Add tests, deployment checks, and hardening.

## Open Questions
- How should "active operations" be defined for the operator dashboard?
- Should sub-projects stay as text fields or become a dedicated pond table later?
- Should parent project deletion cascade or be restricted once child records exist?

## Progress Log
- 2026-05-22: Implementation started. ADR created, app scaffold added, auth/RBAC skeleton added, Prisma schema added, and project/user start points created.
- 2026-05-22: Documents, inventory, and feed server actions were added with RBAC checks, Blob upload handling, Decimal-backed math, and project-scoped forms/tables. `npm install`, `npm run typecheck`, and `npm run build` all pass. Next checkpoint: initial Prisma migration and seed execution against Vercel Postgres.
- 2026-05-22: Initial Prisma migration SQL was generated from the schema, `prisma/migrations/20260522190000_init/migration.sql` was added, and Prisma schema validation passes with a temporary `DATABASE_URL`. Next checkpoint: connect to Vercel Postgres and run the migration/seed flow.
- 2026-05-22: Demo-style modal CRUD was transplanted for documents, inventory, and feed. Nested project routes now use reusable client tables and the production build passes with the `/projects/[id]/documents`, `/projects/[id]/inventory`, and `/projects/[id]/feed` routes intact. Next checkpoint: final smoke testing and any remaining hardening.