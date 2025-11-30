FROM node:22-alpine AS builder
ENV PNPM_VERSION=10.24.0

RUN corepack enable && \
  corepack prepare pnpm@${PNPM_VERSION} --activate && \
  pnpm config set store-dir /pnpm-store

RUN mkdir -p /app && chown node:node /app

USER node

WORKDIR /app

# Files required by pnpm install
COPY --chown=node package.json pnpm-lock.yaml tsdown.config.js tsconfig.json /app/

RUN pnpm install --frozen-lockfile

COPY --chown=node src /app/src
COPY --chown=node vendor /app/vendor


# Build server bundle
RUN pnpm build:server

EXPOSE 8989
ENV HTTP_SERVER_PORT=8989

CMD ["node", "./dist/server.mjs"]
