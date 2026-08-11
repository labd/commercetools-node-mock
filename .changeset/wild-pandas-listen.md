---
"@labdigital/commercetools-mock": minor
---

Apply the `sort` query parameter.

`sort` was accepted and typed but never applied, so `query()` returned resources
in insertion order. Cursor-based paging — `sort: "id asc"` with
`where: 'id > "<last>"'`, which is how consumers walk a large collection — quietly
skipped resources against the mock while being correct against the real API.

Supports `field`, `field asc` and `field desc`, dot-separated paths
(`name.en-GB`), and several clauses passed as an array. Numbers compare
numerically; everything else compares as a string, which orders ISO timestamps
correctly. Strings use `<`/`>` rather than a locale-aware comparison so that
sorting and the `where` predicate agree on the ordering — without that, a cursor
can step over resources. A missing value counts as larger than any present one,
so it sorts last ascending and first descending. Sorting is applied before
`offset`/`limit`, and is stable.
