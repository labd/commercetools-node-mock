---
title: Custom storage backends
description: Implement your own storage backend by extending AbstractStorage.
---

You can supply any backend that extends `AbstractStorage`. This is an advanced
escape hatch — most users never need it — but it's there if you want custom
persistence, inspection or instrumentation.

```typescript
import {
  AbstractStorage,
  CommercetoolsMock,
} from '@labdigital/commercetools-mock'

class MyStorage extends AbstractStorage {
  // …implement the abstract methods (all return Promises)
}

const ctMock = new CommercetoolsMock({
  defaultProjectKey: 'my-project',
  storage: new MyStorage(),
})
```

## The contract

`AbstractStorage` requires the following (all async unless noted):

| Method | Purpose |
| --- | --- |
| `clear()` | Remove all data. |
| `all(projectKey, typeId)` | Return every resource of a type. |
| `count(projectKey, typeId)` | Number of resources of a type. |
| `add(projectKey, typeId, obj, params?)` | Insert a resource. |
| `get(projectKey, typeId, id, params?)` | Fetch by id (or `null`). |
| `getByKey(projectKey, typeId, key, params?)` | Fetch by key (or `null`). |
| `delete(projectKey, typeId, id, params)` | Delete by id (returns the removed resource or `null`). |
| `query(projectKey, typeId, params)` | Paged query — applies `where`, `offset`, `limit`, `expand`. |
| `addProject(projectKey)` / `getProject(projectKey)` / `saveProject(project)` | Project settings. |
| `getByContainerAndKey(projectKey, container, key)` | Custom-object lookup by container + key. |
| `expand(...)` | Reference-resolution helper used for `expand`. |
| `close()` *(non-abstract)* | Release external resources. Override if your backend holds connections. |

:::tip
Rather than implement everything from scratch, read the source of
`InMemoryStorage` and `SQLiteStorage` for reference implementations of each
method, and lean on the base-class helpers for expansion where possible.
:::

## Why implement one?

- Persist state to a store you can inspect between test runs.
- Add logging/metrics around reads and writes.
- Pre-load a snapshot for a large, shared dataset.

For everyday testing the [in-memory](/commercetools-node-mock/storage/in-memory/)
backend is the right default.
