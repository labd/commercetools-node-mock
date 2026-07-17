---
title: In-memory storage
description: The default in-memory storage backend for commercetools-node-mock.
---

`InMemoryStorage` is the default backend. It keeps all resources in plain
JavaScript data structures in the current process.

```typescript
import { CommercetoolsMock, InMemoryStorage } from '@labdigital/commercetools-mock'

const ctMock = new CommercetoolsMock({
  defaultProjectKey: 'my-project',
  storage: new InMemoryStorage(), // optional — this is the default
})
```

## Characteristics

- **Fast** — no I/O, everything is in RAM.
- **Isolated** — state lives in the process and disappears when it exits.
- **Reset with `clear()`** — call `ctMock.clear()` (typically in `afterEach`) to
  wipe all data between tests.

## When to use

This is the right choice for essentially all testing. Reach for
[SQLite](/commercetools-node-mock/storage/sqlite/) only if you specifically need
persistence or want to work with larger datasets in the standalone server.

## Clearing between tests

```typescript
afterEach(async () => {
  mswServer.resetHandlers()
  await ctMock.clear()
})
```

`clear()` is async — always `await` it.
