---
"@labdigital/commercetools-mock": patch
---

Fix query predicates where a parenthesized group is followed by another clause.

The `(` nud did not consume its closing parenthesis, so the outer parse loop
stopped on it and everything after the group was silently dropped:
`(status="OPEN" or status="OVERDUE") and dueDate < "..."` was evaluated as just
the group, quietly widening a filter that should narrow. The same applied to
`in (...)`, `contains all/any (...)` and `nested(...)` groups followed by a
clause.

A predicate that cannot be consumed completely now raises a `PredicateError`
instead of matching against a partially parsed expression, so an unsupported or
malformed predicate surfaces at the point of use rather than returning the whole
collection.
