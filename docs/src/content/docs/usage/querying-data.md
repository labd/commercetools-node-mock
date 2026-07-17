---
title: Querying data
description: Read data back from the mock through the commercetools API, and the mock-specific limitations of list query parameters.
---

Read data back the same way you would against commercetools — through the API,
using `get`, `withId`, `withKey` or a list query. The mock supports the standard
[query parameters](https://docs.commercetools.com/api/general-concepts#query-parameters)
(`where`, `expand`, `sort`, `limit`, `offset`, …).

```typescript
const result = await apiRoot
  .customers()
  .get({ queryArgs: { where: 'email = "jane@example.com"', limit: 1 } })
  .execute()
```

`where` and `expand` follow the commercetools
[predicate](https://docs.commercetools.com/api/predicates/query) and
[reference-expansion](https://docs.commercetools.com/api/general-concepts#reference-expansion)
syntax.

## Mock-specific behaviour

A few list-query parameters differ from commercetools (`sort` is ignored, there
is no `limit` ceiling, `withTotal` is ignored, and `where` doesn't error on
unknown fields). These and all other known differences are listed on the
[API coverage & limitations](/commercetools-node-mock/reference/resources/) page.

## Reading from the test directly

As a convenience you can also read a single resource straight from the test,
without going through the SDK, via
[`ctMock.project().get(...)`](/commercetools-node-mock/reference/project-api/):

```typescript
const customer = await ctMock.project().get('customer', customerId)
```
