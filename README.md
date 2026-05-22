# FishProject

A full-stack fish farm management system built for pond operations. Administrators manage all projects from a central dashboard; operators are scoped to their assigned project only.

## Features

- **Project Management** — Create and manage parent projects with owner details and contact info
- **Document Tracking** — Attach deeds, NID copies, guarantor cheques, and trade licenses to each project
- **Inventory Management** — Record fish quantity, size (mon), and total weight per pond sub-project
- **Feed Log Management** — Track daily feed usage, opening balance, addition, and closing balance
- **Role-Based Access Control** — Admins have full access; operators are restricted to their assigned project
- **Secure File Storage** — Documents uploaded directly to Vercel Blob with private access
- **Project-Scoped Users** — Each operator account can be locked to a single project

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | React 19 + Tailwind CSS |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth.js v4 (JWT sessions) |
| File storage | Vercel Blob |
| Validation | Zod |
| Math precision | Decimal.js |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or Vercel Postgres / Neon)

### Local setup

```bash
# 1. Clone the repo
git clone https://github.com/nayeem-hossain/fishproject.git
cd fishproject

# 2. Install dependencies
npm install

# 3. Copy and fill in environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, AUTH_SECRET, etc.

# 4. Run database migration
npm run prisma:deploy

# 5. Seed initial admin and operator accounts
npm run db:seed

# 6. (Optional) Load demo data
npm run db:seed-demo

# 7. Start the development server
npm run dev
```

The app runs on [http://localhost:3001](http://localhost:3001) by default.

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | PostgreSQL direct connection (for migrations) |
| `AUTH_SECRET` | Random secret for NextAuth session signing |
| `NEXTAUTH_SECRET` | Same value as `AUTH_SECRET` |
| `NEXTAUTH_URL` | Full URL of the deployed app |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token |
| `BOOTSTRAP_ADMIN_PASSWORD` | Password for the seeded `admin` account |
| `BOOTSTRAP_OPERATOR_PASSWORD` | Password for the seeded `operator` account |

### Default Accounts (after seeding)

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Admin — full access |
| `operator` | `operator123` | Operator — view all projects |

> Change these passwords after first login or before deploying to production.

## Project Structure

```
├── app/
│   ├── (auth)/login/          Login page
│   ├── (protected)/           Auth-guarded routes
│   │   ├── dashboard/         Overview metrics
│   │   ├── projects/          Project list + detail
│   │   └── users/             User management (admin only)
│   ├── actions/               Server actions (CRUD + RBAC)
│   └── api/
│       ├── auth/              NextAuth route
│       └── blob/              Upload token + download proxy
├── components/                Client UI components
├── lib/                       DB client, RBAC, Blob, math, validation
├── prisma/                    Schema, migrations, seed scripts
└── types/                     NextAuth type extensions
```

## User Roles

| Capability | Admin | Operator |
|---|---|---|
| View all projects | ✅ | ✅ (or scoped to one) |
| Create / edit / delete projects | ✅ | ❌ |
| Add / edit / delete documents | ✅ | ❌ |
| View documents & files | ✅ | ✅ |
| Add / edit inventory | ✅ | ✅ |
| Add / edit feed logs | ✅ | ✅ |
| Manage users | ✅ | ❌ |

## Deployment

This project is configured for one-click deployment on **Vercel**.

1. Push to GitHub
2. Import the repo in [vercel.com/new](https://vercel.com/new)
3. Add environment variables (see `.env.example`)
4. Deploy — Vercel runs `prisma generate` automatically via `postinstall`
5. Run `npm run prisma:deploy` and `npm run db:seed` against your production database

## License

MIT
