---
"@labdigital/commercetools-mock": minor
---

Only mount resources under `/{projectKey}/in-store/key={storeKey}` that
commercetools actually exposes there.

The in-store prefix reused the project plugin wholesale, so all ~40 resource
families got an in-store twin while the API documents in-store endpoints for 18.
Requests like `POST /{projectKey}/in-store/key={storeKey}/extensions` returned
201 from the mock and 404 from commercetools, which is the wrong direction for a
mock to be wrong in: it let tests pass against calls that fail in production.

In-store now serves business units, cart discounts, carts, customers, discount
codes, `me/*`, orders, product projections, products, quote requests, quotes,
shipping methods, shopping lists and staged quotes. Everything else under that
prefix — including the project endpoint itself — now returns 404, as it does on
the real API. Project-level routes are unchanged.

This also cuts the router from 1408 route entries to 945, so building the
Fastify instance is roughly 40% faster.
