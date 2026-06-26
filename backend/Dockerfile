FROM node:22-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc* ./
RUN pnpm install --frozen-lockfile
RUN npx prisma generate
COPY . .
RUN pnpm run build
EXPOSE 3000
CMD ["pnpm", "run", "start"]