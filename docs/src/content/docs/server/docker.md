---
title: Docker image
description: Run commercetools-node-mock as a container using the published Docker image.
---

The mock is published as a Docker image that runs the
[standalone server](/commercetools-node-mock/server/standalone/), exposing the
mocked endpoints over HTTP. This is a convenient way to spin up a disposable
commercetools API for local development, demos, or integration environments.

Image: [`labdigital/commercetools-mock-server`](https://hub.docker.com/r/labdigital/commercetools-mock-server)

## Run it

```bash
docker run --rm -p 8989:8989 labdigital/commercetools-mock-server
```

The container listens on port `8989` by default. Point your commercetools client
at `http://localhost:8989`.

## Environment variables

The same variables as the standalone server apply:

| Variable | Default | Effect |
| --- | --- | --- |
| `HTTP_SERVER_PORT` | `8989` (in the image) | Port inside the container. |
| `ENABLE_LOGGING` | `false` | Enable pretty request logging. |
| `EXPERIMENTAL_SQLITE_STORAGE` | `false` | Use the SQLite storage backend. |

```bash
docker run --rm -p 8989:8989 \
  -e ENABLE_LOGGING=true \
  labdigital/commercetools-mock-server
```

## docker compose

```yaml
services:
  commercetools-mock:
    image: labdigital/commercetools-mock-server:latest
    ports:
      - "8989:8989"
    environment:
      ENABLE_LOGGING: "true"
    restart: unless-stopped
```

## Tags

Images are tagged per release (semver) with a `latest` tag tracking the newest
stable release. Pin a specific version for reproducible environments:

```bash
docker run --rm -p 8989:8989 labdigital/commercetools-mock-server:4.1.0
```

:::note
The server is a **testing/development** tool. Don't expose it as a production
backend — data is not durable (unless you use the SQLite backend with a mounted
volume) and validation is intentionally relaxed.
:::
