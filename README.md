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

## Deploy notes

The app uses SQLite by default (`DATABASE_URL=file:./dev.db`). Free hosts with ephemeral disks lose data on restart unless you:

- bake a seeded database into the image, or
- attach a persistent volume, or
- point `DATABASE_URL` at Postgres and change `provider` in `prisma/schema.prisma`.

Set `SESSION_SECRET` to a random string of at least 32 characters in production.

Cold starts on free tiers (Render / Fly) can take a few seconds on the first request after idle.

## Project layout

- `src/lib/import` — shared CSV import used by seed and manager upload UI
- `src/lib/claims.ts` — server-side claim / assign rules and concurrency checks
- `src/app` — pages and server actions
- `prisma` — schema, migration, seed
- `DECISIONS.md` — design decisions for the assessment
