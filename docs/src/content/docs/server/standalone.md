---
title: Standalone server
description: Run commercetools-node-mock as a real HTTP server for local development and non-Node clients.
---

Besides intercepting requests with msw, the mock can run as a **real HTTP
server**. This is handy for local development, manual exploration with
`curl`/Postman, or driving the mock from a non-Node client.

## From code — `runServer`

```typescript
import { CommercetoolsMock } from '@labdigital/commercetools-mock'

const ctMock = new CommercetoolsMock({
  strict: true,
  defaultProjectKey: 'my-project',
})

await ctMock.runServer(3000) // listens on 0.0.0.0:3000
```

Point your commercetools client at `http://localhost:3000`. All the same
endpoints are available.

## The bundled server

The package includes a ready-made server entry (`src/server.ts`, built to
`dist/server.mjs`) that the [Docker image](/commercetools-node-mock/server/docker/)
uses. It reads a few environment variables:

| Variable | Default | Effect |
| --- | --- | --- |
| `HTTP_SERVER_PORT` | `3000` | Port to listen on. |
| `ENABLE_LOGGING` | `false` | When `true`, enables pretty request logging (pino). |
| `EXPERIMENTAL_SQLITE_STORAGE` | `false` | When `true`, uses the [SQLite backend](/commercetools-node-mock/storage/sqlite/) instead of in-memory. |

The bundled server runs with `strict: true`.

```bash
HTTP_SERVER_PORT=8989 ENABLE_LOGGING=true node ./dist/server.mjs
```

## Seeding a standalone server

A standalone server has no test hooks, so seed data over HTTP — create resources
with `POST` (via the SDK or `curl`), or use custom objects. Alternatively, use
the [SQLite backend](/commercetools-node-mock/storage/sqlite/) with a pre-built
database file to start from a known state.

## Graceful shutdown

If you use the SQLite backend, close it on shutdown so the connection is
released:

```typescript
process.on('SIGINT', () => {
  storage.close()
  process.exit()
})
```
