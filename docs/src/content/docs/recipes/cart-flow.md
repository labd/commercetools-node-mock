---
title: Recipe — Testing a cart flow
description: Create a product through the API, create a cart, add a line item with an update action and assert on the result.
---

This recipe drives a small checkout flow through the commercetools SDK against
the mock. It shows the "create through the API, act, assert" pattern for a
stateful resource and an update action.

It assumes an `apiRoot` configured to talk to the mock (see
[Quick start](/commercetools-node-mock/getting-started/quick-start/)) and the
[shared setup](/commercetools-node-mock/recipes/vitest-setup/).

```typescript
import { expect, test } from 'vitest'
import { apiRoot } from '../test/ct-client'

test('adds a line item to a cart', async () => {
  // 1. Create a product type and a product with a SKU
  await apiRoot
    .productTypes()
    .post({ body: { key: 'shoe', name: 'Shoe', description: '', attributes: [] } })
    .execute()

  await apiRoot
    .products()
    .post({
      body: {
        key: 'boots',
        productType: { typeId: 'product-type', key: 'shoe' },
        name: { en: 'Boots' },
        slug: { en: 'boots' },
        masterVariant: {
          sku: 'SKU-BOOTS',
          prices: [{ value: { currencyCode: 'EUR', centAmount: 5000 } }],
        },
        publish: true,
      },
    })
    .execute()

  // 2. Create a cart
  const { body: cart } = await apiRoot
    .carts()
    .post({ body: { currency: 'EUR' } })
    .execute()

  // 3. Add the product as a line item (update action)
  const { body: updated } = await apiRoot
    .carts()
    .withId({ ID: cart.id })
    .post({
      body: {
        version: cart.version,
        actions: [{ action: 'addLineItem', sku: 'SKU-BOOTS', quantity: 2 }],
      },
    })
    .execute()

  // 4. Assert
  expect(updated.lineItems).toHaveLength(1)
  expect(updated.lineItems[0].quantity).toBe(2)
})
```

The mock applies the `addLineItem` update action, bumps the cart `version`, and
resolves the price — the same behaviour your production code relies on.
