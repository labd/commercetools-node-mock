---
title: Configuration options
description: Every option accepted by the CommercetoolsMock constructor, with defaults and guidance.
---

The `CommercetoolsMock` constructor accepts a partial options object. Everything
is optional; sensible defaults are applied.

```typescript
import { CommercetoolsMock } from '@labdigital/commercetools-mock'

const ctMock = new CommercetoolsMock({
  defaultProjectKey: 'my-project',
  // …other options
})
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `defaultProjectKey` | `string \| undefined` | `undefined` | Project key used when you call `ctMock.project()` without an argument. Set this to avoid repeating the key in every test. |
| `apiHost` | `string \| RegExp` | `https://api.*.commercetools.com` | Host the mock intercepts for **API** requests. The default is a wildcard pattern that matches every commercetools API region, so a client pointed at a real commercetools host is intercepted automatically. |
| `authHost` | `string \| RegExp` | `https://auth.*.commercetools.com` | Host the mock intercepts for **OAuth** token requests. Defaults to a wildcard matching every commercetools auth region. |
| `enableAuthentication` | `boolean` | `false` | When `true`, attaches auth middleware to the API routes so requests are checked for a bearer token. See [Authentication](/commercetools-node-mock/configuration/authentication/). |
| `validateCredentials` | `boolean` | `false` | When `true` (and `enableAuthentication` is on), requires a bearer token that was actually issued by the mock. When `false`, tokens are optional and not verified. |
| `silent` | `boolean` | `true` | Suppresses request logging. Set to `false` to see Fastify logs — useful when debugging. |
| `strict` | `boolean` | `false` | Enables stricter behaviour in the repositories/validation. The standalone server runs with `strict: true`. |
| `storage` | `AbstractStorage \| undefined` | `undefined` (→ `InMemoryStorage`) | A custom [storage backend](/commercetools-node-mock/storage/overview/). |
| `logger` | `FastifyBaseLogger \| undefined` | `undefined` | A custom logger instance. When provided it overrides `silent` and is used as the Fastify logger. |

## Notes

### Hosts

The defaults are **wildcard patterns** that match every commercetools region:

```
apiHost:  https://api.*.commercetools.com
authHost: https://auth.*.commercetools.com
```

The `*` is an [msw](https://mswjs.io/) path/host wildcard. This means that if
your code is already configured for a real commercetools project (for example
`https://api.europe-west1.gcp.commercetools.com`), the mock intercepts those
requests without any host configuration on your side.

To intercept a specific host instead — e.g. a local dev host — set them
explicitly:

```typescript
const ctMock = new CommercetoolsMock({
  apiHost: 'https://api.example.test',
  authHost: 'https://auth.example.test',
  defaultProjectKey: 'my-project',
})
```

You may also pass a `RegExp` to match a family of hosts — handy when the host is
computed at runtime.

### Logging

By default the mock is silent. For debugging, either flip `silent` or pass your
own logger:

```typescript
import pino from 'pino'

const ctMock = new CommercetoolsMock({
  silent: false, // enable Fastify's built-in logger at "info"
})

// or supply your own instance (takes precedence over `silent`)
const ctMock2 = new CommercetoolsMock({
  logger: pino({ transport: { target: 'pino-pretty' } }),
})
```

### Storage

Leave `storage` unset to use the default in-memory backend. Pass an instance to
use [SQLite](/commercetools-node-mock/storage/sqlite/) or a
[custom backend](/commercetools-node-mock/storage/custom/):

```typescript
import { CommercetoolsMock, InMemoryStorage } from '@labdigital/commercetools-mock'

const ctMock = new CommercetoolsMock({
  storage: new InMemoryStorage(),
})
```

## Full defaults

```typescript
{
  enableAuthentication: false,
  validateCredentials: false,
  defaultProjectKey: undefined,
  apiHost: 'https://api.*.commercetools.com',
  authHost: 'https://auth.*.commercetools.com',
  silent: true,
  strict: false,
  storage: undefined,   // → new InMemoryStorage()
  logger: undefined,
}
```
