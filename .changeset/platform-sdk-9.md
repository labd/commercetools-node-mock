---
"@labdigital/commercetools-mock": minor
---

Update dependencies and adapt to `@commercetools/platform-sdk` 9.4.0.

The SDK now requires `stores` on `ShippingMethod` and `DiscountCode` and
`inventory` on `Project`, so those are modelled and returned. It also adds
update actions the mock did not implement: `addStore`, `removeStore` and
`setStores` on shipping methods, and `setAdditionalContext`, `setDependencies`
and `setExpansionPaths` on extensions.

`basic-auth` 3.0.0 is ESM-only and dropped its default export, which broke every
OAuth token request; the import is now a named one.
