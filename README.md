# FinanceTrack

Full-stack appka na sledovanie osobných financií — účty, kategórie, transakcie, mesačné rozpočty a dashboard s grafmi. Postavená ako moderný, typovaný full-stack projekt (React + Express + PostgreSQL) na demonštráciu praktických skúseností s vývojom webových aplikácií.

## Tech stack

- **Backend:** Node.js + Express, TypeScript (`strict` mód), [Prisma ORM](https://www.prisma.io/) nad **PostgreSQL**, JWT autentifikácia (httpOnly cookie) + bcrypt hashovanie hesiel, validácia vstupov cez [Zod](https://zod.dev/), rate limiting na auth endpointoch.
- **Frontend:** React + Vite + TypeScript, [Tailwind CSS](https://tailwindcss.com/), [TanStack Query](https://tanstack.com/query) na správu dát zo servera, `react-hook-form` + Zod na validáciu formulárov, [Recharts](https://recharts.org/) na grafy.
- **Databáza:** PostgreSQL 16, pripravená cez Docker Compose — žiadna manuálna inštalácia DB na stroj.

## Prečo tento stack

Projekt vedome používa **skutočnú relačnú databázu (PostgreSQL) a ORM s migráciami** namiesto zero-config riešenia (SQLite), aby demonštroval prácu s produkčne bežným databázovým setupom — schéma, migrácie, indexy, transakcie, cudzie kľúče. TypeScript naprieč celým stackom (backend aj frontend) dáva prísne typovanie a zdieľateľný tvar dát medzi API a UI.

## Štruktúra projektu

```
Newapp/
  docker-compose.yml     PostgreSQL kontajner
  server/                Express REST API
    prisma/               schema.prisma + seed skript
    src/
      config/              env validácia, Prisma client
      middleware/           auth (JWT), error handler, zod validácia
      modules/               auth, accounts, categories, transactions, budgets, dashboard
        <modul>/<modul>.schema.ts     Zod validačné schémy
        <modul>/<modul>.service.ts    business logika + Prisma dotazy
        <modul>/<modul>.controller.ts HTTP vrstva
        <modul>/<modul>.routes.ts     Express router
      utils/                AppError, catchAsync, JWT helpery
  client/                 React + Vite frontend
    src/
      api/                  typované HTTP volania na backend (axios)
      components/           ui/ (Button, Input, Modal, ...), layout/, charts/, + moduly (accounts/, categories/, ...)
      context/, hooks/       AuthContext, useAuth, useAccounts, useTransactions, ...
      pages/                 DashboardPage, TransactionsPage, AccountsPage, CategoriesPage, BudgetsPage
      routes/                ProtectedRoute
```

Každý doménový modul (accounts, categories, transactions, budgets, dashboard) má na backende rovnakú štruktúru `schema → service → controller → routes`, na frontende zodpovedajúci `api/*.ts` + `hooks/use*.ts` + komponenty v samostatnom priečinku. Nič nie je "na jednej hromade" — pridanie novej funkcie znamená pridať nový modul, nie meniť existujúce súbory.

## Funkcie

- Registrácia / prihlásenie / odhlásenie (JWT v httpOnly cookie, heslá hashované cez bcrypt)
- Správa účtov (hotovosť, bankový účet, karta, sporiaci účet...) s automaticky dopočítaným aktuálnym zostatkom
- Vlastné kategórie príjmov a výdavkov (farba + ikona) — nový účet dostane sadu predvolených kategórií
- Transakcie s filtrami (typ, účet, kategória, dátumový rozsah, fulltext v poznámke) a stránkovaním
- Mesačné rozpočty na výdavkové kategórie s vizuálnym progresom míňania
- Dashboard: celkový zostatok, príjmy/výdavky za mesiac, koláčový graf výdavkov podľa kategórií, stĺpcový graf príjmov vs. výdavkov za posledných 6 mesiacov

## Spustenie lokálne

Vyžaduje Node.js 18+ a Docker (Docker Desktop na Windows/Mac, alebo Docker Engine na Linuxe).

### 1. Databáza (PostgreSQL cez Docker)

```bash
docker compose up -d
```

Tým sa spustí Postgres na `localhost:5432` (údaje v `docker-compose.yml`: `financetrack` / `financetrack`).

### 2. Backend

```bash
cd server
npm install
cp .env.example .env        # predvolené hodnoty sedia s docker-compose.yml
npm run prisma:migrate      # vytvorí tabuľky v databáze
npm run seed                # naplní demo účtom, kategóriami a transakciami
npm run dev                 # API beží na http://localhost:4000
```

Demo prihlásenie po seede: **e-mail** `demo@financetrack.app`, **heslo** `demo1234`.

### 3. Frontend

V druhom termináli:

```bash
cd client
npm install
npm run dev                 # React beží na http://localhost:5173
```

Vite dev server proxuje `/api` na backend (`vite.config.ts`), takže žiadne CORS starosti počas vývoja.

### Prisma Studio (voliteľné)

Vizuálny prehľad dát v databáze:

```bash
cd server && npm run prisma:studio
```

## Produkčný build

```bash
cd server && npm run build && npm start
cd client && npm run build   # výstup v client/dist, servuj cez ľubovoľný statický hosting alebo Express static
```

## Bezpečnosť — čo appka rieši

- Heslá nikdy neopúšťajú server v čitateľnej podobe (bcrypt, 12 salt rounds)
- JWT v `httpOnly` + `sameSite=lax` cookie (nie je čitateľný z JS, obmedzená CSRF plocha)
- Všetky vstupy validované cez Zod na hranici API, nie len na frontende
- Každý dotaz na dáta (účty, kategórie, transakcie, rozpočty) je zviazaný na `userId` prihláseného používateľa — nie je možné pristúpiť k cudzím dátam len uhádnutím ID
- Rate limiting na `/api/auth/*` proti brute-force útokom na heslá
- Cudzie kľúče a databázové constrainty (napr. kategóriu použitú v transakcii nejde zmazať) chránia integritu dát aj keby zlyhala validácia v aplikačnej vrstve

## Možné rozšírenia (going further)

- Opakované (recurring) transakcie — napr. mesačný nájom sa pridá automaticky
- Sporiace ciele (savings goals) s progresom
- Export transakcií do CSV / PDF report
- Viac mien naraz s prepočtom kurzu
- Refresh token rotácia namiesto jedného dlho platného JWT

## Licencia

MIT
