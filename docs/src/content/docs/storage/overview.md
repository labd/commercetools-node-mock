---
title: Storage overview
description: How storage backends work in commercetools-node-mock and how to choose between in-memory, SQLite and custom backends.
---

Every resource the mock manages is persisted through a **storage backend**.
Repositories read and write through this abstraction, so swapping the backend
doesn't change API behaviour.

## Available backends

| Backend | Import | State | Use for |
| --- | --- | --- | --- |
| [In-memory](/commercetools-node-mock/storage/in-memory/) | `InMemoryStorage` | Per-process, volatile | The default — unit/integration tests. |
| [SQLite](/commercetools-node-mock/storage/sqlite/) *(experimental)* | `SQLiteStorage` (from `/sqlite`) | File or `:memory:` | Larger datasets, persistence across restarts of the standalone server. |
| [Custom](/commercetools-node-mock/storage/custom/) | extend `AbstractStorage` | Whatever you implement | Special persistence or inspection needs. |

## Choosing a backend

Set the `storage` option on the constructor. Leaving it unset uses
`InMemoryStorage`:

```typescript
import { CommercetoolsMock, InMemoryStorage } from '@labdigital/commercetools-mock'

// default (in-memory)
new CommercetoolsMock({ defaultProjectKey: 'my-project' })

// explicit in-memory
new CommercetoolsMock({ storage: new InMemoryStorage() })
```

```typescript
import { CommercetoolsMock } from '@labdigital/commercetools-mock'
import { SQLiteStorage } from '@labdigital/commercetools-mock/sqlite'

new CommercetoolsMock({ storage: new SQLiteStorage({ filename: ':memory:' }) })
```

## The contract

A backend extends `AbstractStorage` and implements async methods for adding,
getting, querying, deleting and clearing resources. All methods return Promises.
See [Custom backends](/commercetools-node-mock/storage/custom/) for the shape.
