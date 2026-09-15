---
"@labdigital/commercetools-mock": patch
---

Enforce BusinessUnit key uniqueness within a project. Creating a business unit with a key that is already taken now returns a 400 `DuplicateField` error on the `key` field instead of silently storing a second unit under the same key.
