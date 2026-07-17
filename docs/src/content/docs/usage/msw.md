---
title: msw integration
description: How commercetools-node-mock integrates with Mock Service Worker — registerHandlers vs getHandlers, and managing the server yourself.
---

Since version 2 the mock is built on [Mock Service Worker (msw)](https://mswjs.io/).
Rather than owning a server, it produces msw **request handlers** that you
register on an msw server you control. That means the same server can also mock
your other APIs.

## `registerHandlers(server)`

The convenient option: pass your msw server and the mock registers its handlers
on it.

```typescript
import { setupServer } from 'msw/node'

const mswServer = setupServer()

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => ctMock.registerHandlers(mswServer))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())
```

Internally this is equivalent to `mswServer.use(...ctMock.getHandlers())`.

## `getHandlers()`

For full control, get the raw handler array and register it yourself — for
example alongside handlers for other services:

```typescript
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const mswServer = setupServer(
  ...ctMock.getHandlers(),
  http.get('https://my-other-api.test/ping', () => HttpResponse.json({ ok: true })),
)
```

`getHandlers()` returns handlers covering:

- `POST {authHost}/oauth/*` — token endpoints
- `HEAD {apiHost}/*` — existence checks (returns `200`/`404` based on result count)
- `GET {apiHost}/*`
- `POST {apiHost}/*`
- `DELETE {apiHost}/*`

Each handler replays the request into the in-process Fastify app.

## Handler ordering

msw matches handlers in registration order, first match wins. Because the mock's
API handlers use a broad `{apiHost}/*` pattern, register any **more specific**
handlers for the same host *before* the mock's handlers if you need to override
a particular route.

## `onUnhandledRequest`

Using `mswServer.listen({ onUnhandledRequest: 'error' })` is recommended in
tests — it turns any request that isn't mocked into a loud failure, so you catch
requests going to the wrong host.

## Browser vs node

The examples use `msw/node` (`setupServer`) for test runners. msw also has a
browser worker (`setupWorker`); the handlers from `getHandlers()` work with
either, since they are standard msw handlers.

## Inspecting the msw server

`ctMock.mswServer()` returns the msw server the mock is aware of (if any). In the
recommended `registerHandlers` flow you already hold the reference yourself.
