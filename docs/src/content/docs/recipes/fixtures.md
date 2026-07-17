---
title: Recipe — Fixtures with fishery
description: Build reusable, typed draft bodies with fishery and create them through the mock's API.
---

For anything beyond a trivial resource, a fixture factory keeps tests readable
and consistent. [fishery](https://github.com/thoughtbot/fishery) pairs well with
the mock — build **draft bodies** once and reuse them across tests.

## Install

```bash
pnpm add -D fishery
```

## A customer-draft factory

```typescript
import type { CustomerDraft } from '@commercetools/platform-sdk'
import { Factory } from 'fishery'

export const customerDraftFactory = Factory.define<CustomerDraft>(
  ({ sequence }) => ({
    email: `customer-${sequence}@example.com`,
    password: 's3cret',
  }),
)
```

## Use it

```typescript
import { customerDraftFactory } from '../test/factories/customer'
import { apiRoot } from '../test/ct-client'

test('…', async () => {
  const draft = customerDraftFactory.build({ firstName: 'Jane' })

  const { body } = await apiRoot.customers().post({ body: draft }).execute()
  // body.customer.id is the generated id you can assert against
})
```

## Tips

- Override only the fields a given test cares about; let the factory fill the
  rest.
- Use the `sequence` for stable, unique emails/keys.
- Give resources a stable `key` in the draft so later steps can look them up with
  `withKey` without capturing the generated id.
- Build related drafts with linked factories (e.g. an order draft that references
  a customer created by another factory) so references resolve when you expand
  them.
