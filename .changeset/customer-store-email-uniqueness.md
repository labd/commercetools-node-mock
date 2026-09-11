---
"@labdigital/commercetools-mock": patch
---

Scope customer email uniqueness to the stores a customer is assigned to. The same email can now be used in different stores, matching commercetools behaviour. Customers created through an in-store endpoint are assigned to that store, and the in-store password flow only matches customers of that store.

Implement the `addStore`, `removeStore` and `setStores` customer update actions, which re-validate email uniqueness for any store scope the customer newly enters (including becoming a global customer again).

Store resource identifiers are now validated by `key` as well as by `id`, so referencing a non-existent store in a draft returns a 400 `ReferencedResourceNotFound` error instead of silently passing through. This also fixes `getStoreKeyReference`, which previously always failed for `id`-based references.

In-store endpoints (`/{projectKey}/in-store/key={storeKey}/...`) now return a 404 `ResourceNotFound` when the store in the path does not exist, matching commercetools.
