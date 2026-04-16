# syntax=docker/dockerfile:1.7
# Multi-stage Dockerfile for the Next.js 15 standalone build deployed to Fly.io.
# next.config.ts sets `output: 'standalone'`, which produces `.next/standalone/server.js`
# alongside a self-contained node_modules tree — the runtime image only needs that,
# plus `.next/static`, `public/`, and the `prompts/` directory consumed by the
# generation pipeline (already declared in `outputFileTracingIncludes`).

# ---------- Stage 1: deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Enable pnpm via corepack — no external installs needed.
RUN corepack enable

# Install only what's needed for `pnpm install` to reproduce the lockfile.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- Stage 2: build ----------
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable

# Bring in deps from stage 1, then the rest of the source.
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js telemetry off in builds (no signup beacon).
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ---------- Stage 3: runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Non-root user for the runtime process.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy only the standalone server bundle and its required static + public assets.
# `--chown` ensures the non-root user can read/write under /app and /data later.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
# Belt-and-braces: copy prompts explicitly even though outputFileTracingIncludes
# should pull them in. Cheap insurance against tracer drift.
COPY --from=build --chown=nextjs:nodejs /app/prompts ./prompts

USER nextjs

EXPOSE 3000

# `server.js` is the standalone entry produced by Next.js.
CMD ["node", "server.js"]
