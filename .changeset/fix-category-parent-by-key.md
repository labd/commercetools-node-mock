---
"@labdigital/commercetools-mock": patch
---

Fix creating categories with a parent specified by key instead of id. Previously, only the `id` field was used when storing the parent reference, causing a "ResourceIdentifier requires an 'id' xor a 'key'" error when the parent was specified by key.
