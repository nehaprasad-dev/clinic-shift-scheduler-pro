Stack: Next.js 15 (App Router) + TypeScript + Prisma + SQLite + Tailwind CSS 4.

## Seeded logins

| Role | Email | Password |
|------|-------|----------|
| Manager | manager@clinicmail.test | manager123 |
| Doctor | doctor@clinicmail.test | staff123 |
| Nurse | nurse@clinicmail.test | staff123 |
| Receptionist | reception@clinicmail.test | staff123 |

All staff imported from `staff.csv` also use password `staff123`.

Imported shifts are mostly in **August 2026**. Open Coverage and jump to that month.

## Local setup

```bash
npm install
npm run setup
npm run dev
```

Then open http://localhost:3000

`npm run setup` runs migrations and seeds the database (including automatic CSV import of `staff.csv` and `shifts.csv`).

## Tests

```bash
npm test
```

## Scripts

- `npm run dev` — development server
- `npm run build` / `npm start` — production build and serve
- `npm run db:reset` — wipe DB, remigrate, and reseed
- `npm run db:seed` — reseed only

## Deploy notes (Vercel)

SQLite on Vercel needs a writable path. The production build:

1. Creates a seeded `prisma/deploy.db` during `npm run build`
2. Copies it to `/tmp/clinic.db` at runtime (Vercel allows writes only under `/tmp`)

### Vercel environment variables

Set these in Vercel → Project → Settings → Environment Variables:

| Name | Value |
|------|--------|
| `SESSION_SECRET` | random string, 32+ characters |
| `DATABASE_URL` | `file:./deploy.db` |

Important: `DATABASE_URL` **must** start with `file:` because Prisma is configured for SQLite.

Then redeploy.

Note: data written at runtime (new claims, imports) lives in `/tmp` and can reset on cold starts. That is fine for this demo. README documents the cold-start behavior.

Cold starts on free tiers can take a few seconds on the first request after idle.

## Project layout

- `src/lib/import` — shared CSV import used by seed and manager upload UI
- `src/lib/claims.ts` — server-side claim / assign rules and concurrency checks
- `src/app` — pages and server actions
- `prisma` — schema, migration, seed
- `DECISIONS.md` — design decisions for the assessment
