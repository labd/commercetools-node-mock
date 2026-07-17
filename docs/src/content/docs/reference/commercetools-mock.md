---
title: CommercetoolsMock
description: API reference for the CommercetoolsMock class — constructor, methods and properties.
---

The main entry point. Construct one per test file (or share one and `clear()`
between tests).

```typescript
import { CommercetoolsMock } from '@labdigital/commercetools-mock'

const ctMock = new CommercetoolsMock(options)
```

## Constructor

```typescript
new CommercetoolsMock(options?: Partial<CommercetoolsMockOptions>)
```

All options are optional. See
[Configuration options](/commercetools-node-mock/configuration/options/) for the
full list and defaults.

## Methods

### `project(projectKey?)`

```typescript
project(projectKey?: string): ProjectAPI
```

Returns a [`ProjectAPI`](/commercetools-node-mock/reference/project-api/) scoped
to the given project. Falls back to `defaultProjectKey` when called without an
argument; throws if neither is set.

```typescript
ctMock.project()               // uses defaultProjectKey
ctMock.project('other-project')
```

### `registerHandlers(server)`

```typescript
registerHandlers(server: SetupServer): void
```

Registers the mock's request handlers on an existing msw server. Equivalent to
`server.use(...ctMock.getHandlers())`. See
[msw integration](/commercetools-node-mock/usage/msw/).

### `getHandlers()`

```typescript
getHandlers(): AnyHandler[]
```

Returns the raw msw handler array (OAuth + API `HEAD`/`GET`/`POST`/`DELETE`), so
you can construct the server yourself.

### `clear()`

```typescript
clear(): Promise<void>
```

Wipes all data from the storage backend. Call it in `afterEach` to isolate
tests. Always `await` it.

### `runServer(port?)`

```typescript
runServer(port = 3000): Promise<void>
```

Starts a real HTTP server on `0.0.0.0:{port}`. See
[Standalone server](/commercetools-node-mock/server/standalone/).

### `authStore()`

```typescript
authStore(): OAuth2Store
```

Returns the in-memory OAuth token store, so you can inspect issued tokens in
tests. See [Authentication](/commercetools-node-mock/configuration/authentication/).

### `mswServer()`

```typescript
mswServer(): SetupServer | undefined
```

Returns the msw server the mock is aware of, if any.

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `app` | `FastifyInstance` | The underlying Fastify application. |
| `server` | `http.Server` | The Node HTTP server (`app.server`). |
| `options` | `CommercetoolsMockOptions` | The resolved options (defaults merged with yours). |
