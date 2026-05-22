# AquaManager — Fish Farm Management System

A full-stack Next.js 15 (App Router) application for managing fish farm projects, inventory, documents, and feed consumption with role-based access control.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Backend | Next.js Server Actions |
| Database | PostgreSQL via Prisma ORM |
| Storage | Vercel Blob |
| Auth | NextAuth.js v5 (JWT) |
| Deployment | Vercel |

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env.local
# Fill in your Vercel Postgres and Blob credentials
```

### 3. Set up the database
```bash
npm run db:migrate     # Run Prisma migrations
npm run db:seed        # Create default admin user (admin / admin123)
```

### 4. Run locally
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and log in with `admin` / `admin123`.

---

## Vercel Deployment

1. Push this repo to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add a **Vercel Postgres** database (Storage → Create → Postgres)
4. Add a **Vercel Blob** store (Storage → Create → Blob)
5. Copy the auto-generated environment variables to your project
6. Add `AUTH_SECRET` (run `openssl rand -base64 32`)
7. Deploy — Vercel will run `prisma generate` and `prisma migrate` via `postinstall` if you add:
   ```json
   "postinstall": "prisma generate"
   ```
   Then run `npm run db:migrate` manually once via Vercel CLI or dashboard.

---

## Role Matrix

| Route | Admin | Operator |
|---|---|---|
| `/dashboard` | Full metrics | Limited metrics |
| `/projects` | CRUD | Read + Update |
| `/projects/[id]/documents` | CRUD | Read + Update |
| `/projects/[id]/inventory` | CRUD | Create + Read + Update |
| `/projects/[id]/feed` | CRUD | Create + Read + Update |
| `/users` | CRUD | ❌ Redirected |

---

## Math Logic

| Formula | Expression |
|---|---|
| 1 Mon = | 40 kg |
| Per Piece Size Factor | 40 ÷ size |
| Total Weight (kg) | factor × quantity |
| Closing Balance | opening + addition − daily use |

### Verified test cases
| Qty | Size | Expected Weight |
|---|---|---|
| 50,000 | 30 | 66,667 kg ✅ |
| 70,000 | 20 | 140,000 kg ✅ |

---

## Project Structure

```
src/
├── app/
│   ├── (app)/                    # Authenticated layout group
│   │   ├── dashboard/
│   │   ├── projects/
│   │   │   └── [id]/
│   │   │       ├── documents/
│   │   │       ├── inventory/
│   │   │       └── feed/
│   │   └── users/
│   ├── api/auth/[...nextauth]/
│   └── login/
├── actions/                      # Server Actions (backend logic)
├── components/                   # Shared UI components
├── lib/
│   ├── math.ts                   # Calculation engine + tests
│   ├── prisma.ts                 # DB client singleton
│   └── blob.ts                   # File upload utility
├── middleware.ts                 # RBAC enforcement
└── types/
    └── next-auth.d.ts
auth.ts                           # NextAuth configuration
prisma/
├── schema.prisma
└── seed.ts
```
