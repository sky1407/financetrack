# FinanceTrack

Full-stack personal finance tracker — accounts, categories, transactions, monthly budgets and a dashboard with charts. Built as a modern, fully typed full-stack project (React + Express + PostgreSQL) to demonstrate practical web application development skills.

**Live demo:** https://financetrack-lemon.vercel.app/login?demo=1 (signs you in instantly as a demo user, no registration needed — or register your own account)

## Tech stack

- **Backend:** Node.js + Express, TypeScript (`strict` mode), [Prisma ORM](https://www.prisma.io/) on top of **PostgreSQL**, JWT authentication (httpOnly cookie) + bcrypt password hashing, input validation via [Zod](https://zod.dev/), rate limiting on auth endpoints.
- **Frontend:** React + Vite + TypeScript, [Tailwind CSS](https://tailwindcss.com/), [TanStack Query](https://tanstack.com/query) for server-state management, `react-hook-form` + Zod for form validation, [Recharts](https://recharts.org/) for charts.
- **Database:** PostgreSQL 16, spun up via Docker Compose — no manual DB install needed on your machine.
- **Deployment:** frontend on Vercel, backend + PostgreSQL on Render (see `render.yaml` / `client/vercel.json`).

## Why this stack

The project deliberately uses a **real relational database (PostgreSQL) with an ORM and migrations** instead of a zero-config option (SQLite), to demonstrate working with a production-realistic database setup — schema design, migrations, indexes, transactions, foreign keys. TypeScript across the whole stack (backend and frontend) gives strict typing and a shared data shape between the API and the UI.

## Project structure

```
Newapp/
  docker-compose.yml     PostgreSQL container
  render.yaml             Render Blueprint (Postgres + API web service)
  server/                 Express REST API
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
