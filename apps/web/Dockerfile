# Next.js web – build z kořene repa: docker build -f apps/web/Dockerfile --build-arg API_URL=http://api:4000 .
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN npm ci -w @etfd/web -w @etfd/shared --no-audit --no-fund
COPY packages/shared packages/shared
COPY apps/web apps/web
# Rewrity /api/* → API se zapisují při buildu, proto build arg
ARG API_URL=http://api:4000
ENV API_URL=$API_URL NEXT_OUTPUT=standalone NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w @etfd/shared && npm run build -w @etfd/web

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s CMD wget -qO /dev/null http://127.0.0.1:3000/privacy || exit 1
CMD ["node", "apps/web/server.js"]
