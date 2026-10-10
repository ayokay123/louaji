# syntax=docker/dockerfile:1
#
# Louaji — containerized web app (Expo + React Native for Web, output: "server").
#
# This image runs the Expo web server (which serves the React Native for Web
# bundle AND the Expo Router API routes under src/features/*/api). It is meant
# for running the stack locally in a container WITHOUT colliding with a normal
# host dev setup — every exposed port is deliberately shifted (see docker-compose.yml):
#
#     web app   → 3100   (normal `expo start` is 8081, EAS site_url 3000)
#     postgres  → 55432  (raw pg is 5432, local Supabase DB is 54322)
#
# Production web hosting is EAS Hosting (see docs/ENVIRONMENTS.md); this image is
# for containerized local / self-hosted runs, not the production deploy path.

FROM node:24-bookworm-slim AS base
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    CI=1
# corepack ships with node 24 and pins the pnpm version from package.json#packageManager
RUN corepack enable
WORKDIR /app

# ── deps layer (cached unless the lockfile changes) ────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml .npmrc* ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ── runtime ────────────────────────────────────────────────────────────────────
FROM base AS runtime
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# The Expo web dev/server runtime is what serves API routes locally. Bind to all
# interfaces so the container port is reachable from the host.
ENV EXPO_WEB_PORT=3100 \
    EXPO_NO_TELEMETRY=1 \
    NODE_ENV=development
EXPOSE 3100

# Reachable from the host at http://localhost:3100
CMD ["pnpm", "exec", "expo", "start", "--web", "--port", "3100", "--host", "lan"]
