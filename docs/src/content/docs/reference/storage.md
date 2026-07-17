---
title: Storage classes
description: API reference for the exported storage classes — AbstractStorage, InMemoryStorage and SQLiteStorage.
---

## Exports

```typescript
import {
  AbstractStorage,
  InMemoryStorage,
} from '@labdigital/commercetools-mock'

import { SQLiteStorage } from '@labdigital/commercetools-mock/sqlite'
```

## `InMemoryStorage`

The default backend. Construct with no arguments:

```typescript
new InMemoryStorage()
```

See [In-memory storage](/commercetools-node-mock/storage/in-memory/).

## `SQLiteStorage`

Experimental SQLite backend, from the `/sqlite` entry point.

```typescript
new SQLiteStorage(options?: { filename?: string })
```

| Option | Default | Description |
| --- | --- | --- |
| `filename` | `commercetools-mock.db` | Database file path, or `':memory:'`. |

Has a `close()` method to release the connection. See
[SQLite storage](/commercetools-node-mock/storage/sqlite/).

## `AbstractStorage`

The base class to extend for a
[custom backend](/commercetools-node-mock/storage/custom/). Key abstract methods
(all return Promises):

`clear`, `all`, `count`, `add`, `get`, `getByKey`, `delete`, `query`,
`addProject`, `getProject`, `saveProject`, `getByContainerAndKey`, `expand`.

`close()` is a non-abstract no-op you can override if your backend holds
external resources.
