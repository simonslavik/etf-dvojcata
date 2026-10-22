# NestJS API – build z kořene repa (npm workspaces): docker build -f apps/api/Dockerfile .
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN npm ci -w @etfd/api -w @etfd/shared --no-audit --no-fund
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @etfd/shared && npm run build -w @etfd/api \
 && npm prune --omit=dev -w @etfd/api -w @etfd/shared

FROM node:22-alpine
WORKDIR /repo
ENV NODE_ENV=production PORT=4000
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/shared/package.json packages/shared/
COPY --from=build /repo/packages/shared/dist packages/shared/dist
COPY --from=build /repo/apps/api/package.json apps/api/
COPY --from=build /repo/apps/api/dist apps/api/dist
# Migrace se spouští při startu API (DatabaseModule)
COPY --from=build /repo/apps/api/drizzle apps/api/drizzle
USER node
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s CMD wget -qO /dev/null http://127.0.0.1:4000/health || exit 1
CMD ["node", "--enable-source-maps", "apps/api/dist/main.js"]
