---
"@labdigital/commercetools-mock": minor
---

Persist `expansionPaths`, `dependencies` and `additionalContext` when creating
an API Extension.

The Extension repository only copied `key`, `timeoutInMs`, `destination` and
`triggers` out of the draft, so the three fields added by the 2026-03-12 API
release were silently dropped on create. `POST /{projectKey}/extensions` with
`expansionPaths` returned an extension without them, which made it look like
the field was rejected. The `setExpansionPaths`, `setDependencies` and
`setAdditionalContext` update actions were already implemented, so only the
create path was affected.

`dependencies` are now resolved through the storage layer like every other
resource identifier, so they can be given by `key` as well as by `id` (on both
create and `setDependencies`, which previously assumed `id` was set) and an
unknown dependency returns a `ReferencedResourceNotFound` error instead of a
reference with `id: undefined`.
