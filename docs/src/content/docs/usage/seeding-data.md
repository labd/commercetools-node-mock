---
title: Seeding data
description: Populate the mock with resources by creating them through the commercetools API before running your tests.
---

Most tests start by putting the data your code expects into the mock. The
recommended way to do this is to **create resources through the commercetools
API** — the very same calls your production code makes. That keeps your test
setup realistic: drafts are validated, defaults are applied, and generated
fields (ids, timestamps, versions) behave exactly as they will in production.

## Create through the API

Use your configured `apiRoot` (see the
[Quick start](/commercetools-node-mock/getting-started/quick-start/) for how to
build one) and `POST` the resource draft:

```typescript
await apiRoot
  .customers()
  .post({
    body: {
      email: 'jane@example.com',
      password: 's3cret',
      firstName: 'Jane',
    },
  })
  .execute()
```

Because this goes through the real create endpoint, the mock validates the
draft and returns a fully-formed resource — just like commercetools.

## Deterministic references

The API generates the `id` for you. When later steps or assertions need to refer
to a resource, either **capture the returned id** or **set a `key`** and look it
up by key:

```typescript
// capture the id
const { body: customer } = await apiRoot
  .customers()
  .post({ body: { email: 'jane@example.com', password: 's3cret' } })
  .execute()

const customerId = customer.id
```

```typescript
// or give it a stable key
await apiRoot
  .products()
  .post({ body: { key: 'boots', productType: { typeId: 'product-type', key: 'shoe' }, name: { en: 'Boots' }, slug: { en: 'boots' } } })
  .execute()

const product = await apiRoot
  .products()
  .withKey({ key: 'boots' })
  .get()
  .execute()
```

## Order matters: create dependencies first

commercetools resources reference each other (a product needs a product type; a
cart references a customer). Create the dependencies first, then the resources
that reference them — exactly as you would against a real project.

```typescript
// 1. product type
await apiRoot.productTypes().post({ body: { key: 'shoe', name: 'Shoe', description: '', attributes: [] } }).execute()

// 2. product referencing it
await apiRoot.products().post({ body: {
  key: 'boots',
  productType: { typeId: 'product-type', key: 'shoe' },
  name: { en: 'Boots' },
  slug: { en: 'boots' },
} }).execute()
```

## Choosing which project

If you set `defaultProjectKey`, build your `apiRoot` with that key. To target a
different project, build a client (or `withProjectKey`) for that key.

## Clearing data between tests

Reset all created data with `ctMock.clear()` — typically in an `afterEach` hook —
so tests stay isolated:

```typescript
afterEach(async () => {
  mswServer.resetHandlers()
  await ctMock.clear()
})
```

## Fixtures

For larger or reusable draft bodies, build fixtures with a factory such as
[fishery](https://github.com/thoughtbot/fishery). See the
[Fixtures recipe](/commercetools-node-mock/recipes/fixtures/).

## Reading data back

To assert on stored state, read it back through the API (`get`, `withId`,
`withKey`, or a query). See
[Querying data](/commercetools-node-mock/usage/querying-data/).
