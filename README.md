# Clinic Shift Scheduler

A fullstack web app for a small clinic to manage staff shifts.

Managers create shifts and track coverage. Staff (doctors, nurses, receptionists) claim open shifts. Legacy spreadsheet data is cleaned and imported automatically on seed, and again through a manager upload UI.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Prisma** + **SQLite**
- **iron-session** auth
- **Tailwind CSS 4**
- **Vitest** for tests

## Features

- Manager and staff roles (staff have a profession)
- Create / edit / delete shifts with role requirements
- Claim and unclaim with server-side rules:
  - profession capacity must not be exceeded
  - no overlapping shifts for the same person
- Manager can assign any staff member (same rules)
- Concurrent claim safety (capacity re-checked after insert)
- Dirty CSV import for `staff.csv` and `shifts.csv`
- Manager CSV upload using the same import logic
- Import report (accepted / rejected / merged rows)
- Coverage dashboard: week view, staffing status, missing roles, jump to any week

Design decisions are documented in [`DECISIONS.md`](./DECISIONS.md).

## Seeded logins

| Role | Email | Password |
|------|-------|----------|
| Manager | `manager@clinicmail.test` | `manager123` |
| Doctor | `doctor@clinicmail.test` | `staff123` |
| Nurse | `nurse@clinicmail.test` | `staff123` |
| Receptionist | `reception@clinicmail.test` | `staff123` |

Staff imported from `staff.csv` also use password `staff123`.

Imported shifts are mostly in **August 2026**. Use that range on Shifts and Coverage.

## Local setup

```bash
npm install
npm run setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run setup` runs migrations and seeds the database, including automatic import of `staff.csv` and `shifts.csv`.

### Environment

Copy `.env.example` to `.env` if needed:

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="clinic-shift-scheduler-dev-secret-change-in-production-32chars"
```

`SESSION_SECRET` must be at least 32 characters.

## Tests

```bash
npm test
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Migrate + seed (includes CSV import) |
| `npm run dev` | Local development server |
| `npm run build` | Production build (also seeds deploy DB) |
| `npm start` | Run production server |
| `npm test` | Run tests |
| `npm run db:reset` | Reset DB and reseed |
| `npm run db:seed` | Reseed only |

## Deploy (Vercel)

This app uses SQLite. On Vercel:

1. Build creates a seeded `prisma/deploy.db`
2. Runtime copies it to `/tmp/clinic.db` (writable path)

### Environment variables

In Vercel → Project → Settings → Environment Variables:

| Name | Value |
|------|--------|
| `DATABASE_URL` | `file:./deploy.db` |
| `SESSION_SECRET` | random string, 32+ characters |

`DATABASE_URL` must start with `file:`.

Then redeploy.

**Cold starts:** free-tier hosts may take a few seconds on the first request after idle.

**Persistence note:** runtime writes (claims, imports) live under `/tmp` and can reset on cold starts. Seeded demo data is restored from the build artifact. Fine for this assessment demo.

## Project layout

```
src/app/           pages + server actions
src/components/    UI components
src/lib/claims.ts  claim / assign rules
src/lib/import/    shared CSV import (seed + upload)
prisma/            schema, migrations, seed
staff.csv          legacy staff export
shifts.csv         legacy shifts export
DECISIONS.md       engineering decisions
```

## Demo tip

1. Sign in as manager → open **Coverage** for week of 3 Aug 2026  
2. Sign in as nurse → claim a shift that needs nurses  
3. Try an overlapping shift → expect a clear error  
4. Open **Reports** → review rejected/merged CSV rows from seed
