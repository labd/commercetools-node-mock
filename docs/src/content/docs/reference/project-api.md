---
title: ProjectAPI
description: API reference for ProjectAPI — get and getRepository, returned by ctMock.project().
---

`ProjectAPI` is returned by
[`ctMock.project(projectKey?)`](/commercetools-node-mock/reference/commercetools-mock/)
and scopes operations to a single project. In tests you mostly create and read
data [through the commercetools API](/commercetools-node-mock/usage/seeding-data/);
`ProjectAPI` offers a couple of convenience methods for reading state directly.

```typescript
const api = ctMock.project('my-project')
```

## Methods

### `get(typeId, id, params?)`

```typescript
get<RT>(typeId: RT, id: string, params?: GetParams): Promise<ResourceMap[RT]>
```

Fetches a single resource by id, without going through the SDK. `params` accepts
`expand`.

```typescript
const order = await ctMock.project().get('order', orderId, {
  expand: ['customer'],
})
```

### `getRepository(typeId)`

```typescript
getRepository<RT>(typeId: RT): RepositoryMap[RT]
```

Returns the underlying repository for advanced use. Throws if there is no
repository for the type.

:::note
`getRepository` is a low-level escape hatch. Prefer reading through the API or
`get` for most tests.
:::

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `config` | `Config` | The resolved config (`strict` flag and storage) for this project. |
