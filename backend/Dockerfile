FROM node:22-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc* ./
RUN pnpm install
COPY . .
RUN npx prisma generate
RUN pnpm run build
EXPOSE 3000
CMD ["pnpm", "run", "start"]