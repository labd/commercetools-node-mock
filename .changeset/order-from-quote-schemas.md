---
"@labdigital/commercetools-mock": patch
---

Regenerate the zod draft schemas from the current commercetools OpenAPI spec.

Picks up optional fields added upstream since the last run — extension
dependencies, expansion paths and additional context, inventory entry stock
levels and reservation expiry, shipping method stores and carrier, store
storefront URLs — plus the `reservation` and `variant` reference type ids and
the `ReserveOnCart` inventory mode.
