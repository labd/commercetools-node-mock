---
"@labdigital/commercetools-mock": patch
---

Fix `contains any` / `contains all` throwing on resources where the field is not
set.

The handler rejected any non-array value, so a predicate such as
`custom(fields(orderNumbers contains any ("R-123")))` raised
`The field 'orderNumbers' does not support this expression.` as soon as one
resource in the collection lacked the field — failing the entire query rather
than filtering that resource out. Real commercetools treats an unset set as
having no members, so it simply does not match.

An unset (`undefined` or `null`) field now evaluates to `false`. A field that is
present but is not a set still raises a `PredicateError`, since that is a
genuine type mismatch.
