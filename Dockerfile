# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="file:/app/data/prod.db"
ENV SESSION_SECRET="clinic-shift-scheduler-build-secret-min-32-chars"
RUN mkdir -p /app/data \
  && npx prisma migrate deploy \
  && npx tsx prisma/seed.ts \
  && npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/prod.db"
ENV SESSION_SECRET="clinic-shift-scheduler-change-me-in-production-32"
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/data ./data
COPY --from=builder /app/staff.csv ./staff.csv
COPY --from=builder /app/shifts.csv ./shifts.csv
EXPOSE 3000
CMD ["npm", "start"]
