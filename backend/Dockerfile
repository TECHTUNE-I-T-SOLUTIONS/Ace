FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY .npmrc* ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY . .
COPY --from=deps /app/node_modules ./node_modules
WORKDIR /app/backend
RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM node:20-alpine AS runner
WORKDIR /app/backend
ENV NODE_ENV=production
RUN corepack enable
COPY --from=build /app/backend/package.json ./package.json
COPY --from=build /app/backend/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/node_modules ./node_modules
EXPOSE 3000
CMD ["pnpm", "run", "start"]
