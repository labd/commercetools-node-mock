FROM node:24-alpine AS builder
ENV PNPM_VERSION=10.11

RUN corepack enable && \
  corepack prepare pnpm@${PNPM_VERSION} --activate && \
  pnpm config set store-dir /pnpm-store

WORKDIR /app

# Files required by pnpm install
COPY package.json pnpm-lock.yaml tsdown.config.js tsconfig.json /app/

RUN pnpm install --frozen-lockfile

# Bundle app source
COPY src src
COPY vendor vendor

RUN pnpm build:server


FROM node:18-alpine
WORKDIR /app

RUN adduser -D -u 8000 commercetools

COPY --from=builder /app/dist /app

EXPOSE 8989
ENV HTTP_SERVER_PORT 8989

CMD ["node", "./server.js"]
