---
title: How it works
description: The architecture behind commercetools-node-mock — msw, Fastify, repositories and pluggable storage.
---

Understanding the moving parts helps you reason about what the mock does and
where its behaviour comes from.

## The request path

```
Your code
  │  (commercetools SDK / any HTTP client)
  ▼
msw  ──intercepts──▶  CommercetoolsMock handlers
                          │  replays the request into…
                          ▼
                     Fastify app (in-process, no socket)
                          │
             ┌────────────┼─────────────┐
             ▼            ▼              ▼
          OAuth2      Services       Repositories ──▶ Storage
```

1. **Your code makes an HTTP request** through the commercetools SDK (or any
   client) to the configured API/auth host.
2. **msw intercepts** the request. The handlers registered by the mock match the
   configured `apiHost` and `authHost`.
3. The handler **replays the request into an in-process [Fastify](https://fastify.dev/)
   application** using `app.inject()` — no real network socket is opened.
4. Fastify routes the request to the matching **service**, which validates the
   body and delegates to a **repository**.
5. The repository reads and writes through the **storage backend** and applies
   commercetools semantics (update actions, versioning, predicates, expansion).

Because the whole stack runs in-process and in-memory, tests are fast and fully
isolated.

## Key concepts

### `CommercetoolsMock`

The top-level object you construct. It builds the Fastify app, wires up the
OAuth2 server, and exposes the methods you use in tests:
[`registerHandlers`](/commercetools-node-mock/usage/msw/),
[`project()`](/commercetools-node-mock/reference/project-api/),
`clear()`, `authStore()` and `runServer()`. See the
[CommercetoolsMock reference](/commercetools-node-mock/reference/commercetools-mock/).

### Services

A **service** implements the HTTP surface for one resource type — the standard
commercetools route shape:

- `GET /{resource}` — query/list
- `GET /{resource}/{id}` and `GET /{resource}/key={key}` — fetch one
- `POST /{resource}` — create
- `POST /{resource}/{id}` — update with `{ version, actions }`
- `DELETE /{resource}/{id}`

All services extend a shared `AbstractService`, so update actions and query
parameters behave consistently across resources.

### Repositories

A **repository** holds the domain logic for a resource: how create drafts become
resources, how each update action mutates state, and how references resolve.
This is where commercetools-specific behaviour lives. In tests you can reach a
repository directly with
[`ctMock.project().getRepository(typeId)`](/commercetools-node-mock/reference/project-api/).

### Storage

Repositories persist through a **storage backend**. The default is
[`InMemoryStorage`](/commercetools-node-mock/storage/in-memory/); an experimental
[`SQLiteStorage`](/commercetools-node-mock/storage/sqlite/) is also available, and
you can [implement your own](/commercetools-node-mock/storage/custom/) by
extending `AbstractStorage`.

### Projects

commercetools is multi-project. Every resource lives under a project key. In the
mock, [`ctMock.project(key)`](/commercetools-node-mock/reference/project-api/)
returns a `ProjectAPI` scoped to that project; if you set `defaultProjectKey`
you can call `ctMock.project()` with no argument.

## Two ways to drive it

| Mode | How | When |
| --- | --- | --- |
| **In your tests (msw)** | `registerHandlers` / `getHandlers` on an msw server | Unit & integration tests — the primary use case. |
| **As an HTTP server** | `ctMock.runServer(port)` or the [Docker image](/commercetools-node-mock/server/docker/) | Local development, manual exploration, non-Node clients. |

## What it is faithful about (and what it isn't)

The mock implements a large amount of real behaviour: update actions,
versioning, `where` predicates, reference `expand`, price selection, product
search and OAuth token flows. It intentionally relaxes or omits some things —
notably `sort` is ignored on list endpoints, `where` does not error on unknown
fields, and order search does not filter. All known differences are consolidated
on the [API coverage & limitations](/commercetools-node-mock/reference/resources/)
page so you know where the edges are.
