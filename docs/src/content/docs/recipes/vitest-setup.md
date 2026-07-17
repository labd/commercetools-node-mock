---
title: Recipe — Vitest setup
description: A reusable Vitest setup file that wires up commercetools-node-mock and msw once for your whole test suite.
---

Rather than repeating the lifecycle hooks in every test file, centralise them in
a Vitest setup file.

## `test/ct-setup.ts`

```typescript
import { CommercetoolsMock } from '@labdigital/commercetools-mock'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'

export const ctMock = new CommercetoolsMock({
  defaultProjectKey: 'my-project',
})

export const mswServer = setupServer()

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => ctMock.registerHandlers(mswServer))
afterEach(async () => {
  mswServer.resetHandlers()
  await ctMock.clear()
})
afterAll(() => mswServer.close())
```

## `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./test/ct-setup.ts'],
  },
})
```

## Using it in a test

Create data through the API (see [Quick start](/commercetools-node-mock/getting-started/quick-start/)
for the `apiRoot` client) and read it back:

```typescript
import { expect, test } from 'vitest'
import { apiRoot } from '../test/ct-client'

test('creates and reads a customer', async () => {
  await apiRoot
    .customers()
    .post({ body: { email: 'jane@example.com', password: 's3cret' } })
    .execute()

  const { body } = await apiRoot
    .customers()
    .get({ queryArgs: { where: 'email = "jane@example.com"' } })
    .execute()

  expect(body.results).toHaveLength(1)
})
```

The `afterEach` `clear()` keeps each test isolated, so order doesn't matter.
