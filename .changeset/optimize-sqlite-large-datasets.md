---
"@labdigital/commercetools-mock": patch
---

Fix performance degradation with large datasets (40k+ resources) in SQLite storage:

- Add indexed `container` and `co_key` columns to the SQLite resources table, replacing the O(n) `json_extract`-based custom object lookup with an O(log n) indexed query
- Include automatic schema migration for existing databases
- Add `count()` method to storage backends, enabling fast O(1) existence checks
- Short-circuit review statistics calculation when no reviews exist, avoiding a full table scan on every product creation/retrieval
