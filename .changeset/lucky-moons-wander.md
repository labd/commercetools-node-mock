---
"@labdigital/commercetools-mock": patch
---

Apply `sort` on `/product-projections` too.

`ProductProjectionRepository.query()` does not go through
`AbstractStorage.query()` — it transforms products itself, then filters, expands
and slices — so it did not pick up the `sort` support added in 4.3.0, even though
`ProductProjectionQueryParams` declares the parameter.

That left the endpoint most likely to be walked with a cursor
(`sort: "id asc"` with `where: 'id > "<last>"'`) still returning products in
insertion order, so such a walk skipped products against the mock while being
correct against the real API.
