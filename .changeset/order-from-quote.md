---
"@labdigital/commercetools-mock": minor
---

Support creating an order from a quote, on `POST /{projectKey}/orders/quotes`
and `POST /{projectKey}/me/orders/quotes`.

Turning a quote into an order is the endpoint of the B2B quote flow and was the
one step that could not be exercised. The guards around it are modelled too,
since those are what a consumer wants to assert: the quote must be `Pending`
and not past its `validTo`, a stale `version` raises `ConcurrentModification`,
and `quoteStateToAccepted: true` moves the quote to `Accepted` as part of
creating the order. The order carries the quote's line items and prices —
nothing is re-priced — and references the quote it came from with
`origin: "Quote"`.
