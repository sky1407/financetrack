# FinanceTrack

Full-stack personal finance tracker — accounts, categories, transactions, monthly budgets and a dashboard with charts. Built as a modern, fully typed full-stack project (React + Express + PostgreSQL) to demonstrate practical web application development skills.

**Live demo:** https://financetrack-lemon.vercel.app/login?demo=1 — opens straight into a populated dashboard, no registration or login required.

The public demo runs **entirely client-side** (seeded, in-memory data, no API calls), so it always loads instantly and never depends on a backend/database being awake — see [Demo mode](#demo-mode) below. To try the real full-stack flow (register your own account, real JWT auth, data persisted in PostgreSQL), use "alebo sa prihlás vlastným účtom" on the login page instead — that talks to a backend you deploy yourself (see "Deployment" below).

## Tech stack

- **Backend:** Node.js + Express, TypeScript (`strict` mode), [Prisma ORM](https://www.prisma.io/) on top of **PostgreSQL**, JWT authentication (httpOnly cookie) + bcrypt password hashing, input validation via [Zod](https://zod.dev/), rate limiting on auth endpoints.
- **Frontend:** React + Vite + TypeScript, [Tailwind CSS](https://tailwindcss.com/), [TanStack Query](https://tanstack.com/query) for server-state management, `react-hook-form` + Zod for form validation, [Recharts](https://recharts.org/) for charts.
- **Database:** PostgreSQL 16, spun up via Docker Compose — no manual DB install needed on your machine.
- **Deployment:** frontend on Vercel. The Express/PostgreSQL backend is **not currently kept running** — the sections below document how to deploy it yourself (Fly.io + Neon), since the public demo link no longer needs it.

## Demo mode

`client/src/lib/demoMode.ts` + `client/src/lib/demoStore.ts` implement a small in-memory "backend" that runs entirely in the browser: seeded accounts, categories, ~6 months of transactions and budgets, with the same business rules as the real API (account balances, budget progress, dashboard aggregation). `client/src/api/*.ts` transparently routes to it instead of the real backend whenever demo mode is active (`?demo=1`, or the "Vyskúšať demo" button), so every page, chart and CRUD action works without a server. Data resets on a full page reload — expected for a public, shared demo link.

## Why this stack

The project deliberately uses a **real relational database (PostgreSQL) with an ORM and migrations** instead of a zero-config option (SQLite), to demonstrate working with a production-realistic database setup — schema design, migrations, indexes, transactions, foreign keys. TypeScript across the whole stack (backend and frontend) gives strict typing and a shared data shape between the API and the UI.

## Project structure

```
Newapp/
  docker-compose.yml     PostgreSQL container (local dev only)
  server/                 Express REST API
    Dockerfile              Fly.io build image
    fly.toml                Fly.io app + release_command (prisma migrate deploy)
    prisma/                schema.prisma + seed script
    src/
      config/               env validation, Prisma client
      middleware/            auth (JWT), error handler, zod validation
      modules/                auth, accounts, categories, transactions, budgets, dashboard
        <module>/<module>.schema.ts     Zod validation schemas
        <module>/<module>.service.ts    business logic + Prisma queries
        <module>/<module>.controller.ts HTTP layer
        <module>/<module>.routes.ts     Express router
      utils/                 AppError, catchAsync, JWT helpers
  client/                  React + Vite frontend
    vercel.json              Vercel deploy config (SPA rewrites)
    src/
      api/                   typed HTTP calls to the backend (axios)
      components/            ui/ (Button, Input, Modal, ...), layout/, charts/, + per-domain folders (accounts/, categories/, ...)
      context/, hooks/        AuthContext, useAuth, useAccounts, useTransactions, ...
      pages/                  DashboardPage, TransactionsPage, AccountsPage, CategoriesPage, BudgetsPage
      routes/                 ProtectedRoute
```

Every domain module (accounts, categories, transactions, budgets, dashboard) follows the same `schema → service → controller → routes` structure on the backend, with a matching `api/*.ts` + `hooks/use*.ts` + components folder on the frontend. Nothing lives in one giant pile — adding a feature means adding a new module, not editing existing files.

## Features

- Register / log in / log out (JWT in an httpOnly cookie, passwords hashed with bcrypt)
- Account management (cash, bank account, card, savings...) with an automatically computed current balance
- Custom income/expense categories (color + icon) — every new account gets a set of default categories
- Transactions with filters (type, account, category, date range, note search) and pagination
- Monthly budgets per expense category with a visual spending progress bar
- Dashboard: total balance, monthly income/expense, a pie chart of spending by category, a bar chart of income vs. expense over the last 6 months

## Running locally

Requires Node.js 18+ and Docker (Docker Desktop on Windows/Mac, or Docker Engine on Linux).

### 1. Database (PostgreSQL via Docker)

```bash
docker compose up -d
```

This starts Postgres on `localhost:5432` (credentials in `docker-compose.yml`: `financetrack` / `financetrack`).

### 2. Backend

```bash
cd server
npm install
cp .env.example .env        # defaults already match docker-compose.yml
npm run prisma:migrate      # creates the database tables
npm run seed                # seeds a demo account, categories and transactions
npm run dev                 # API runs on http://localhost:4000
```

Demo login after seeding: **email** `demo@financetrack.app`, **password** `demo1234`.

### 3. Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev                 # React runs on http://localhost:5173
```

The Vite dev server proxies `/api` to the backend (`vite.config.ts`), so there's no CORS setup needed during development.

### Prisma Studio (optional)

Visual browser for the database contents:

```bash
cd server && npm run prisma:studio
```

## Production build

```bash
cd server && npm run build && npm start
cd client && npm run build   # output in client/dist, serve via any static host or Express static
```

## Deployment (optional — self-hosting the real backend)

The live demo link doesn't need any of this (see [Demo mode](#demo-mode) above). Follow these steps only if you want the real backend running too — e.g. to test actual registration/login, JWT auth and PostgreSQL persistence.

### 1. Database — Neon

1. Create a free project at [neon.tech](https://neon.tech/).
2. Copy the pooled connection string (`postgresql://...`) — this becomes `DATABASE_URL`.

### 2. Backend — Fly.io

```bash
# install flyctl if you don't have it: https://fly.io/docs/flyctl/install/
fly auth login

cd server
fly launch --no-deploy   # detects fly.toml, keep the existing app name or set your own

fly secrets set \
  DATABASE_URL="<neon connection string>" \
  JWT_SECRET="$(openssl rand -hex 32)" \
  CLIENT_ORIGIN="https://financetrack-lemon.vercel.app"

fly deploy
```

`release_command` in `fly.toml` runs `prisma migrate deploy` automatically before each deploy, so the schema stays in sync. Check health: `curl https://<your-app>.fly.dev/api/health`.

### 3. Frontend — Vercel

In the Vercel project settings, set the environment variable `VITE_API_URL` to `https://<your-app>.fly.dev`, then redeploy the frontend so it points at the new backend. Until `VITE_API_URL` is set, "register" / "log in with your own account" on the live site will fail (no backend to call) — only the `?demo=1` client-side demo works, which is the intended default.

## Security — what the app handles

- Passwords never leave the server in plain text (bcrypt, 12 salt rounds)
- JWT in an `httpOnly` cookie (`sameSite=lax` in dev, `sameSite=none; secure` in production for cross-origin frontend/backend) — not readable from JS, limited CSRF surface
- All input validated with Zod at the API boundary, not just on the frontend
- Every data query (accounts, categories, transactions, budgets) is scoped to the logged-in user's `userId` — you can't reach someone else's data just by guessing an ID
- Rate limiting on `/api/auth/*` against password brute-forcing
- Foreign keys and database constraints (e.g. a category used in a transaction can't be deleted) protect data integrity even if application-level validation is bypassed

## Possible extensions (going further)

- Recurring transactions — e.g. a monthly rent payment added automatically
- Savings goals with progress tracking
- Export transactions to CSV / PDF report
- Multi-currency support with exchange rate conversion
- Refresh token rotation instead of a single long-lived JWT

## License

MIT
