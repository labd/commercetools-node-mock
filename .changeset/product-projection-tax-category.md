---
"@labdigital/commercetools-mock": patch
---

Include the product-level references and meta fields on product projections.

`taxCategory`, `state`, `priceMode`, `metaTitle`, `metaKeywords` and
`searchKeywords` were dropped when a product was transformed into a
`ProductProjection`, even though the product resource stored them. They are now
carried through by both the product projection and product search endpoints, so
`expand=taxCategory` resolves and code that reads a projection's tax category —
to compute net/gross prices, for instance — can be tested against the mock.

Note that `searchKeywords` is non-optional on `ProductProjection`, so a
projection now always carries it (defaulting to `{}`). Tests that assert a whole
projection with `toEqual` need it added to their expected object.
