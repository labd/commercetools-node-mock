---
title: Introduction
description: What @labdigital/commercetools-mock is, the problem it solves, and when to use it for testing your commercetools integration in TypeScript.
---

`@labdigital/commercetools-mock` is a **comprehensive mock of the
[commercetools](https://commercetools.com/) REST API**, designed to test
TypeScript codebases that talk to commercetools without hitting a real project.

It runs entirely in-memory inside your test process and implements the actual
behaviour of the API — creating resources, applying update actions, evaluating
`where` predicates, expanding references, selecting prices and running product
search — rather than returning canned responses. Because it speaks real HTTP,
the official [`@commercetools/platform-sdk`](https://www.npmjs.com/package/@commercetools/platform-sdk)
and any other HTTP client work against it unchanged.

## The problem

Code that integrates with commercetools is difficult to test:

- **Hitting a real project** is slow, requires credentials in CI, is subject to
  rate limits and network flakiness, and mutates data shared with other
  developers.
- **Hand-written stubs** (returning fixed JSON) drift from the real API and
  rarely model update actions, versioning, predicates or reference expansion —
  exactly the behaviour that tends to break.

## The solution

Create the data your code expects through the API, run the code under test, and
assert on the result — either through your own code's return values or by
querying the mock.

```typescript
// 1. Create data through the commercetools API
await apiRoot.customers().post({ body: customerDraft }).execute()

// 2. Run the code under test (it uses the commercetools SDK internally)
const result = await myFunction()

// 3. Assert
expect(result).toEqual(true)
```

Everything is in-memory and reset between tests, so runs are fast and
completely isolated.

## When to use it

- **Unit and integration tests** for services, resolvers, or jobs that read
  from or write to commercetools.
- **Local development** against a disposable API — run it as a
  [standalone HTTP server](/commercetools-node-mock/server/standalone/) or via
  the [Docker image](/commercetools-node-mock/server/docker/).
- **CI pipelines** where you want deterministic behaviour without provisioning a
  commercetools project.

## When *not* to use it

The mock is comprehensive but not a byte-for-byte reproduction of commercetools.
It is not intended for:

- **Production traffic** — it is a testing tool.
- **Validating exact commercetools error payloads or edge-case validation** —
  some validation is intentionally relaxed (see the notes throughout these
  docs, e.g. `where` on unknown fields and ignored `sort`).
- **Performance or load testing** of commercetools itself.

Known behavioural differences are consolidated on the
[API coverage & limitations](/commercetools-node-mock/reference/resources/) page.

## Requirements

- **Node.js** ≥ 22
- **[msw](https://mswjs.io/)** `^2` (peer dependency)
- **[`@commercetools/platform-sdk`](https://www.npmjs.com/package/@commercetools/platform-sdk)**
  `>= 8.25.0` (peer dependency, for the resource types)

Ready? Head to [Installation](/commercetools-node-mock/getting-started/installation/).
