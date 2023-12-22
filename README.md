# Commercetools Mocking library for Node

[<img src="https://img.shields.io/npm/v/@labdigital/commercetools-mock">](https://www.npmjs.com/package/@labdigital/commercetools-mock)
[![codecov](https://codecov.io/gh/labd/commercetools-node-mock/branch/main/graph/badge.svg?token=muKkNunJ95)](https://codecov.io/gh/labd/commercetools-node-mock)

This library mocks the Commercetools rest API to ease testing of your typescript
codebases interacting with the commercetools api. It uses the same proven
approach as our testing module in the
[commercetools Python SDK](https://github.com/labd/commercetools-python-sdk/tree/main/src/commercetools/testing).

Since version 2 of this library it is based on [msw](https://mswjs.io/) instead
of nock. It is now therefore als recommended to manage the msw server yourself
and use the `registerHandlers` method to register the handlers on this server.

This allows you to use the same server for mocking other API's as well.

## Installation

```bash
yarn add --dev @labdigital/commercetools-mock
```

## Docker image

This codebase is also available as a docker image where it provides a runnable
http server exposing the mocked endpoints. See
https://hub.docker.com/r/labdigital/commercetools-mock-server

## Example

```typescript
import { CommercetoolsMock, getBaseResourceProperties } from '@labdigital/commercetools-mock'
import { setupServer } from 'msw/node'

const ctMock = new CommercetoolsMock({
  apiHost: 'https://localhost',
  authHost: 'https://localhost',
  enableAuthentication: false,
  validateCredentials: false,
  defaultProjectKey: 'my-project',
  silent: true,
})

describe('A module', () => {
  beforeAll(() => {
    const server = setupServer()
    ctMock.registerHandlers(server)

    ctMock.project().add('type', {
      ...getBaseResourceProperties()
      key: 'my-customt-type',
      fieldDefinitions: [],
    })
  })

  afterAll(() => {
    server.clearHandlers()
    ctMock.stop()
  })

  afterEach(() => {
    ctMock.clear()
  })

  test('my function', async () => {
    ctMock.project().add('customer', customerFixture)

    const res = await myFunction()

    expect(res).toEqual(true)
  })
})
```

## Contributing


### Adding a new service
Implement the following:

- New repository in src/repositories
- New service in src/services
- Add new service to src/ctMock.ts ctMock.\_services
- Add new service to src/storage.ts InMemoryStorage
- Adjust src/types.ts RepositoryMap and possibly serviceTypes

### Releasing

This codebases use [@changesets](https://github.com/changesets/changesets) for release and version management

- Create a new changeset using `pnpm changeset`
- Push the changes to the `main` branch.
- GitHub actions will create a release PR. When the release is ready merge the release branch
