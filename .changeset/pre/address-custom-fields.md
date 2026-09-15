---
"@labdigital/commercetools-mock": minor
---

Support custom fields on addresses. `BaseAddress` is polymorphic between read and write, so address drafts can carry a `custom` field holding a `CustomFieldsDraft`. Drafts and update actions carrying such an address (customer, business unit, cart, order and channel) now resolve it to `CustomFields` against the referenced type, returning a 400 `ReferencedResourceNotFound` when the type does not exist. In strict mode the generated draft schemas accept and validate `custom` on an address.

Customer and business unit creation, and the `addAddress` customer action, now go through the shared `createAddress` helper, which means the address `country` field is enforced there as well.
