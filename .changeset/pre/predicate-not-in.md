---
"@labdigital/commercetools-mock": patch
---

Support the infix `not in` operator in query predicates.

A predicate such as `custom(fields(externalOrderType not in :hiddenOrderTypes))`
failed with `Unexpected token: not`, because `not` was only understood as a
prefix (`not (...)`). Real commercetools documents `age not in (42, 43, 44)` as
a membership check, so `not in` now matches every resource that `in` would not.

The prefix `not (...)` form also forwards query variables to the negated
expression now, so `not (field in :values)` no longer ignores `:values`.
