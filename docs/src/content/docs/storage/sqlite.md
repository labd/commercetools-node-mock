---
title: SQLite storage
description: The experimental SQLite storage backend, using Node's built-in node:sqlite module.
---

:::caution[Experimental]
The SQLite backend is experimental. It's useful for persistence and larger
datasets, but for regular tests the default
[in-memory backend](/commercetools-node-mock/storage/in-memory/) is faster and
simpler.
:::

`SQLiteStorage` persists resources in a SQLite database using Node's built-in
[`node:sqlite`](https://nodejs.org/api/sqlite.html) module (Node ≥ 22). It is
published under a separate entry point.

```typescript
import { CommercetoolsMock } from '@labdigital/commercetools-mock'
import { SQLiteStorage } from '@labdigital/commercetools-mock/sqlite'

const ctMock = new CommercetoolsMock({
  defaultProjectKey: 'my-project',
  storage: new SQLiteStorage({ filename: ':memory:' }),
})
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `filename` | `string` | `commercetools-mock.db` (in cwd) | Path to the database file. Use `':memory:'` for an in-memory SQLite database. |

```typescript
// on disk
new SQLiteStorage({ filename: './fixtures/ct.db' })

// in-memory SQLite (still persists for the lifetime of the process)
new SQLiteStorage({ filename: ':memory:' })
```

## Closing the database

`SQLiteStorage` holds a database connection. Call `close()` when you're done to
release it — for example on process shutdown:

```typescript
const storage = new SQLiteStorage()
process.on('SIGINT', () => {
  storage.close()
  process.exit()
})
```

## With the standalone server

The bundled [standalone server](/commercetools-node-mock/server/standalone/)
switches to SQLite when the `EXPERIMENTAL_SQLITE_STORAGE` environment variable is
set to `true`:

```bash
EXPERIMENTAL_SQLITE_STORAGE=true node ./dist/server.mjs
```
