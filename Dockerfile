# ETF dvojčata – produkční image pro review: `docker compose up` → http://localhost:3000
# Databáze = PGlite (Postgres ve WASM) ve volume /data, žádná další služba ani účty nejsou potřeba.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx next build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 PGLITE_DIR=/data/pglite
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# Migrace se u PGlite spouští za běhu z lib/db/migrations (lib/db/index.ts)
COPY --from=build --chown=node:node /app/lib/db/migrations ./lib/db/migrations
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s CMD wget -qO /dev/null http://127.0.0.1:3000/privacy || exit 1
CMD ["node", "server.js"]
