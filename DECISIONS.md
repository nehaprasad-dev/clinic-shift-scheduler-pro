# Decision 

## Stack up

Next.js App Router with server actions keeps auth, claim rules and import logic together in one codebase on the server. Prisma + SQLite means local setup is a single `npm run setup`, no Docker needed. The schema is still portable to Postgres for a production deployment.

## Authentications

iron-session session cookies. The app has two roles: `MANAGER` and `STAFF`. Staff also have a profession that is used for capacity checking. Staff actions are always to the signed in user. Managers can assign any staff.

## Night work

If `end_time` is `00:00` or end is less than or equal to start, the shift is assumed to end on the next calendar day. Absolute minute windows are used for checking overlaps to make sure that overnight shifts are correctly compared to morning shifts.

## Claiming rules

Enforcement on the server only:

1. Do not exceed professional capacity.
2. The staff member must not already be working an overlapping shift.

Manager assigns uses the same path. Capacity is also checked again after insert so that two concurrent claims cannot both grab the last slot.

## Claimed shift edit

Time and requirement edits allowed. After saving.

- Deletes claims that now overlap another shift for the same person.
- When the number of current claimants for a role exceeds the number of claimants needed for the role, the excess claimants (newest first, earliest claimants remaining) are removed.

The save response states who was removed and why. When a shift is deleted, also its claims are cascaded.

### Dirty CSV import

The manager and seed upload UI share a single parser that is used by shift importers and staff.

Staff cleaning:

- Trim whitespace; normalize role aliases ( `RN`, `Physician`, `recep.`, etc.).
- Correct (at) to @ in e-mail addresses
- Don't accept missing name, invalid email and unknown role (ex: Janitor).
- `staff_id` duplicate in-file / already in DB -> merged (first / existing wins)
- Duplicate email of other account => rejected.

Cleaning shift:

- Accept dates in `YYYY-MM-DD`, `DD/MM/YYYY` or `MM-DD-YYYY` format.
- Reject impossible dates, missing/malformed times (e.g. `10:00+1`), zero-length shifts, and prose requirements.
- Incomplete requirement keys treat missing roles as 0. There must be at least one required role.
- merged duplicate shift_id

For each import an Import Report is generated and includes the accepted counts and all rejected or merged rows, issues and actions.

### Coverage Dashboard

Manager only week view (start Monday), previous/next, jump to date. Shows empty / partial / full for each shift and what roles are still missing.

## What I’d do with more time

Migrate to Postgres, `SELECT FOR UPDATE` on shift rows, add live updates (SSE) when a shift is filled, support recurring shift series with per-occurrence edits.