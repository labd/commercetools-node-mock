---
"@labdigital/commercetools-mock": patch
---

Optimize custom object lookups by container and key from O(n) to O(1):

- Add a secondary in-memory index (container+key -> id) in InMemoryStorage, maintained on add/delete
- Add a `json_extract` expression index in SQLiteStorage for direct SQL lookup instead of loading all rows
- Replace the full-scan `all()` + `find()` in `CustomObjectRepository.getWithContainerAndKey()` with the new indexed lookup
