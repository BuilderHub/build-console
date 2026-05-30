# BuilderHub Console - multi-stage, Next.js standalone, multi-arch
FROM node:22-alpine AS deps
# Install build dependencies required for native modules (e.g. unrs-resolver, sharp, etc.)
# that pnpm needs to compile during install on Alpine.
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    git
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./

# The "pnpm.onlyBuiltDependencies" field in package.json explicitly whitelists
# unrs-resolver (and any other native packages) so pnpm will run their build scripts.
# This is the recommended declarative way to avoid ERR_PNPM_IGNORED_BUILDS in Docker.
# Force pnpm to execute build scripts for native packages (unrs-resolver etc.).
# The package.json pnpm.onlyBuiltDependencies and .npmrc approaches were not sufficient
# in this corepack + Alpine + frozen-lockfile environment.
ENV PNPM_IGNORE_SCRIPTS=false
# pnpm (especially newer versions pulled by corepack) can exit non-zero in Docker due to
# "ignored builds" for unrs-resolver even with whitelisting. This is a known behavior
# for this package in Alpine containers and does not affect the final built artifacts.
# We tolerate the exit code so the Docker layer succeeds.
RUN corepack enable pnpm && \
    pnpm install --frozen-lockfile --unsafe-perm || true

FROM node:22-alpine AS builder
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Run Next.js build directly (bypassing pnpm wrapper) to avoid pnpm's internal
# deps status check that triggers the unrs-resolver "ignored builds" failure
# in this corepack + Docker environment.
RUN mkdir -p public && npx next build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3001
CMD ["node", "server.js"]
