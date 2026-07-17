---
title: Recipe — Custom types & fields
description: Create a Type through the API and use its custom fields on another resource.
---

commercetools custom fields are defined by a `Type`. This recipe creates a type
and attaches custom fields to a customer — all through the API.

```typescript
import { expect, test } from 'vitest'
import { apiRoot } from '../test/ct-client'

test('customer carries custom fields', async () => {
  // 1. Define a Type targeting customers
  await apiRoot
    .types()
    .post({
      body: {
        key: 'customer-extra',
        name: { en: 'Customer extra fields' },
        resourceTypeIds: ['customer'],
        fieldDefinitions: [
          {
            name: 'loyaltyId',
            label: { en: 'Loyalty ID' },
            required: false,
            type: { name: 'String' },
            inputHint: 'SingleLine',
          },
        ],
      },
    })
    .execute()

  // 2. Create a customer that uses the type
  const { body: created } = await apiRoot
    .customers()
    .post({
      body: {
        email: 'jane@example.com',
        password: 's3cret',
        custom: {
          type: { typeId: 'type', key: 'customer-extra' },
          fields: { loyaltyId: 'LOYAL-42' },
        },
      },
    })
    .execute()

  // 3. Read it back, expanding the type reference
  const { body: customer } = await apiRoot
    .customers()
    .withId({ ID: created.customer.id })
    .get({ queryArgs: { expand: ['custom.type'] } })
    .execute()

  expect(customer.custom?.fields.loyaltyId).toBe('LOYAL-42')
  expect(customer.custom?.type.obj?.key).toBe('customer-extra')
})
```

Step 3 uses commercetools
[reference expansion](https://docs.commercetools.com/api/general-concepts#reference-expansion)
to inline the `type` reference.
