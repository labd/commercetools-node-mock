# Commercetools Mocking library for Node
[<img src="https://img.shields.io/npm/v/@labdigital/commercetools-mock">](https://www.npmjs.com/package/@labdigital/commercetools-mock)

This library mocks the Commercetools rest api to ease testing of your typescript
codebases interacting with the commercetools api. It uses the same proven approach
as our testing module in the [commercetools Python SDK](https://github.com/labd/commercetools-python-sdk/tree/main/src/commercetools/testing).



## Installation
```bash
yarn add --dev @labdigital/commercetools-mock
```


## Example


```typescript
import { CommercetoolsMock } from '@labdigital/commercetools-mock'

const ctMock = new CommercetoolsMock()

beforeAll(() => {
  ctMock.mockHttp('https://localhost')

  ctMock.addResource('type', {
    key: 'my-customt-ype',
    fieldDefinitions: [],
  })
})
```
