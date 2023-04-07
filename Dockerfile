FROM node:18-alpine AS builder
ENV PNPM_VERSION=8.1.1

RUN corepack enable && \
  corepack prepare pnpm@${PNPM_VERSION} --activate && \
  pnpm config set store-dir /pnpm-store

WORKDIR /app

# Files required by pnpm install
COPY package.json pnpm-lock.yaml tsup.config.js tsconfig.json /app/

RUN pnpm install --frozen-lockfile

# Bundle app source
COPY src src

RUN pnpm build:server


FROM node:18-alpine
WORKDIR /app

RUN adduser -D -u 8000 commercetools

COPY --from=builder /app/dist /app

EXPOSE 8989
ENV HTTP_SERVER_PORT 8989

CMD ["node", "./server.js"]
