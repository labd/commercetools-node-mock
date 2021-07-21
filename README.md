# Commercetools Mocking library for Node

[<img src="https://img.shields.io/npm/v/@labdigital/commercetools-mock">](https://www.npmjs.com/package/@labdigital/commercetools-mock)
[![codecov](https://codecov.io/gh/labd/commercetools-node-mock/branch/main/graph/badge.svg?token=muKkNunJ95)](https://codecov.io/gh/labd/commercetools-node-mock)

This library mocks the Commercetools rest api to ease testing of your typescript
codebases interacting with the commercetools api. It uses the same proven approach
as our testing module in the [commercetools Python SDK](https://github.com/labd/commercetools-python-sdk/tree/main/src/commercetools/testing).

## Installation

```bash
yarn add --dev @labdigital/commercetools-mock
```

## Example

```typescript
import { CommercetoolsMock, getBaseResourceProperties } from '@labdigital/commercetools-mock'

const ctMock = new CommercetoolsMock({
  enableAuthentication: false,
  validateCredentials: false,
})

beforeAll(() => {
  ctMock.start()

  ctMock.project('my-project').add('type', {
    ...getBaseResourceProperties()
    key: 'my-customt-type',
    fieldDefinitions: [],
  })
})

afterAll(() => {
  ctMock.stop()
})

afterEach(() => {
  ctMock.clear()
})
```

## Adding a resource

Implement the following:

- New repository in src/repositories
- New service in src/services
- Add new service to src/ctMock.ts ctMock.\_services
- Add new service to src/storage.ts InMemoryStorage
- Adjust src/types.ts RepositoryMap and possibly serviceTypes
