---
"@labdigital/commercetools-mock": major
---

Make the storage engine async to support pluggable persistent storage backends (e.g., SQLite, PostgreSQL). All `AbstractStorage` methods now return Promises. This is a breaking change for users who call `ctMock.project().unsafeAdd()`, `ctMock.project().get()`, or `ctMock.clear()` — these methods are now async and must be awaited.

### Breaking changes

- `ctMock.project().unsafeAdd(type, resource)` is now async — use `await ctMock.project().unsafeAdd(type, resource)`
- `ctMock.project().get(type, id)` is now async — use `await ctMock.project().get(type, id)`
- `ctMock.clear()` is now async — use `await ctMock.clear()`

### New features

- `AbstractStorage` and `InMemoryStorage` are now exported from the package, allowing custom storage backend implementations
- New `storage` option on `CommercetoolsMockOptions` to inject a custom storage backend
