FROM node:18-alpine
ENV PNPM_VERSION=7.6.0

RUN apk add --no-cache curl && \
  curl -fsSL "https://github.com/pnpm/pnpm/releases/download/v${PNPM_VERSION}/pnpm-linuxstatic-x64" -o /bin/pnpm && chmod +x /bin/pnpm && \
  apk del curl

RUN adduser -D -u 8000 commercetools
RUN wget https://get.pnpm.io/v6.34.js | node - add --global pnpm

USER commercetools
WORKDIR /home/commercetools/commercetools-node-mock

# Files required by pnpm install
COPY package.json pnpm-lock.yaml tsup.config.js tsconfig.json ./

RUN pnpm install --frozen-lockfile

# Bundle app source
COPY src src

EXPOSE 8989
ENV HTTP_SERVER_PORT 8989

CMD ["pnpm", "start"]
